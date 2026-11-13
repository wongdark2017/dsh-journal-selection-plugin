// cas-journal-filter — HOST half
// ==============================
// The plugin owns one read-only HTTP resource: the bundled 2025 CAS journal
// dataset (quartiles, Top/OA flags, and the OpenAlex topic per journal) as
// compact JSON. The browser half (client.js) fetches it through the page's own
// origin, so no model request, network call, or profile storage is involved.
//
// The file is re-read when its size or mtime changes, so replacing
// data/journals.json takes effect without restarting the Host.

import { readFile, stat } from 'node:fs/promises'

const name = '@local/cas-journal-filter'

// Only the web server is required; without it the bundle stays inactive
// instead of throwing.
const inject = ['webServer']

const DATA_URL = new URL('./data/journals.json', import.meta.url)
const DATA_PATH = '/cas-journal-filter/data.json'

function apply(ctx) {
  let cache = null // { stamp, body }
  let pending = null

  const stamp = async () => {
    const info = await stat(DATA_URL)
    return `${info.size}:${info.mtimeMs}`
  }

  const load = async () => {
    const current = await stamp()
    if (cache !== null && cache.stamp === current) {
      return cache.body
    }
    if (pending === null) {
      pending = readFile(DATA_URL, 'utf8')
        .then(async (body) => {
          cache = { stamp: await stamp(), body }
          return body
        })
        .finally(() => {
          pending = null
        })
    }
    return pending
  }

  const offRoute = ctx.webServer.register({
    kind: 'exact',
    path: DATA_PATH,
    resource: async (request) => {
      const method = request.method
      if (method !== 'GET' && method !== 'HEAD') {
        return new Response('method not allowed', {
          status: 405,
          headers: { Allow: 'GET, HEAD' },
        })
      }
      const headers = {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-cache',
      }
      try {
        const body = await load()
        return new Response(method === 'HEAD' ? null : body, { status: 200, headers })
      } catch (error) {
        const message = String((error && error.message) || error)
        return new Response(JSON.stringify({ error: message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
        })
      }
    },
  })

  return () => {
    offRoute()
  }
}

export { name, inject, apply }
