// Import Supabase Edge Function runtime types
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

// Import postgres client (make sure your SUPABASE_DB_URL is set)
import postgres from 'https://deno.land/x/postgresjs@v3.4.5/mod.js'
import { z } from 'npm:zod'

// Initialize the Postgres client
const sql = postgres(Deno.env.get('SUPABASE_DB_URL')!)

// Utility function to add two vectors elementwise.
function addVectors(a: number[], b: number[]): number[] {
  if (a.length !== b.length) {
    throw new Error('Vector length mismatch ' + a.length + ' vs ' + b.length)
  }
  return a.map((val, idx) => val + b[idx])
}

// Recursive function that computes the merged embedding for a given context.
async function getMergedEmbedding(contextId: string): Promise<number[]> {
  console.log(`[getMergedEmbedding] Processing contextId: ${contextId}`)

  // Fetch the context row.
  const contextRows = await sql`
    SELECT id, children
    FROM contexts
    WHERE id = ${contextId}
  `
  if (!contextRows || contextRows.length === 0) {
    console.error(`[getMergedEmbedding] Context not found: ${contextId}`)
    throw new Error(`Context not found: ${contextId}`)
  }
  const context = contextRows[0]
  console.log(`[getMergedEmbedding] Retrieved context for id ${contextId}:`, context)

  // Retrieve the atom embedding that describes the context.
  const atomRows = await sql`
    SELECT embedding
    FROM atoms
    WHERE id = ${contextId}
  `
  if (!atomRows || atomRows.length === 0) {
    console.error(`[getMergedEmbedding] Atom (metadata) not found for context: ${contextId}`)
    throw new Error(`Atom (metadata) not found for context: ${contextId}`)
  }
  let embeddingData = atomRows[0].embedding;
  let merged: number[];
  if (typeof embeddingData === 'string') {
    merged = JSON.parse(embeddingData);
  } else {
    merged = embeddingData;
  }
  console.log(`[getMergedEmbedding] Initial embedding for context ${contextId} (length: ${merged.length})`)

  let count = 1
  // Expect children to be an array of objects with an "id" property.
  const children = context.children
  if (Array.isArray(children)) {
    // Process each child sequentially.
    for (const child of children) {
      const childId = child.id
      console.log(`[getMergedEmbedding] Processing child with id: ${childId}`)
      let childEmbedding: number[]

      // Check if the child is a context by trying to fetch a row in the contexts table.
      const childContextRows = await sql`
        SELECT id
        FROM contexts
        WHERE id = ${childId}
        LIMIT 1
      `
      if (childContextRows && childContextRows.length > 0) {
        console.log(`[getMergedEmbedding] Child ${childId} is a context. Recursively processing its embedding.`)
        // Child is a context; recursively compute its merged embedding.
        childEmbedding = await getMergedEmbedding(childId)
      } else {
        console.log(`[getMergedEmbedding] Child ${childId} is an atom. Fetching its embedding directly.`)
        // Otherwise, assume the child is an atom (terminal node).
        const childAtomRows = await sql`
          SELECT embedding
          FROM atoms
          WHERE id = ${childId}
          LIMIT 1
        `
        if (!childAtomRows || childAtomRows.length === 0) {
          console.error(`[getMergedEmbedding] Atom not found for child id: ${childId}`)
          throw new Error(`Atom not found for child id: ${childId}`)
        }
        let childEmbeddingData = childAtomRows[0].embedding;
        if (typeof childEmbeddingData === 'string') {
          childEmbedding = JSON.parse(childEmbeddingData);
        } else {
          childEmbedding = childEmbeddingData;
        }
      }
      console.log(`[getMergedEmbedding] Child ${childId} embedding length: ${childEmbedding.length}`)

      // Sum the child's embedding into the merged total.
      merged = addVectors(merged, childEmbedding)
      count += 1
      console.log(`[getMergedEmbedding] Updated merged embedding after processing child ${childId}.`)
    }
  } else {
    console.log(`[getMergedEmbedding] No children found for context ${contextId}.`)
  }

  // Average the sum by dividing each element by the count.
  const averaged = merged.map((value) => value / count)
  console.log(`[getMergedEmbedding] Averaged embedding computed for context ${contextId} using ${count} vectors.`)

  // Update the context row with the new averaged embedding.
  console.log(`[getMergedEmbedding] Updating context ${contextId} with the new averaged embedding.`)
  await sql`
    UPDATE contexts
    SET embedding = ${JSON.stringify(averaged)}
    WHERE id = ${contextId}
  `
  console.log(`[getMergedEmbedding] Successfully updated context ${contextId} with averaged embedding.`)

  return averaged
}

// Main entry: expects a POST with a JSON body that is an array of job objects,
// each containing at least an "id" field (which is the context id)
Deno.serve(async (req) => {
  console.log(`[Main] Received request: ${req.method} ${req.url}`)
  if (req.method !== 'POST') {
    console.error(`[Main] Invalid request method: ${req.method}. Expected POST.`)
    return new Response('Expected POST request', { status: 405 })
  }
  if (req.headers.get('content-type') !== 'application/json') {
    console.error(`[Main] Invalid content-type. Expected application/json.`)
    return new Response('Expected JSON body', { status: 400 })
  }
  
  // Adjust the schema to accept an array of jobs.
  const parseResult = z.array(z.object({
    id: z.string(),
  })).safeParse(await req.json())
  
  if (!parseResult.success) {
    console.error(`[Main] Request body validation failed: ${parseResult.error.message}`)
    return new Response(`Invalid request body: ${parseResult.error.message}`, { status: 400 })
  }
  
  const jobs = parseResult.data
  console.log(`[Main] Processing ${jobs.length} job(s).`)
  const results = []
  
  for (const job of jobs) {
    console.log(`[Main] Processing job for context id: ${job.id}`)
    try {
      const embedding = await getMergedEmbedding(job.id)
      results.push({ id: job.id, embedding })
      console.log(`[Main] Successfully processed job for context id: ${job.id}`)
    } catch (error) {
      console.error(`[Main] Error processing job for context id ${job.id}:`, error)
      results.push({ id: job.id, error: error instanceof Error ? error.message : JSON.stringify(error) })
    }
  }
  
  console.log(`[Main] Completed processing all jobs.`)
  return new Response(JSON.stringify(results), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })
})
