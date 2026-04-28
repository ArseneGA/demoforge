export interface DesignTokens {
  colors: Record<string, string>
  typography: { sans?: string; mono?: string; display?: string }
  radius: Record<string, string>
  spacing: Record<string, string>
  logo_url: string | null
  favicon_url: string | null
  source_files: string[]
}

// Extract hex/hsl/rgb colors from a string value
function normalizeColor(v: string): string | null {
  v = v.trim()
  if (/^#[0-9a-f]{3,8}$/i.test(v)) return v
  if (/^hsl/.test(v)) return v
  if (/^rgb/.test(v)) return v
  if (/^oklch/.test(v)) return v
  return null
}

function flattenColors(obj: Record<string, unknown>, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}-${k}` : k
    if (typeof v === 'string') {
      const c = normalizeColor(v)
      if (c) result[key] = c
    } else if (typeof v === 'object' && v !== null) {
      Object.assign(result, flattenColors(v as Record<string, unknown>, key))
    }
  }
  return result
}

export function extractFromTailwindConfig(content: string, filePath: string): Partial<DesignTokens> & { source_files: string[] } {
  const tokens: Partial<DesignTokens> & { source_files: string[] } = { source_files: [filePath] }

  // Colors: look for theme.extend.colors or theme.colors
  const colorsMatch = content.match(/colors\s*:\s*\{([\s\S]*?)\}/m)
  if (colorsMatch) {
    // Simple regex extraction for common patterns
    const colorEntries: Record<string, string> = {}
    const hexMatches = content.matchAll(/['"]?([\w-]+)['"]?\s*:\s*['"]?(#[0-9a-fA-F]{3,8}|hsl\([^)]+\)|oklch\([^)]+\))['"]?/g)
    for (const m of hexMatches) {
      if (m[1] && m[2]) colorEntries[m[1]] = m[2]
    }
    if (Object.keys(colorEntries).length > 0) tokens.colors = colorEntries
  }

  // fontFamily
  const fontMatch = content.match(/fontFamily\s*:\s*\{([\s\S]*?)\}/m)
  const fontBody = fontMatch?.[1]
  if (fontBody) {
    const sans = fontBody.match(/sans\s*:\s*\[?\s*['"]([^'"]+)['"]/)
    const mono = fontBody.match(/mono\s*:\s*\[?\s*['"]([^'"]+)['"]/)
    const display = fontBody.match(/display\s*:\s*\[?\s*['"]([^'"]+)['"]/)
    tokens.typography = {
      sans: sans?.[1],
      mono: mono?.[1],
      display: display?.[1],
    }
  }

  // borderRadius
  const radiusMatch = content.match(/borderRadius\s*:\s*\{([\s\S]*?)\}/m)
  const radiusBody = radiusMatch?.[1]
  if (radiusBody) {
    const radius: Record<string, string> = {}
    const entries = radiusBody.matchAll(/['"]?([\w-]+)['"]?\s*:\s*['"]([^'"]+)['"]/g)
    for (const m of entries) { if (m[1] && m[2]) radius[m[1]] = m[2] }
    if (Object.keys(radius).length > 0) tokens.radius = radius
  }

  return tokens
}

export function extractFromCSSVars(content: string, filePath: string): Partial<DesignTokens> & { source_files: string[] } {
  const tokens: Partial<DesignTokens> & { source_files: string[] } = { source_files: [filePath] }
  const colors: Record<string, string> = {}
  const typography: DesignTokens['typography'] = {}

  // CSS custom properties: --name: value
  const varMatches = content.matchAll(/--([a-zA-Z0-9-]+)\s*:\s*([^;}\n]+)/g)
  for (const m of varMatches) {
    if (!m[1] || !m[2]) continue
    const name = m[1].trim()
    const value = m[2].trim()

    if (name.includes('color') || name.includes('bg') || name.includes('accent') || name.includes('border')) {
      const c = normalizeColor(value)
      if (c) colors[name] = c
    }
    const fontVal = (v: string) => v.split(',')[0]?.trim().replace(/['"]/g, '') ?? v
    if (name.includes('font-sans') || name === 'font-sans') typography.sans = fontVal(value)
    if (name.includes('font-mono') || name === 'font-mono') typography.mono = fontVal(value)
    if (name.includes('font-display') || name === 'font-display') typography.display = fontVal(value)
  }

  if (Object.keys(colors).length > 0) tokens.colors = colors
  if (Object.keys(typography).length > 0) tokens.typography = typography

  return tokens
}

export function detectLogoAndFavicon(files: Array<{ path: string }>): { logo: string | null; favicon: string | null } {
  const paths = files.map(f => f.path)

  const logoPatterns = ['public/logo', 'src/assets/logo', 'app/icon', 'public/icon', 'assets/logo']
  const faviconPatterns = ['public/favicon', 'app/favicon', 'public/icon']
  const imgExts = ['.svg', '.png', '.jpg', '.webp', '.ico']

  let logo = null
  let favicon = null

  for (const p of paths) {
    if (!logo && logoPatterns.some(pat => p.toLowerCase().includes(pat)) && imgExts.some(e => p.endsWith(e))) {
      logo = p
    }
    if (!favicon && faviconPatterns.some(pat => p.toLowerCase().includes(pat)) && imgExts.some(e => p.endsWith(e))) {
      favicon = p
    }
  }

  return { logo, favicon }
}

export function mergeTokens(...partial: Array<Partial<DesignTokens> & { source_files: string[] }>): DesignTokens {
  const result: DesignTokens = {
    colors: {},
    typography: {},
    radius: {},
    spacing: {},
    logo_url: null,
    favicon_url: null,
    source_files: [],
  }

  for (const p of partial) {
    if (p.colors) Object.assign(result.colors, p.colors)
    if (p.typography) Object.assign(result.typography, p.typography)
    if (p.radius) Object.assign(result.radius, p.radius)
    if (p.spacing) Object.assign(result.spacing, p.spacing)
    if (p.logo_url) result.logo_url = p.logo_url
    if (p.favicon_url) result.favicon_url = p.favicon_url
    result.source_files.push(...p.source_files)
  }

  return result
}
