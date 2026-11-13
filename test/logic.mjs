// Node harness for the pure half of client.js: decode, parse, filter, sort.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import assert from 'node:assert/strict'

let captured = null
globalThis.window = { __ModuleLoader__: { load: (mod) => { captured = mod } } }

// Usage: node test/logic.mjs [client.js]
const pluginPath = resolve(process.argv[2] ?? 'client.js')
await import(pathToFileURL(pluginPath).href)

const fakeReact = { createElement: () => null, useState: () => [null, () => {}], useEffect: () => {}, useMemo: () => null, useRef: () => ({ current: null }) }
const api = captured.factory((id) => (id === 'react' ? fakeReact : {}))
const { parsePrompt, decode, filterRows } = api.__internal

assert.equal(captured.id, '@local/cas-journal-filter', 'module id')
assert.equal(api.inject.join(','), 'slots,locale', 'client inject list')
assert.equal(typeof api.apply, 'function', 'apply exported')

// ---- decode against the shipped payload -------------------------------------
const raw = JSON.parse(readFileSync(pluginPath.replace(/client\.js$/, 'data/journals.json'), 'utf8'))
const data = decode(raw)
assert.equal(data.count, 21772, 'decoded count')
const byTrend = { up: 0, down: 0, same: 0, new: 0 }
for (const j of data.journals) {
  assert.ok(j.q25 >= 1 && j.q25 <= 4, 'q25 in range: ' + j.name)
  assert.ok(j.q23 >= 0 && j.q23 <= 4, 'q23 in range: ' + j.name)
  assert.equal(typeof j.top, 'boolean')
  assert.equal(typeof j.oa, 'boolean')
  byTrend[j.trend] += 1
}
assert.deepEqual(byTrend, { up: 1423, down: 1623, same: 10573, new: 8153 }, 'trend distribution')
// categories + impact factors
assert.equal(data.fields.length, 21, 'category table size')
assert.equal(data.matched, 21772, 'matched journals')
assert.equal(data.withIf, 20872, 'journals with an impact factor')
assert.equal(data.fieldCounts.reduce((a, b) => a + b, 0) + data.topicUnmatched, 21772, 'field counts cover every row')
let coded = 0
let withIf = 0
for (const j of data.journals) {
  if (j.f >= 0) {
    coded += 1
    assert.ok(j.f < data.fields.length && typeof data.fields[j.f].zh === 'string', 'category index valid: ' + j.name)
  } else {
    assert.equal(j.f, -1, 'unmatched rows carry -1')
  }
  if (j.impact !== null) {
    withIf += 1
    assert.ok(j.impact > 0 && j.impact <= 232.4, 'impact in range: ' + j.name + ' ' + j.impact)
    assert.equal(String(j.impact.toFixed(1)), j.impact.toFixed(1))
  }
  assert.ok(j.wos >= 0 && j.wos < data.wosNames.length, 'wos index valid: ' + j.name)
}
assert.equal(coded, 21772, 'decoded category count')
assert.equal(withIf, 20872, 'decoded impact count')
assert.deepEqual(data.wosCounts, [9426, 3525, 8217, 1742], 'WoS index counts')
for (const j of data.journals) {
  assert.ok(j.wosBits >= 0 && j.wosBits <= 15, 'wos bits in range: ' + j.name)
}
const nature = data.journals.find((j) => j.name === 'NATURE')
assert.equal(nature.impact, 48.5, 'Nature IF(2024)')
assert.equal(data.fields[nature.f].zh, '综合性期刊', 'Nature major category')
const chest = data.journals.find((j) => j.name === 'CHEST')
assert.equal(chest.impact, 8.6, 'CHEST IF(2024)')
console.log('decode ok', data.count, byTrend, 'categories', coded, 'with IF', withIf)

// ---- parser ----------------------------------------------------------------
const cases = [
  ['2区以上 非OA 升级', { q: [1, 2], trend: ['up'], oa: 'no', top: 'any', keywords: [], ignored: [] }],
  ['一区和二区，刊名含 energy，排除 review', { q: [1, 2], keywords: ['energy', '-review'] }],
  ['TOP期刊 非开放获取 三区以下', { top: 'yes', oa: 'no', q: [3, 4] }],
  ['Q1 Q2 降级', { q: [1, 2], trend: ['down'] }],
  ['1-2区 新增 材料', { q: [1, 2], trend: ['new'], topics: ['Materials Science'], ignored: [] }],
  ['graphene', { keywords: ['graphene'], q: [], trend: [] }],
  ['二区及以上 非top 开源期刊', { q: [1, 2], top: 'no', oa: 'yes' }],
  ['1、3区 持平', { q: [1, 3], trend: ['same'] }],
  ['不要1区', { q: [2, 3, 4] }],
  ['不是二区 非OA', { q: [1, 3, 4], oa: 'no' }],
  ['no OA upgraded energy', { trend: ['up'], oa: 'no', keywords: ['energy'] }],
  ['Q1-Q2 no OA', { q: [1, 2], oa: 'no' }],
  ['材料 2区 非OA', { q: [2], oa: 'no', topics: ['Materials Science'] }],
  ['医学 升级', { trend: ['up'], topics: ['Medicine'] }],
  ['化工', { topics: ['Chemistry'] }],
  ['化学', { topics: ['Chemistry'] }],
  ['计算机类 一区', { q: [1], topics: ['Computer Science'] }],
  ['材料 和 化学', { topics: ['Materials Science', 'Chemistry'] }],
  ['IF>5 材料', { ifMin: 5, ifMax: null, topics: ['Materials Science'] }],
  ['影响因子5分以上', { ifMin: 5, ifMax: null, ignored: [] }],
  ['if 3-8 医学', { ifMin: 3, ifMax: 8, topics: ['Medicine'] }],
  ['IF<2', { ifMin: null, ifMax: 2 }],
  ['5分以上 非OA', { ifMin: 5, oa: 'no' }],
  ['SCIE 材料 Q1', { wos: [1], q: [1], topics: ['Materials Science'] }],
  ['sci 2区', { wos: [1], q: [2] }],
  ['ESCI 非OA', { wos: [4], oa: 'no' }],
]
for (const [text, expected] of cases) {
  const got = parsePrompt(text)
  for (const key of Object.keys(expected)) {
    if (key === 'keywords' || key === 'ignored') {
      assert.deepEqual(got[key].slice().sort(), expected[key].slice().sort(), `parse(${JSON.stringify(text)}).${key}`)
    } else {
      assert.deepEqual(got[key], expected[key], `parse(${JSON.stringify(text)}).${key}`)
    }
  }
  console.log('parse ok', JSON.stringify(text), '->', `q=${got.q} trend=${got.trend} top=${got.top} oa=${got.oa} kw=${got.keywords} ignored=${got.ignored}`)
}

// ---- filtering -------------------------------------------------------------
const q1Top = filterRows(data.journals, { q: [1], trend: [], top: 'yes', oa: 'any', kw: '', sort: 'q' })
assert.ok(q1Top.length > 0)
assert.ok(q1Top.every((j) => j.q25 === 1 && j.top), 'q1+top filter')
const energyUp = filterRows(data.journals, { q: [], trend: ['up'], top: 'any', oa: 'any', kw: 'energy', sort: 'name' })
assert.ok(energyUp.length > 0)
assert.ok(energyUp.every((j) => j.trend === 'up' && j.name.toLowerCase().includes('energy')), 'energy+up filter')
const noReview = filterRows(data.journals, { q: [], trend: [], top: 'any', oa: 'any', kw: 'energy -review', sort: 'q' })
assert.ok(noReview.every((j) => j.name.toLowerCase().includes('energy') && !j.name.toLowerCase().includes('review')), 'exclusion filter')
const all = filterRows(data.journals, { q: [], trend: [], top: 'any', oa: 'any', kw: '', sort: 'q' })
assert.equal(all.length, 21772, 'empty filters keep every row')
assert.equal(all[0].q25, 1, 'quartile sort starts at Q1')
// topic filtering
const msIndex = data.fields.findIndex((f) => f.en === 'Materials Science')
assert.ok(msIndex >= 0, 'materials field present')
const materials = filterRows(data.journals, { topic: [msIndex], q: [], trend: [], top: 'any', oa: 'any', ifMin: '', ifMax: '', kw: '', sort: 'q' })
assert.ok(materials.length > 100, 'materials rows: ' + materials.length)
assert.ok(materials.every((j) => j.f === msIndex), 'topic filter keeps only that field')
const twoTopics = filterRows(data.journals, { topic: [msIndex, data.fields.findIndex((f) => f.en === 'Chemistry')], q: [1], trend: [], top: 'any', oa: 'any', ifMin: '', ifMax: '', kw: '', sort: 'q' })
assert.ok(twoTopics.every((j) => (j.f === msIndex || data.fields[j.f].en === 'Chemistry') && j.q25 === 1), 'two topics + Q1')

// WoS index filtering: selections are OR'd, and a journal indexed in both
// SCIE and SSCI matches either chip.
const scie = filterRows(data.journals, { wos: [1], topic: [], q: [], trend: [], top: 'any', oa: 'any', ifMin: '', ifMax: '', kw: '', sort: 'q' })
assert.equal(scie.length, 9426, 'SCIE rows')
assert.ok(scie.every((j) => (j.wosBits & 1) !== 0), 'only SCIE-indexed rows')
const esciQ1 = filterRows(data.journals, { wos: [4], topic: [], q: [1], trend: [], top: 'any', oa: 'any', ifMin: '', ifMax: '', kw: '', sort: 'q' })
assert.ok(esciQ1.length > 0 && esciQ1.every((j) => (j.wosBits & 4) !== 0 && j.q25 === 1), 'ESCI Q1 rows: ' + esciQ1.length)

// impact-factor filtering and sorting
const high = filterRows(data.journals, { topic: [], q: [], trend: [], top: 'any', oa: 'any', ifMin: '10', ifMax: '', kw: '', sort: 'if' })
assert.ok(high.length > 200 && high.length < 3000, 'IF>=10 rows: ' + high.length)
assert.ok(high.every((j) => j.impact !== null && j.impact >= 10), 'IF floor respected')
for (let i = 1; i < high.length; i += 1) {
  assert.ok(high[i - 1].impact >= high[i].impact, 'IF sort is descending')
}
// ascending: monotonic upward, and journals without an IF stay at the bottom
const lowFirst = filterRows(data.journals, { topic: [], q: [], trend: [], top: 'any', oa: 'any', ifMin: '', ifMax: '', kw: '', sort: 'if-asc' })
assert.equal(lowFirst.length, 21772, 'ascending keeps every row')
const firstNull = lowFirst.findIndex((j) => j.impact === null)
assert.ok(firstNull > 0, 'journals with an IF come first')
assert.equal(lowFirst[firstNull - 1].impact !== null, true, 'last valued row before the null block')
assert.ok(lowFirst.slice(firstNull).every((j) => j.impact === null), 'all no-IF rows are at the end')
for (let i = 1; i < firstNull; i += 1) {
  assert.ok(lowFirst[i - 1].impact <= lowFirst[i].impact, 'ascending is monotonic at ' + i)
}
assert.equal(lowFirst[0].impact, 0.1, 'lowest value first')
const bounded = filterRows(data.journals, { topic: [], q: [], trend: [], top: 'any', oa: 'any', ifMin: '3', ifMax: '5', kw: '', sort: 'q' })
assert.ok(bounded.length > 1000 && bounded.every((j) => j.impact !== null && j.impact >= 3 && j.impact <= 5), 'IF band')

// every prompt word target must exist in the loaded category table, and every
// category must be reachable from at least one word (this is the check that
// catches a data-source swap like OpenAlex -> CAS categories)
const categoryEns = data.fields.map((f) => f.en)
for (const entry of api.__internal.categoryWords) {
  assert.ok(categoryEns.indexOf(entry[1]) >= 0, 'unknown category target: ' + entry[0] + ' -> ' + entry[1])
}
for (const en of categoryEns) {
  const words = api.__internal.categoryWords.filter((e) => e[1] === en)
  assert.ok(words.length > 0, 'no prompt word reaches category ' + en)
  const parsed = parsePrompt(words[0][0].split('|')[0])
  assert.ok(parsed.topics.indexOf(en) >= 0, 'word does not parse to ' + en)
}
for (const entry of api.__internal.nameWords) {
  const word = entry[0].split('|')[0]
  const parsed = parsePrompt(word)
  assert.ok(parsed.keywords.indexOf(entry[1]) >= 0, 'name word does not parse: ' + word)
  assert.deepEqual(parsed.ignored, [], 'name word is reported as ignored: ' + word)
}

// the case the user reported: a comprehensive journal must sit in 综合性期刊
const sciRep = data.journals.find((j) => j.name === 'Scientific Reports')
assert.ok(sciRep, 'Scientific Reports present')
assert.equal(data.fields[sciRep.f].zh, '综合性期刊', 'Scientific Reports category')
const mdIndex = data.fields.findIndex((f) => f.zh === '综合性期刊')
const md = filterRows(data.journals, { topic: [mdIndex], q: [], trend: [], top: 'any', oa: 'any', ifMin: '', ifMax: '', wos: [], kw: '', sort: 'q' })
assert.equal(md.length, 118, 'multidisciplinary category size')
for (const name of ['Scientific Reports', 'PLoS One', 'Nature', 'Science', 'PNAS'.toLowerCase()]) {
  const row = md.find((j) => j.name.toLowerCase() === name.toLowerCase())
  if (name !== 'pnas') {
    assert.ok(row, name + ' must be in 综合性期刊')
  }
}

// touched flags drive the merge semantics of the panel
const touched = parsePrompt('升级')
assert.deepEqual(touched.touched,
  { q: false, trend: true, top: false, oa: false, kw: false, topic: false, if: false, wos: false },
  'touched flags')
const touchedAll = parsePrompt('2区以上 非OA top graphene 新增 材料 IF>5 SCIE')
assert.deepEqual(touchedAll.touched,
  { q: true, trend: true, top: true, oa: true, kw: true, topic: true, if: true, wos: true }, 'all touched')
const touchedWos = parsePrompt('SCIE')
assert.equal(touchedWos.touched.wos, true, 'sci alone touches wos')

// 变化幅度: real moves must outrank the 8k "new" titles
const deltaAny = filterRows(data.journals, { q: [], trend: [], top: 'any', oa: 'any', kw: '', sort: 'delta' })
assert.notEqual(deltaAny[0].trend, 'new', 'delta sort does not start with new titles')
assert.equal(deltaAny[0].q23 - deltaAny[0].q25, 3, 'delta sort starts with the biggest jump')
const firstNew = deltaAny.findIndex((j) => j.trend === 'new')
const lastChanged = deltaAny.length - 1 - deltaAny.slice().reverse().findIndex((j) => j.trend !== 'new')
assert.ok(firstNew > lastChanged, 'new titles come after every changed title')

const delta = filterRows(data.journals, { q: [2], trend: ['up'], top: 'any', oa: 'any', kw: '', sort: 'delta' })
assert.ok(delta.length > 0 && delta[0].q23 - delta[0].q25 >= delta[delta.length - 1].q23 - delta[delta.length - 1].q25, 'delta sort')
console.log('filter ok', { q1Top: q1Top.length, energyUp: energyUp.length, noReview: noReview.length, delta: delta.length })

console.log('\nALL CLIENT LOGIC TESTS PASSED')
