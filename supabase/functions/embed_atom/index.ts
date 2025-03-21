// this script accepts both UUID strings and numbers as the `id` field (contrary to the original script old_index.ts)

// Setup type definitions for built-in Supabase Runtime APIs
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

// We'll use the OpenAI API to generate embeddings
import OpenAI from 'jsr:@openai/openai'

import { z } from 'npm:zod'

// We'll make a direct Postgres connection to update the document
import postgres from 'https://deno.land/x/postgresjs@v3.4.5/mod.js'

// Initialize OpenAI client
const openai = new OpenAI({
  // We'll need to manually set the `OPENAI_API_KEY` environment variable
  apiKey: Deno.env.get('OPENAI_API_KEY'),
})

// Initialize Postgres client
const sql = postgres(
  // `SUPABASE_DB_URL` is a built-in environment variable
  Deno.env.get('SUPABASE_DB_URL')!
)

// Updated schema: id can be a string or a number
const jobSchema = z.object({
  jobId: z.number(),
  id: z.union([z.string(), z.number()]),
  schema: z.string(),
  table: z.string(),
  contentFunction: z.string(),
  embeddingColumn: z.string(),
})

const failedJobSchema = jobSchema.extend({
  error: z.string(),
})

type Job = z.infer<typeof jobSchema>
type FailedJob = z.infer<typeof failedJobSchema>

type Row = {
  id: string
  content: unknown
}

const QUEUE_NAME = 'atom_embedding_jobs'

// Listen for HTTP requests
Deno.serve(async (req) => {
  console.log('Received new request:', req.method, req.url)

  if (req.method !== 'POST') {
    console.error('Request rejected - method not allowed:', req.method)
    return new Response('expected POST request', { status: 405 })
  }

  if (req.headers.get('content-type') !== 'application/json') {
    console.error('Request rejected - invalid content type:', req.headers.get('content-type'))
    return new Response('expected json body', { status: 400 })
  }

  // Use Zod to parse and validate the request body
  const parseResult = z.array(jobSchema).safeParse(await req.json())

  if (parseResult.error) {
    console.error('Request body validation failed:', parseResult.error.message)
    return new Response(`invalid request body: ${parseResult.error.message}`, {
      status: 400,
    })
  }

  const pendingJobs = parseResult.data
  console.log(`Received ${pendingJobs.length} job(s) to process`)

  // Track jobs that completed successfully
  const completedJobs: Job[] = []

  // Track jobs that failed due to an error
  const failedJobs: FailedJob[] = []

  async function processJobs() {
    let currentJob: Job | undefined

    while ((currentJob = pendingJobs.shift()) !== undefined) {
      console.log(`Starting processing for jobId=${currentJob.jobId}, id=${currentJob.id}`)
      try {
        await processJob(currentJob)
        console.log(`Job processed successfully: jobId=${currentJob.jobId}`)
        completedJobs.push(currentJob)
      } catch (error) {
        console.error(`Job failed: jobId=${currentJob.jobId}`, error)
        failedJobs.push({
          ...currentJob,
          error: error instanceof Error ? error.message : JSON.stringify(error),
        })
      }
    }
  }

  try {
    // Process jobs while listening for worker termination
    await Promise.race([processJobs(), catchUnload()])
  } catch (error) {
    console.error('Worker termination encountered, failing remaining jobs:', error)
    // If the worker is terminating (e.g. wall clock limit reached),
    // add pending jobs to fail list with termination reason
    failedJobs.push(
      ...pendingJobs.map((job) => ({
        ...job,
        error: error instanceof Error ? error.message : JSON.stringify(error),
      }))
    )
  }

  console.log('Finished processing jobs:', {
    completedJobs: completedJobs.length,
    failedJobs: failedJobs.length,
  })

  return new Response(
    JSON.stringify({
      completedJobs,
      failedJobs,
    }),
    {
      // 200 OK response
      status: 200,

      // Custom headers to report job status
      headers: {
        'Content-Type': 'application/json',
        'X-Completed-Jobs': completedJobs.length.toString(),
        'X-Failed-Jobs': failedJobs.length.toString(),
      },
    }
  )
})

/**
 * Generates an embedding for the given text.
 */
async function generateEmbedding(text: string) {
  console.log(`Requesting embedding for text (length=${text.length})`)
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  })
  const [data] = response.data

  if (!data) {
    console.error('Failed to generate embedding: no data returned')
    throw new Error('failed to generate embedding')
  }

  console.log(`Received embedding (length=${data.embedding.length})`)
  return data.embedding
}

/**
 * Processes an embedding job.
 */
async function processJob(job: Job) {
  const { jobId, id, schema, table, contentFunction, embeddingColumn } = job
  console.log(`Processing job: jobId=${jobId}, id=${id}`)

  // Fetch content for the schema/table/row combination
  console.log(`Fetching content from ${schema}.${table} for row id=${id} using function ${contentFunction}`)
  const [row]: [Row] = await sql`
    select
      id,
      ${sql(contentFunction)}(t) as content
    from
      ${sql(schema)}.${sql(table)} t
    where
      id = ${id}
  `

  if (!row) {
    console.error(`Row not found: ${schema}.${table}/${id}`)
    throw new Error(`row not found: ${schema}.${table}/${id}`)
  }

  console.log(`Fetched row id=${row.id}. Validating content type...`)
  if (typeof row.content !== 'string') {
    console.error(`Invalid content type for row: ${schema}.${table}/${id}`)
    throw new Error(`invalid content - expected string: ${schema}.${table}/${id}`)
  }

  console.log(`Generating embedding for jobId=${jobId}`)
  const embedding = await generateEmbedding(row.content)
  console.log(`Embedding generated for jobId=${jobId}`)

  console.log(`Updating row in database for jobId=${jobId}`)
  await sql`
    update
      ${sql(schema)}.${sql(table)}
    set
      ${sql(embeddingColumn)} = ${JSON.stringify(embedding)}
    where
      id = ${id}
  `
  console.log(`Database update complete for jobId=${jobId}`)

  console.log(`Deleting job from queue for jobId=${jobId}`)
  await sql`
    select pgmq.delete(${QUEUE_NAME}, ${jobId}::bigint)
  `
  console.log(`Job deleted from queue for jobId=${jobId}`)
}

/**
 * Returns a promise that rejects if the worker is terminating.
 */
function catchUnload() {
  return new Promise((_, reject) => {
    addEventListener('beforeunload', (ev: any) => {
      console.warn(`Worker termination event received: ${ev.detail?.reason}`)
      reject(new Error(ev.detail?.reason))
    })
  })
}
