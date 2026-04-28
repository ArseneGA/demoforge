-- DemoForge — pgvector similarity search function for Scout retrieval
create or replace function match_code_chunks(
  query_embedding vector(1024),
  match_project_id uuid,
  match_count int default 5
)
returns table (
  id uuid,
  source_file text,
  content text,
  kind text,
  similarity float
)
language sql stable
as $$
  select
    code_chunks.id,
    code_chunks.source_file,
    code_chunks.content,
    code_chunks.kind,
    1 - (code_chunks.embedding <=> query_embedding) as similarity
  from code_chunks
  where
    code_chunks.project_id = match_project_id
    and code_chunks.embedding is not null
  order by code_chunks.embedding <=> query_embedding
  limit match_count;
$$;
