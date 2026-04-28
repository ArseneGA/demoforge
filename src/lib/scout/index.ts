import { fetchRepoTree, fetchFileContents } from './github'
import { detectFramework } from './framework'
import { extractRoutes, extractRoutesFromSource, countLOC } from './routes'
import { extractFromTailwindConfig, extractFromCSSVars, detectLogoAndFavicon, mergeTokens } from './tokens'
import { inferScreenSpecsBatch, generateBackendSummary } from './claude'
import { generateEmbeddings } from './voyage'
import { createServiceClient } from '@/utils/supabase/service'

export interface ScanInput {
  project_id: string
  org_id: string
  job_id: string | null
  repo_full_name: string
  branch: string
  github_install_id_uuid: string // our UUID in github_installations table
}

export type ScanProgressCallback = (progress: number, message: string) => Promise<void>

export async function runScan(input: ScanInput, onProgress: ScanProgressCallback): Promise<void> {
  const svc = createServiceClient()
  const parts = input.repo_full_name.split('/')
  const owner = parts[0] ?? ''
  const repo = parts[1] ?? ''

  // Get the real GitHub installation ID
  const { data: installation } = await svc
    .from('github_installations')
    .select('github_install_id')
    .eq('id', input.github_install_id_uuid)
    .single()

  if (!installation) throw new Error('GitHub installation not found')

  const installId = installation.github_install_id

  // ─── Step 1: Fetch repo tree (5%)
  await onProgress(5, `Clonage de ${input.repo_full_name} @ ${input.branch}…`)

  const tree = await fetchRepoTree(installId, owner, repo, input.branch)

  // Update project with commit sha
  await svc.from('projects').update({ commit_sha: tree.commitSha }).eq('id', input.project_id)

  // ─── Step 2: Fetch package.json + detect framework (10%)
  await onProgress(10, 'Détection du framework…')

  const pkgFiles = await fetchFileContents(installId, owner, repo, input.branch,
    tree.files.filter(f => f.path === 'package.json' || f.path === 'src/package.json').map(f => f.path)
  )
  const pkgJson = pkgFiles.find(f => f.path.endsWith('package.json'))?.content

  const frameworkInfo = detectFramework(tree.files, pkgJson)

  if (!frameworkInfo.supported) {
    await svc.from('projects').update({
      scan_status: 'unsupported',
      scan_error: frameworkInfo.unsupportedReason,
    }).eq('id', input.project_id)
    throw new Error(frameworkInfo.unsupportedReason)
  }

  await svc.from('projects').update({
    framework: frameworkInfo.framework,
    ui_lib: frameworkInfo.uiLib,
    language: frameworkInfo.language,
  }).eq('id', input.project_id)

  // ─── Step 3 & 4: Fetch source files + extract routes (20-40%)
  await onProgress(20, `Framework détecté : ${frameworkInfo.framework} · ${frameworkInfo.language}`)
  await onProgress(30, 'Lecture des fichiers source…')

  // Prioritize: route files, config files, up to 80 files
  const priorityPaths = [
    ...tree.files.filter(f =>
      /page\.(tsx?|jsx?)$/.test(f.path) ||
      /route\.(tsx?|jsx?)$/.test(f.path) ||
      f.path.includes('App') || f.path.includes('app') ||
      f.path.includes('router') || f.path.includes('Router') ||
      f.path.includes('routes') || f.path.includes('Routes') ||
      f.path.endsWith('main.tsx') || f.path.endsWith('main.jsx') ||
      f.path.endsWith('main.ts') || f.path.endsWith('main.js') ||
      f.path.includes('tailwind.config') ||
      f.path.endsWith('globals.css') || f.path.endsWith('index.css') ||
      f.path.includes('theme.')
    ),
    ...tree.files.filter(f =>
      /\.(ts|tsx|js|jsx)$/.test(f.path) &&
      (f.path.startsWith('src/components/') || f.path.startsWith('components/') ||
       f.path.startsWith('src/pages/') || f.path.startsWith('pages/') ||
       f.path.startsWith('src/types/') || f.path.startsWith('types/'))
    ),
  ].slice(0, 80).map(f => f.path)

  const sourceFiles = await fetchFileContents(installId, owner, repo, input.branch, priorityPaths)

  const loc = countLOC(sourceFiles)
  await svc.from('projects').update({ loc_count: loc }).eq('id', input.project_id)

  await onProgress(40, `${sourceFiles.length} fichiers lus · ${loc.toLocaleString()} LOC`)

  // Route extraction (filesystem pour Next.js, source pour React Vite/CRA)
  let routes = extractRoutes(tree.files, frameworkInfo.framework)

  if (routes.length === 0 && (frameworkInfo.framework === 'react-vite' || frameworkInfo.framework === 'react-cra')) {
    // Pour react-vite/CRA : cherche dans tous les fichiers TSX/JSX qui peuvent contenir des routes
    const routerFiles = sourceFiles.filter(f =>
      /\.(tsx?|jsx?)$/.test(f.path) &&
      (f.path.includes('App') || f.path.includes('app') ||
       f.path.includes('router') || f.path.includes('Router') ||
       f.path.includes('routes') || f.path.includes('Routes') ||
       f.path.endsWith('main.tsx') || f.path.endsWith('main.jsx') ||
       f.path.endsWith('main.ts') || f.path.endsWith('main.js'))
    )
    if (routerFiles.length > 0) routes = extractRoutesFromSource(routerFiles)

    // Si toujours rien, tente sur tous les fichiers TSX (dernier recours)
    if (routes.length === 0) {
      routes = extractRoutesFromSource(sourceFiles.filter(f => /\.(tsx?|jsx?)$/.test(f.path)))
    }
  }

  // Persist routes — purge old first to avoid stale routes polluting Director
  await svc.from('routes').delete().eq('project_id', input.project_id)
  if (routes.length > 0) {
    await svc.from('routes').insert(
      routes.map(r => ({
        project_id: input.project_id,
        path: r.path,
        source_file: r.source_file,
        is_dynamic: r.is_dynamic,
        params: r.params,
        components: [],
      }))
    )
  }

  await onProgress(25, `${routes.length} routes détectées`)

  // ─── Step 5: Extract design tokens (50%)
  await onProgress(45, 'Extraction des design tokens…')

  const tokenSources = []
  for (const file of sourceFiles) {
    if (file.path.includes('tailwind.config')) {
      tokenSources.push(extractFromTailwindConfig(file.content, file.path))
    }
    if (file.path.endsWith('.css') || file.path.endsWith('globals.css')) {
      tokenSources.push(extractFromCSSVars(file.content, file.path))
    }
  }

  const { logo, favicon } = detectLogoAndFavicon(tree.files)
  const tokens = mergeTokens(...tokenSources)
  tokens.logo_url = logo
  tokens.favicon_url = favicon

  await svc.from('design_tokens').upsert({
    project_id: input.project_id,
    colors: tokens.colors,
    typography: tokens.typography,
    radius: tokens.radius,
    logo_url: tokens.logo_url,
    favicon_url: tokens.favicon_url,
    source_files: tokens.source_files,
  })

  await onProgress(50, 'Design tokens extraits · analyse Claude en cours…')

  // ─── Step 6: Claude — screen specs (70%)
  const fileContentsMap = new Map(sourceFiles.map(f => [f.path, f.content]))

  const screenSpecs = await inferScreenSpecsBatch(routes, fileContentsMap)

  // Purge old screen_specs before inserting new ones
  if (screenSpecs.length > 0) {
    await svc.from('screen_specs').delete().eq('project_id', input.project_id)
    for (const spec of screenSpecs) {
      const route = routes.find(r => r.path === spec.route_path)
      if (!route) continue

      const { data: routeRow } = await svc
        .from('routes')
        .select('id')
        .eq('project_id', input.project_id)
        .eq('path', spec.route_path)
        .single()

      if (routeRow) {
        await svc.from('screen_specs').upsert({
          project_id: input.project_id,
          route_id: routeRow.id,
          layout: spec.layout,
          sections: spec.sections,
          data_shapes: spec.data_shapes,
          llm_summary: spec.llm_summary,
        })
      }
    }
  }

  await onProgress(70, `${screenSpecs.length} écrans analysés · génération du backend summary…`)

  // ─── Step 7: Backend summary + API endpoints (80%)
  const apiFiles = sourceFiles.filter(f =>
    f.path.includes('/api/') || f.path.includes('pages/api/')
  )

  const { markdown: backendMd, endpoints } = await generateBackendSummary(apiFiles)

  // Store backend summary in Supabase Storage
  if (backendMd) {
    await svc.storage
      .from('scan-artifacts')
      .upload(`${input.project_id}/backend-summary.md`, backendMd, {
        contentType: 'text/markdown',
        upsert: true,
      })
  }

  // Persist API endpoints
  if (endpoints.length > 0) {
    await svc.from('api_endpoints').upsert(
      endpoints.map(e => ({
        project_id: input.project_id,
        method: e.method,
        path: e.path,
        body_shape: e.body_shape,
        response_shape: e.response_shape,
        description: e.description,
      })),
      { onConflict: 'project_id,method,path' } as never
    )
  }

  await onProgress(80, `${endpoints.length} endpoints API documentés · génération des embeddings…`)

  // ─── Step 8: Voyage AI embeddings (95%)
  const embeddingFiles = sourceFiles
    .filter(f => /\.(ts|tsx|js|jsx)$/.test(f.path))
    .slice(0, 50)

  const chunks = await generateEmbeddings(embeddingFiles)

  if (chunks.length > 0) {
    // Insert in batches of 50
    for (let i = 0; i < chunks.length; i += 50) {
      const batch = chunks.slice(i, i + 50)
      await svc.from('code_chunks').insert(
        batch.map(c => ({
          project_id: input.project_id,
          source_file: c.source_file,
          start_line: c.start_line,
          end_line: c.end_line,
          content: c.content,
          kind: c.kind,
          embedding: c.embedding ?? null,
        }))
      )
    }
  }

  await onProgress(95, `${chunks.length} chunks vectorisés · finalisation…`)

  // ─── Step 9: Mark as ready (100%)
  await svc.from('projects').update({
    scan_status: 'ready',
    scanned_at: new Date().toISOString(),
    has_new_commits: false,
  }).eq('id', input.project_id)

  await onProgress(100, 'Analyse terminée · prêt à scripter')
}
