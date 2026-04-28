import Anthropic from '@anthropic-ai/sdk'
import type { DetectedRoute } from './routes'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface ScreenSpec {
  route_path: string
  source_file: string
  layout: 'sidebar' | 'topnav' | 'centered' | 'split' | 'fullscreen'
  sections: Array<{ type: string; props?: Record<string, unknown> }>
  data_shapes: Array<{ name: string; fields: string[] }>
  llm_summary: string
}

export interface APIEndpoint {
  method: string
  path: string
  body_shape: Record<string, unknown> | null
  response_shape: Record<string, unknown> | null
  description: string
}

const SYSTEM_SCREEN = `You are Scout, a code analysis agent for DemoForge.
Analyze React/Next.js route files and extract screen structure for demo generation.
Respond ONLY with valid JSON, no markdown or explanation.`

const SYSTEM_BACKEND = `You are Scout, analyzing API routes for DemoForge.
Extract API endpoint details to generate realistic mock data for demos.
Respond ONLY with valid JSON array, no markdown.`

export async function inferScreenSpec(
  route: DetectedRoute,
  fileContent: string
): Promise<ScreenSpec> {
  const prompt = `Analyze this ${route.kind} file for route "${route.path}":

\`\`\`tsx
${fileContent.slice(0, 3000)}
\`\`\`

Return JSON with this exact shape:
{
  "layout": "sidebar|topnav|centered|split|fullscreen",
  "sections": [{"type": "kpi-grid|table|form|chart|list|hero|navbar|sidebar", "props": {}}],
  "data_shapes": [{"name": "EntityName", "fields": ["field1", "field2"]}],
  "summary": "1 sentence describing what this screen does for the user"
}`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: SYSTEM_SCREEN,
    messages: [{ role: 'user', content: prompt }],
  })

  const first = response.content[0]
  const text = first?.type === 'text' ? first.text : '{}'

  try {
    const parsed = JSON.parse(text)
    return {
      route_path: route.path,
      source_file: route.source_file,
      layout: parsed.layout ?? 'centered',
      sections: parsed.sections ?? [],
      data_shapes: parsed.data_shapes ?? [],
      llm_summary: parsed.summary ?? '',
    }
  } catch {
    return {
      route_path: route.path,
      source_file: route.source_file,
      layout: 'centered',
      sections: [],
      data_shapes: [],
      llm_summary: `Screen at ${route.path}`,
    }
  }
}

export async function generateBackendSummary(
  apiFiles: Array<{ path: string; content: string }>
): Promise<{ markdown: string; endpoints: APIEndpoint[] }> {
  if (apiFiles.length === 0) return { markdown: '', endpoints: [] }

  const filesContext = apiFiles
    .slice(0, 20)
    .map(f => `## ${f.path}\n\`\`\`ts\n${f.content.slice(0, 1500)}\n\`\`\``)
    .join('\n\n')

  const prompt = `Analyze these API route files and extract endpoint details:

${filesContext}

Return a JSON array of endpoints:
[{
  "method": "GET|POST|PUT|DELETE|PATCH",
  "path": "/api/example",
  "body_shape": {"field": "type"} or null,
  "response_shape": {"field": "type"},
  "description": "What this endpoint does in 1 sentence"
}]`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: SYSTEM_BACKEND,
    messages: [{ role: 'user', content: prompt }],
  })

  const first2 = response.content[0]
  const text = first2?.type === 'text' ? first2.text : '[]'

  let endpoints: APIEndpoint[] = []
  try {
    endpoints = JSON.parse(text)
  } catch {
    endpoints = []
  }

  // Generate markdown summary
  const markdown = [
    '# Backend API Summary',
    '',
    `${endpoints.length} endpoints detected.`,
    '',
    ...endpoints.map(e => `## \`${e.method} ${e.path}\`\n${e.description}\n`),
  ].join('\n')

  return { markdown, endpoints }
}

export async function inferScreenSpecsBatch(
  routes: DetectedRoute[],
  fileContents: Map<string, string>
): Promise<ScreenSpec[]> {
  const pageRoutes = routes.filter(r => r.kind === 'page').slice(0, 15)
  const specs: ScreenSpec[] = []

  for (const route of pageRoutes) {
    const content = fileContents.get(route.source_file)
    if (!content) continue
    try {
      const spec = await inferScreenSpec(route, content)
      specs.push(spec)
    } catch {
      specs.push({
        route_path: route.path,
        source_file: route.source_file,
        layout: 'centered',
        sections: [],
        data_shapes: [],
        llm_summary: `Page at ${route.path}`,
      })
    }
  }

  return specs
}
