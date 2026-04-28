export interface CodeChunk {
  source_file: string
  start_line: number
  end_line: number
  content: string
  kind: 'component' | 'route' | 'api' | 'type' | 'hook'
  embedding?: number[]
}

function detectKind(filePath: string): CodeChunk['kind'] {
  if (filePath.includes('/api/')) return 'api'
  if (filePath.includes('/types/') || filePath.endsWith('.d.ts')) return 'type'
  if (filePath.includes('/hooks/') || /use[A-Z]/.test(filePath)) return 'hook'
  if (/page\.(tsx?|jsx?)$/.test(filePath) || /route\.(tsx?|jsx?)$/.test(filePath)) return 'route'
  return 'component'
}

function chunkFile(file: { path: string; content: string }): CodeChunk[] {
  const lines = file.content.split('\n')
  const CHUNK_SIZE = 80
  const chunks: CodeChunk[] = []

  for (let i = 0; i < lines.length; i += CHUNK_SIZE) {
    const end = Math.min(i + CHUNK_SIZE, lines.length)
    const content = lines.slice(i, end).join('\n').trim()
    if (content.length < 50) continue // skip tiny chunks
    chunks.push({
      source_file: file.path,
      start_line: i + 1,
      end_line: end,
      content,
      kind: detectKind(file.path),
    })
  }

  return chunks
}

export async function generateEmbeddings(
  files: Array<{ path: string; content: string }>,
  maxChunks = 200
): Promise<CodeChunk[]> {
  const apiKey = process.env.VOYAGE_API_KEY
  if (!apiKey) {
    console.warn('[scout/voyage] VOYAGE_API_KEY not set, skipping embeddings')
    return []
  }

  // Chunk all files
  const allChunks = files.flatMap(chunkFile).slice(0, maxChunks)
  if (allChunks.length === 0) return []

  // Voyage AI batch request (max 128 texts per request)
  const BATCH = 128
  const chunksWithEmbeddings: CodeChunk[] = []

  for (let i = 0; i < allChunks.length; i += BATCH) {
    const batch = allChunks.slice(i, i + BATCH)

    const response = await fetch('https://api.voyageai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        input: batch.map(c => c.content),
        model: 'voyage-3',
        input_type: 'document',
      }),
    })

    if (!response.ok) {
      console.error('[scout/voyage] embedding request failed', response.status)
      chunksWithEmbeddings.push(...batch) // include without embeddings
      continue
    }

    const data = await response.json() as { data: Array<{ embedding: number[] }> }

    for (let j = 0; j < batch.length; j++) {
      const chunk = batch[j]
      if (!chunk) continue
      chunksWithEmbeddings.push({
        ...chunk,
        embedding: data.data[j]?.embedding,
      })
    }
  }

  return chunksWithEmbeddings
}
