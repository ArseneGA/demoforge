import { getGitHubApp } from '@/lib/github'

export interface RepoFile {
  path: string
  content: string
  size: number
}

export interface RepoTree {
  files: Array<{ path: string; size: number }>
  defaultBranch: string
  commitSha: string
}

const RELEVANT_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.css', '.scss'])
const ALWAYS_FETCH = new Set(['package.json', 'package-lock.json', 'pnpm-lock.yaml'])
const CONFIG_PATTERNS = ['tailwind.config', 'next.config', 'vite.config', 'tsconfig', 'theme']
const IGNORED_DIRS = new Set(['node_modules', '.next', 'dist', 'build', '.git', 'coverage', '.cache'])

function isRelevant(path: string): boolean {
  const parts = path.split('/')
  if (parts.some(p => IGNORED_DIRS.has(p))) return false

  const filename = parts[parts.length - 1] ?? ''
  if (ALWAYS_FETCH.has(filename)) return true
  if (CONFIG_PATTERNS.some(p => filename.startsWith(p))) return true

  const ext = '.' + (filename.split('.').pop() ?? '')
  if (!RELEVANT_EXTENSIONS.has(ext)) return false

  // Prioritize app/, pages/, src/, components/
  const topDir = parts[0] ?? ''
  return ['app', 'pages', 'src', 'components', 'lib', 'hooks', 'styles', 'types'].includes(topDir)
}

export async function fetchRepoTree(
  installId: number,
  owner: string,
  repo: string,
  branch: string
): Promise<RepoTree> {
  const app = getGitHubApp()
  const octokit = await app.getInstallationOctokit(installId)

  // Get branch info for commit sha
  const { data: branchData } = await octokit.request('GET /repos/{owner}/{repo}/branches/{branch}', {
    owner, repo, branch,
  })

  const commitSha = branchData.commit.sha

  // Get full tree recursively
  const { data: treeData } = await octokit.request('GET /repos/{owner}/{repo}/git/trees/{tree_sha}', {
    owner, repo, tree_sha: commitSha, recursive: '1',
  })

  const files = (treeData.tree as Array<{ path?: string; type?: string; size?: number }>)
    .filter(f => f.type === 'blob' && f.path && isRelevant(f.path))
    .map(f => ({ path: f.path!, size: f.size ?? 0 }))

  return { files, defaultBranch: branch, commitSha }
}

export async function fetchFileContents(
  installId: number,
  owner: string,
  repo: string,
  ref: string,
  paths: string[]
): Promise<RepoFile[]> {
  const app = getGitHubApp()
  const octokit = await app.getInstallationOctokit(installId)

  const results: RepoFile[] = []

  // Batch requests to avoid rate limits
  const BATCH = 10
  for (let i = 0; i < paths.length; i += BATCH) {
    const batch = paths.slice(i, i + BATCH)
    const settled = await Promise.allSettled(
      batch.map(path =>
        octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
          owner, repo, path, ref,
        })
      )
    )

    for (let j = 0; j < settled.length; j++) {
      const result = settled[j]
      const batchPath = batch[j]
      if (!result || !batchPath) continue
      if (result.status === 'fulfilled') {
        const data = result.value.data as { content?: string; size?: number }
        if (data.content) {
          const content = Buffer.from(data.content, 'base64').toString('utf-8')
          results.push({ path: batchPath, content, size: data.size ?? 0 })
        }
      }
    }
  }

  return results
}
