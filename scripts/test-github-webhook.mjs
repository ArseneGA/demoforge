/**
 * Test script — simule un push GitHub vers le webhook local
 * Usage: node scripts/test-github-webhook.mjs [repo] [branch]
 *
 * Ex: node scripts/test-github-webhook.mjs ArseneGA/Artema main
 */

import { createHmac } from 'crypto'

const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET ?? 'test_secret_demoforge'
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3002'

const repoFullName = process.argv[2] ?? 'ArseneGA/Artema'
const branch = process.argv[3] ?? 'main'
const fakeCommitSha = 'deadbeef' + Date.now().toString(16)

const payload = JSON.stringify({
  ref: `refs/heads/${branch}`,
  after: fakeCommitSha,
  before: '0000000000000000000000000000000000000000',
  repository: {
    full_name: repoFullName,
    name: repoFullName.split('/')[1],
  },
  head_commit: {
    id: fakeCommitSha,
    message: 'test: simulated push from test script',
  },
  pusher: { name: 'test-script' },
})

const signature = 'sha256=' + createHmac('sha256', WEBHOOK_SECRET).update(payload).digest('hex')

console.log(`\n🔔 Simulating GitHub push webhook`)
console.log(`   Repo   : ${repoFullName}`)
console.log(`   Branch : ${branch}`)
console.log(`   SHA    : ${fakeCommitSha}`)
console.log(`   URL    : ${BASE_URL}/api/github/webhook\n`)

const res = await fetch(`${BASE_URL}/api/github/webhook`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-GitHub-Event': 'push',
    'X-GitHub-Delivery': crypto.randomUUID(),
    'X-Hub-Signature-256': signature,
  },
  body: payload,
})

const data = await res.json()
console.log(`✅ Response (${res.status}):`, JSON.stringify(data, null, 2))

if (data.affected > 0) {
  console.log(`\n👀 ${data.affected} projet(s) marqué(s) stale → vérifie le dashboard`)
} else {
  console.log(`\n⚠️  Aucun projet affecté — vérifie que le repo "${repoFullName}" branch "${branch}" existe en base avec scan_status = 'ready'`)
}
