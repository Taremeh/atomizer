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
  // Fetch the context row.
  const contextRows = await sql`
    SELECT id, children
    FROM contexts
    WHERE id = ${contextId}
  `
  if (!contextRows || contextRows.length === 0) {
    throw new Error(`Context not found: ${contextId}`)
  }
  const context = contextRows[0]

  // Retrieve the atom embedding that describes the context.
  const atomRows = await sql`
    SELECT embedding
    FROM atoms
    WHERE id = ${contextId}
  `
  if (!atomRows || atomRows.length === 0) {
    throw new Error(`Atom (metadata) not found for context: ${contextId}`)
  }
  let embeddingData = atomRows[0].embedding;
  let merged: number[];
  if (typeof embeddingData === 'string') {
    merged = JSON.parse(embeddingData);
  } else {
    merged = embeddingData;
  }
  let count = 1
  //console.log("Initial embedding length:", merged.length);

  // Expect children to be an array of objects with an "id" property.
  const children = context.children
  if (Array.isArray(children)) {
    // Process each child sequentially.
    for (const child of children) {
      const childId = child.id
      let childEmbedding: number[]

      // Check if the child is a context by trying to fetch a row in the contexts table.
      const childContextRows = await sql`
        SELECT id
        FROM contexts
        WHERE id = ${childId}
        LIMIT 1
      `
      if (childContextRows && childContextRows.length > 0) {
        // Child is a context; recursively compute its merged embedding.
        childEmbedding = await getMergedEmbedding(childId)
        //console.log("1 Child embedding length:", childEmbedding.length);
      } else {
        // Otherwise, assume the child is an atom (terminal node).
        const childAtomRows = await sql`
          SELECT embedding
          FROM atoms
          WHERE id = ${childId}
          LIMIT 1
        `
        if (!childAtomRows || childAtomRows.length === 0) {
          throw new Error(`Atom not found for child id: ${childId}`)
        }
        let embeddingData = childAtomRows[0].embedding;
        if (typeof embeddingData === 'string') {
          childEmbedding = JSON.parse(embeddingData);
        } else {
          childEmbedding = embeddingData;
        }
        //console.log("2 Child embedding length:", childEmbedding.length);
      }

      // Sum the child's embedding into the merged total.
      merged = addVectors(merged, childEmbedding)
      count += 1
    }
  }

  // Average the sum by dividing each element by the count.
  const averaged = merged.map((value) => value / count)

  // Update the context row with the new averaged embedding.
  await sql`
    UPDATE contexts
    SET embedding = ${JSON.stringify(averaged)}
    WHERE id = ${contextId}
  `

  return averaged
}

// Main entry: expects a POST with a JSON body that is an array of job objects,
// each containing at least an "id" field (which is the context id)
Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Expected POST request', { status: 405 })
  }
  if (req.headers.get('content-type') !== 'application/json') {
    return new Response('Expected JSON body', { status: 400 })
  }
  
  // Adjust the schema to accept an array of jobs.
  const parseResult = z.array(z.object({
    id: z.string(),
  })).safeParse(await req.json())
  
  if (!parseResult.success) {
    return new Response(`Invalid request body: ${parseResult.error.message}`, { status: 400 })
  }
  
  const jobs = parseResult.data
  const results = []
  
  for (const job of jobs) {
    try {
      const embedding = await getMergedEmbedding(job.id)
      results.push({ id: job.id, embedding })
    } catch (error) {
      results.push({ id: job.id, error: error instanceof Error ? error.message : JSON.stringify(error) })
    }
  }
  
  return new Response(JSON.stringify(results), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })
})
