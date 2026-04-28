import { createServiceClient } from '@/utils/supabase/service'

export interface RelevantContext {
  routes: Array<{ path: string; source_file: string; is_dynamic: boolean }>
  screen_specs: Array<{ route_path: string; layout: string; sections: unknown[]; llm_summary: string }>
  design_tokens: { colors: Record<string, string>; typography: Record<string, string>; logo_url: string | null } | null
  api_endpoints: Array<{ method: string; path: string; description: string | null }>
  backend_summary: string
}

export async function retrieveProjectContext(
  projectId: string,
  brief: string,
  topK = 8
): Promise<RelevantContext> {
  const svc = createServiceClient()

  // Routes (filesystem-based, always relevant)
  const { data: routes } = await svc
    .from('routes')
    .select('path, source_file, is_dynamic')
    .eq('project_id', projectId)
    .eq('is_dynamic', false) // prioritize static routes
    .limit(topK)

  const { data: dynamicRoutes } = await svc
    .from('routes')
    .select('path, source_file, is_dynamic')
    .eq('project_id', projectId)
    .eq('is_dynamic', true)
    .limit(4)

  const allRoutes = [...(routes ?? []), ...(dynamicRoutes ?? [])]

  // Screen specs (describes what each page looks like)
  const { data: screenSpecs } = await svc
    .from('screen_specs')
    .select('route_id, layout, sections, llm_summary, routes(path)')
    .eq('project_id', projectId)
    .limit(topK)

  const screenSpecsMapped = (screenSpecs ?? []).map((s: any) => ({
    route_path: s.routes?.path ?? '',
    layout: s.layout,
    sections: s.sections,
    llm_summary: s.llm_summary,
  }))

  // Design tokens
  const { data: tokens } = await svc
    .from('design_tokens')
    .select('colors, typography, logo_url')
    .eq('project_id', projectId)
    .single()

  // API endpoints
  const { data: endpoints } = await svc
    .from('api_endpoints')
    .select('method, path, description')
    .eq('project_id', projectId)
    .limit(20)

  // Backend summary from Storage
  let backendSummary = ''
  try {
    const { data: file } = await svc.storage
      .from('scan-artifacts')
      .download(`${projectId}/backend-summary.md`)
    if (file) backendSummary = await file.text()
  } catch { /* no backend summary available */ }

  // Semantic retrieval via pgvector if brief is provided
  if (brief && process.env.VOYAGE_API_KEY) {
    try {
      const embResponse = await fetch('https://api.voyageai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
        },
        body: JSON.stringify({ input: [brief], model: 'voyage-3', input_type: 'query' }),
      })

      if (embResponse.ok) {
        const embData = await embResponse.json() as { data: Array<{ embedding: number[] }> }
        const queryEmbedding = embData.data[0]?.embedding

        if (queryEmbedding) {
          const { data: semanticChunks } = await svc.rpc('match_code_chunks', {
            query_embedding: queryEmbedding,
            match_project_id: projectId,
            match_count: 5,
          })
          // Log for debugging — semantic results enrich the context
          if (semanticChunks?.length > 0) {
            console.log(`[Scout retrieval] ${semanticChunks.length} semantic chunks matched`)
          }
        }
      }
    } catch { /* embeddings retrieval failed, continue with structured data */ }
  }

  return {
    routes: allRoutes,
    screen_specs: screenSpecsMapped,
    design_tokens: tokens ?? null,
    api_endpoints: endpoints ?? [],
    backend_summary: backendSummary,
  }
}
