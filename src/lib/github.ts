import { App } from '@octokit/app'

let _app: App | null = null

export function getGitHubApp(): App {
  if (_app) return _app

  const appId = process.env.GITHUB_APP_ID
  const privateKey = process.env.GITHUB_APP_PRIVATE_KEY
  const clientId = process.env.GITHUB_APP_CLIENT_ID
  const clientSecret = process.env.GITHUB_APP_CLIENT_SECRET
  const webhookSecret = process.env.GITHUB_APP_WEBHOOK_SECRET

  if (!appId || !privateKey || !clientId || !clientSecret) {
    throw new Error('GitHub App credentials not configured. Set GITHUB_APP_ID, GITHUB_APP_PRIVATE_KEY, GITHUB_APP_CLIENT_ID, GITHUB_APP_CLIENT_SECRET in .env.local')
  }

  // Private key peut être en base64 ou PEM direct
  const decodedKey = privateKey.includes('BEGIN RSA')
    ? privateKey
    : Buffer.from(privateKey, 'base64').toString('utf-8')

  _app = new App({
    appId,
    privateKey: decodedKey,
    oauth: { clientId, clientSecret },
    webhooks: { secret: webhookSecret ?? 'dev-secret' },
  })

  return _app
}

export function getGitHubOAuthUrl(state: string): string {
  const clientId = process.env.GITHUB_APP_CLIENT_ID
  if (!clientId) throw new Error('GITHUB_APP_CLIENT_ID not set')
  const appSlug = process.env.GITHUB_APP_SLUG ?? 'demoforge'
  // URL d'installation de la GitHub App (autorise + installe en une seule fois)
  return `https://github.com/apps/${appSlug}/installations/new?state=${state}`
}
