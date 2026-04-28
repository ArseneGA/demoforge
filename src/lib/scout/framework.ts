export type Framework = 'next-app' | 'next-pages' | 'react-vite' | 'react-cra' | 'unsupported'
export type UILib = 'shadcn' | 'mui' | 'chakra' | 'mantine' | 'tailwind-raw' | 'custom'
export type Language = 'typescript' | 'javascript'

export interface FrameworkInfo {
  framework: Framework
  uiLib: UILib
  language: Language
  supported: boolean
  unsupportedReason?: string
}

export function detectFramework(
  files: Array<{ path: string }>,
  packageJsonContent?: string
): FrameworkInfo {
  const paths = new Set(files.map(f => f.path))

  let deps: Record<string, string> = {}
  let devDeps: Record<string, string> = {}

  if (packageJsonContent) {
    try {
      const pkg = JSON.parse(packageJsonContent)
      deps = pkg.dependencies ?? {}
      devDeps = pkg.devDependencies ?? {}
    } catch { /* ignore */ }
  }

  const all = { ...deps, ...devDeps }

  // Language
  const language: Language = 'typescript' in all || paths.has('tsconfig.json') ? 'typescript' : 'javascript'

  // Unsupported frameworks — block early
  const unsupportedFrameworks = [
    ['vue', 'Vue'],
    ['nuxt', 'Nuxt'],
    ['svelte', 'Svelte'],
    ['@sveltejs/kit', 'SvelteKit'],
    ['solid-js', 'Solid.js'],
    ['@solidjs/router', 'Solid.js'],
    ['astro', 'Astro'],
    ['@remix-run/react', 'Remix'],
    ['ember-cli', 'Ember'],
    ['angular', 'Angular'],
    ['@angular/core', 'Angular'],
  ]

  for (const [pkg, name] of unsupportedFrameworks) {
    if (pkg && pkg in all) {
      return {
        framework: 'unsupported',
        uiLib: 'custom',
        language,
        supported: false,
        unsupportedReason: `Framework ${name} non supporté pour l'instant. DemoForge gère React et Next.js au MVP.`,
      }
    }
  }

  // Next.js
  if ('next' in deps || 'next' in devDeps) {
    const hasAppDir = [...paths].some(p => p.startsWith('app/') || p.startsWith('src/app/'))
    const framework: Framework = hasAppDir ? 'next-app' : 'next-pages'
    return { framework, uiLib: detectUILib(all), language, supported: true }
  }

  // React (CRA or Vite)
  if ('react' in all) {
    const framework: Framework = 'vite' in devDeps || '@vitejs/plugin-react' in devDeps ? 'react-vite' : 'react-cra'
    return { framework, uiLib: detectUILib(all), language, supported: true }
  }

  return {
    framework: 'unsupported',
    uiLib: 'custom',
    language,
    supported: false,
    unsupportedReason: 'Aucun framework supporté détecté (React ou Next.js requis).',
  }
}

function detectUILib(deps: Record<string, string>): UILib {
  if ('@shadcn/ui' in deps || 'shadcn' in deps) return 'shadcn'
  if ('@mui/material' in deps) return 'mui'
  if ('@chakra-ui/react' in deps) return 'chakra'
  if ('@mantine/core' in deps) return 'mantine'
  if ('tailwindcss' in deps) return 'tailwind-raw'
  return 'custom'
}
