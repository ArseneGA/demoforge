import type { Framework } from './framework'

export interface DetectedRoute {
  path: string
  source_file: string
  is_dynamic: boolean
  params: string[]
  kind: 'page' | 'api' | 'layout'
}

// Convert file system path to URL route
function fileToRoute(filePath: string, framework: Framework): string | null {
  let p = filePath

  // Strip src/ prefix
  p = p.replace(/^src\//, '')

  if (framework === 'next-app') {
    // app/dashboard/page.tsx → /dashboard
    // app/(marketing)/about/page.tsx → /about (route groups stripped)
    if (!p.startsWith('app/')) return null
    p = p.replace(/^app\//, '')
    p = p.replace(/\/page\.(tsx?|jsx?)$/, '')
    p = p.replace(/\/route\.(tsx?|jsx?)$/, '')
    // Remove route groups: (group-name)
    p = p.replace(/\([^)]+\)\//g, '')
    if (!p) return '/'
    return '/' + p
  }

  if (framework === 'next-pages') {
    if (!p.startsWith('pages/')) return null
    p = p.replace(/^pages\//, '')
    // Exclude special files
    if (/^_/.test(p) || p.startsWith('api/')) return null
    p = p.replace(/\.(tsx?|jsx?)$/, '')
    p = p.replace(/\/index$/, '')
    if (!p || p === 'index') return '/'
    return '/' + p
  }

  return null
}

function isDynamicRoute(routePath: string): { isDynamic: boolean; params: string[] } {
  const params: string[] = []
  // Next.js [param], [...param], [[...param]]
  const matches = routePath.matchAll(/\[\.{0,3}([^\]]+)\]/g)
  for (const m of matches) { if (m[1]) params.push(m[1]) }
  return { isDynamic: params.length > 0, params }
}

export function extractRoutesFromSource(
  files: Array<{ path: string; content: string }>
): DetectedRoute[] {
  const routes: DetectedRoute[] = []
  const seen = new Set<string>()

  // Blacklist: paths that look like route patterns but aren't UI routes
  const isBlacklisted = (p: string) =>
    p.startsWith('/api/') || p.includes('.') || p.length > 60

  const addRoute = (raw: string, sourcePath: string) => {
    if (!raw || raw.includes('*') || isBlacklisted(raw)) return
    // Normalize: ensure leading slash, strip trailing slash (except root)
    const routePath = (raw.startsWith('/') ? raw : '/' + raw).replace(/\/$/, '') || '/'
    if (seen.has(routePath)) return
    seen.add(routePath)
    const { isDynamic, params } = isDynamicRoute(routePath)
    routes.push({ path: routePath, source_file: sourcePath, is_dynamic: isDynamic, params, kind: 'page' })
  }

  for (const file of files) {
    const c = file.content

    // <Route path="..." or <Route path='...'
    for (const m of c.matchAll(/<Route[^>]*?\spath=["'`]([^"'`\s>]+)["'`]/g)) {
      if (m[1]) addRoute(m[1], file.path)
    }

    // path: "..." in object literals (route definitions)
    for (const m of c.matchAll(/\bpath\s*:\s*["'`]([^"'`]+)["'`]/g)) {
      if (m[1]) addRoute(m[1], file.path)
    }

    // createBrowserRouter / useRoutes array — pick up all path values
    if (c.includes('createBrowserRouter') || c.includes('useRoutes')) {
      for (const m of c.matchAll(/["'`]path["'`]\s*:\s*["'`]([^"'`]+)["'`]/g)) {
        if (m[1]) addRoute(m[1], file.path)
      }
    }
  }

  return routes
}

export function extractRoutes(
  files: Array<{ path: string }>,
  framework: Framework
): DetectedRoute[] {
  const routes: DetectedRoute[] = []

  for (const file of files) {
    const p = file.path.replace(/^src\//, '')

    // Page routes
    const isPage =
      (framework === 'next-app' && /\/page\.(tsx?|jsx?)$/.test(p)) ||
      (framework === 'next-pages' && /^pages\/[^_][^/]*\.(tsx?|jsx?)$/.test(p) && !p.startsWith('pages/api/')) ||
      (framework === 'next-pages' && /^pages\/[^_].*\/[^_][^/]*\.(tsx?|jsx?)$/.test(p) && !p.includes('/api/'))

    if (isPage) {
      const routePath = fileToRoute(file.path, framework)
      if (routePath) {
        const { isDynamic, params } = isDynamicRoute(routePath)
        routes.push({
          path: routePath,
          source_file: file.path,
          is_dynamic: isDynamic,
          params,
          kind: 'page',
        })
      }
    }

    // API routes
    const isApi =
      (framework === 'next-app' && /\/route\.(tsx?|jsx?)$/.test(p) && p.startsWith('app/api/')) ||
      (framework === 'next-pages' && p.startsWith('pages/api/'))

    if (isApi) {
      let apiPath = p
        .replace(/^app\/api\//, '/api/')
        .replace(/\/route\.(tsx?|jsx?)$/, '')
        .replace(/^pages\/api\//, '/api/')
        .replace(/\.(tsx?|jsx?)$/, '')
      const { isDynamic, params } = isDynamicRoute(apiPath)
      routes.push({
        path: apiPath,
        source_file: file.path,
        is_dynamic: isDynamic,
        params,
        kind: 'api',
      })
    }
  }

  // Sort: static routes first, then dynamic
  return routes.sort((a, b) => {
    if (a.is_dynamic && !b.is_dynamic) return 1
    if (!a.is_dynamic && b.is_dynamic) return -1
    return a.path.localeCompare(b.path)
  })
}

export function countLOC(files: Array<{ content: string }>): number {
  return files.reduce((sum, f) => sum + f.content.split('\n').length, 0)
}
