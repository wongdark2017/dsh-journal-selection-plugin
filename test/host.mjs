import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import assert from 'node:assert/strict'

// Usage: node test/host.mjs [index.js]
const plugin = pathToFileURL(resolve(process.argv[2] ?? 'index.js')).href
const routes = []
let disposed = 0
const ctx = { webServer: { register: (route) => { routes.push(route); return () => { disposed += 1 } } } }
const mod = await import(plugin)
assert.equal(mod.inject.includes('webServer'), true)
const stop = mod.apply(ctx)
assert.equal(routes.length, 1)
assert.deepEqual({ kind: routes[0].kind, path: routes[0].path }, { kind: 'exact', path: '/cas-journal-filter/data.json' })

const get = async (method) => routes[0].resource(new Request('http://127.0.0.1/cas-journal-filter/data.json', { method }))
const res = await get('GET')
assert.equal(res.status, 200)
assert.match(res.headers.get('content-type'), /application\/json/)
const body = await res.text()
const data = JSON.parse(body)
assert.equal(data.count, 21772)
assert.equal(data.fields.length, 21)
assert.equal(data.wosNames.length, 15)
assert.equal(data.field.length, 21772)
assert.equal(data.if.length, 65316)
assert.equal(data.wos.length, 21772)
assert.equal(data.minorNames.length, 254)
assert.equal(data.minor.split('|').length, 21772)
assert.equal(data.matched, 21772)
assert.equal(data.withIf, 20872)

const head = await get('HEAD')
assert.equal(head.status, 200)
assert.equal(await head.text(), '')
const bad = await get('POST')
assert.equal(bad.status, 405)
assert.equal(bad.headers.get('allow'), 'GET, HEAD')

// second read is served from cache (same bytes)
const again = await (await get('GET')).text()
assert.equal(again.length, body.length)
stop()
assert.equal(disposed, 1)
console.log('host route ok:', body.length, 'bytes, categories', data.fields.length, 'with IF', data.withIf)
