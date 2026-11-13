// cas-journal-filter — CLIENT half
// ================================
// A floating filter panel for the bundled 2025 CAS journal table.
//
//   * The sidebar-foot action "期刊筛选" toggles `shell.overlay`.
//   * The panel reads the dataset from the Host route
//     `/cas-journal-filter/data.json` (registered in index.js), decodes the
//     compact payload, and filters it in the browser.
//   * Nothing here calls a model, the network, or profile storage.

window.__ModuleLoader__.load({
  id: '@local/cas-journal-filter',
  factory(require) {
    const React = require('react')
    const h = React.createElement

    const NS = 'casJournalFilter'
    const DATA_PATH = '/cas-journal-filter/data.json'
    const ROW_CAP = 300

    const CSS = `
.cjf-mask{position:fixed;inset:0;z-index:60;display:flex;justify-content:flex-end;pointer-events:auto;
  background:rgba(0,0,0,.28)}
.cjf-panel{width:min(820px,96vw);height:100%;box-sizing:border-box;display:flex;flex-direction:column;
  background:var(--dsw-alias-bg-layer-1);border-left:1px solid var(--dsw-alias-border-l1);
  box-shadow:-12px 0 32px rgba(0,0,0,.24);
  color:var(--dsw-alias-label-primary);
  font-size:13px;line-height:1.5}
.cjf-head{flex:none;display:flex;align-items:flex-start;justify-content:space-between;gap:12px;
  padding:14px 18px 12px;border-bottom:1px solid var(--dsw-alias-border-l1)}
.cjf-title{font-size:14px;font-weight:600}
.cjf-sub{font-size:12px;color:var(--dsw-alias-label-secondary);margin-top:2px}
.cjf-body{flex:1;min-height:0;overflow:auto;padding:12px 18px 16px}
.cjf-prompt{display:flex;gap:8px;align-items:center}
.cjf-input{flex:1;min-width:0;box-sizing:border-box;font:inherit;padding:8px 10px;border-radius:8px;
  border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);color:inherit}
.cjf-input:focus{outline:none;border-color:var(--dsw-alias-brand-primary)}
.cjf-input::placeholder{color:var(--dsw-alias-label-secondary)}
.cjf-btn{font:inherit;font-size:12.5px;padding:5px 12px;border-radius:7px;cursor:pointer;
  white-space:nowrap;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);
  color:var(--dsw-alias-label-primary)}
.cjf-btn:hover{border-color:var(--dsw-alias-brand-primary)}
.cjf-btn:disabled{opacity:.5;cursor:default}
.cjf-btn.primary{background:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary);
  color:var(--dsw-alias-bg-layer-1)}
.cjf-iconbtn{font:inherit;font-size:13px;line-height:1;width:28px;height:28px;padding:0;border-radius:7px;
  cursor:pointer;border:1px solid transparent;background:transparent;color:var(--dsw-alias-label-secondary)}
.cjf-iconbtn:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}
.cjf-group{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:10px}
.cjf-label{font-size:12px;color:var(--dsw-alias-label-secondary);min-width:62px}
.cjf-chips{display:flex;gap:6px;flex-wrap:wrap;flex:1;min-width:0}
.cjf-chip{cursor:pointer;font:inherit;font-size:12px;padding:3px 10px;border-radius:999px;
  border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);
  color:var(--dsw-alias-label-secondary)}
.cjf-chip:hover{border-color:var(--dsw-alias-brand-primary)}
.cjf-chips-topic .cjf-chip{font-size:11.5px;padding:2px 8px}
.cjf-chip[aria-pressed="true"]{font-weight:600;color:var(--dsw-alias-brand-primary);
  border-color:var(--dsw-alias-brand-primary);
  background:color-mix(in srgb,var(--dsw-alias-brand-primary) 14%,transparent)}
.cjf-kw{flex:1;min-width:180px}
.cjf-notice{margin-top:8px;font-size:12px;color:var(--dsw-alias-label-secondary)}
.cjf-notice b{color:var(--dsw-alias-label-primary);font-weight:600}
.cjf-warn{color:var(--dsw-alias-state-warn-primary)}
.cjf-bar{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;
  margin:14px 0 8px;padding-top:10px;border-top:1px solid var(--dsw-alias-border-l1)}
.cjf-count{font-size:12.5px;color:var(--dsw-alias-label-secondary)}
.cjf-count b{font-size:15px;color:var(--dsw-alias-label-primary)}
.cjf-tools{display:flex;align-items:center;gap:8px}
.cjf-select{font:inherit;font-size:12px;padding:4px 6px;border-radius:6px;
  border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);color:inherit}
.cjf-select:focus{outline:none;border-color:var(--dsw-alias-brand-primary)}
.cjf-list{border:1px solid var(--dsw-alias-border-l1);border-radius:10px;overflow:hidden}
.cjf-headrow,.cjf-row{display:grid;grid-template-columns:minmax(0,1fr) 52px 78px 58px 44px 38px;
  gap:8px;align-items:center;padding:6px 10px}
.cjf-headrow{position:sticky;top:0;z-index:1;background:var(--dsw-alias-bg-layer-2);
  font-size:11.5px;color:var(--dsw-alias-label-secondary);border-bottom:1px solid var(--dsw-alias-border-l1)}
.cjf-row{border-bottom:1px solid var(--dsw-alias-border-l1);font-size:12.5px}
.cjf-row:last-child{border-bottom:none}
.cjf-row:nth-child(even){background:color-mix(in srgb,var(--dsw-alias-bg-layer-2) 45%,transparent)}
.cjf-namecell{display:flex;flex-direction:column;gap:1px;min-width:0}
.cjf-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cjf-topic{font-size:10.5px;line-height:1.25;color:var(--dsw-alias-label-secondary);
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cjf-topic-wos{color:var(--dsw-alias-label-secondary);opacity:.85}
.cjf-chipcount{margin-left:5px;font-size:10.5px;opacity:.7;font-variant-numeric:tabular-nums}
.cjf-q{display:inline-block;min-width:26px;text-align:center;font-size:11px;padding:1px 6px;
  border-radius:6px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-2);
  color:var(--dsw-alias-label-secondary)}
.cjf-q.q1{border-color:color-mix(in srgb,var(--dsw-alias-brand-primary) 45%,transparent);
  color:var(--dsw-alias-brand-primary);font-weight:600;
  background:color-mix(in srgb,var(--dsw-alias-brand-primary) 14%,transparent)}
.cjf-trend{font-size:11.5px;color:var(--dsw-alias-label-secondary);white-space:nowrap}
.cjf-sortbtn{display:flex;align-items:center;gap:3px;font:inherit;font-size:11.5px;padding:0;
  border:none;background:none;color:inherit;cursor:pointer;text-align:left}
.cjf-sortbtn:hover{color:var(--dsw-alias-brand-primary)}
.cjf-sortarrow{font-size:10px;opacity:.9}
.cjf-if{font-size:12px;font-variant-numeric:tabular-nums;color:var(--dsw-alias-label-primary)}
.cjf-if.none{color:var(--dsw-alias-label-secondary)}
.cjf-ifbox{display:flex;align-items:center;gap:6px}
.cjf-num{width:66px;box-sizing:border-box;font:inherit;font-size:12px;padding:3px 7px;border-radius:6px;
  border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);color:inherit}
.cjf-num:focus{outline:none;border-color:var(--dsw-alias-brand-primary)}
.cjf-num::placeholder{color:var(--dsw-alias-label-secondary)}
.cjf-dash{color:var(--dsw-alias-label-secondary)}
.cjf-muted{font-size:11.5px;color:var(--dsw-alias-label-secondary)}
.cjf-trend.up{color:var(--dsw-alias-state-success-primary)}
.cjf-trend.down{color:var(--dsw-alias-state-error-primary)}
.cjf-trend.new{color:var(--dsw-alias-brand-primary)}
.cjf-tag{display:inline-block;font-size:10.5px;padding:0 5px;border-radius:4px;
  border:1px solid var(--dsw-alias-border-l1);color:var(--dsw-alias-label-secondary);white-space:nowrap}
.cjf-more{padding:8px;text-align:center;font-size:12px;color:var(--dsw-alias-label-secondary);
  border-top:1px solid var(--dsw-alias-border-l1)}
.cjf-empty{padding:28px 12px;text-align:center;font-size:12.5px;color:var(--dsw-alias-label-secondary)}
.cjf-foot{flex:none;display:flex;align-items:center;justify-content:space-between;gap:10px;
  padding:9px 18px;border-top:1px solid var(--dsw-alias-border-l1);
  background:var(--dsw-alias-bg-layer-2);font-size:11.5px;color:var(--dsw-alias-label-secondary)}
.cjf-side{font:inherit;font-size:13px;width:100%;box-sizing:border-box;padding:9px 12px;border-radius:12px;
  cursor:pointer;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);
  color:var(--dsw-alias-label-primary);white-space:nowrap;display:flex;justify-content:center;
  align-items:center;gap:6px}
.cjf-side:hover{border-color:var(--dsw-alias-brand-primary)}
.cjf-side-rail{width:36px;height:36px;padding:0;border-radius:50%}
.cjf-side[aria-expanded="true"]{border-color:var(--dsw-alias-brand-primary);
  color:var(--dsw-alias-brand-primary);
  background:color-mix(in srgb,var(--dsw-alias-brand-primary) 12%,transparent)}
@media (max-width:600px){
  .cjf-panel{width:100vw}
  .cjf-body{padding:10px 12px 14px}
  .cjf-head{padding:12px 14px 10px}
  .cjf-group{margin-top:8px}
  .cjf-label{min-width:100%}
  .cjf-headrow,.cjf-row{grid-template-columns:minmax(0,1fr) 40px 50px 46px 34px 28px;
    gap:5px;padding:5px 8px;font-size:12px}
  .cjf-bar{gap:6px}
  .cjf-tools{flex-wrap:wrap}
}
`

    // ---------------------------------------------------------------------
    // Copy
    // ---------------------------------------------------------------------
    // ZH is both the zh dictionary and the literal fallback, so the panel keeps
    // readable text even if a locale dictionary is missing or late.
    const ZH = {
      'title': '期刊筛选',
      'subtitle': '2025 中科院分区 · 共 {n} 本',
      'loading': '正在读取分区表…',
      'loadFailed': '读取失败：{msg}',
      'promptPlaceholder': '说要求：材料 2区以上 IF>5 非OA 升级',
      'apply': '应用要求',
      'topic': '中科院大类',
      'topicUnknown': '未分类',
      'topicUnknownHint': '这条期刊在 2025 分区表里没有大类记录',
      'coverage': '其中 {n} 本有影响因子',
      'wos': 'WoS 索引',
      'wosHint': '{label}（{n} 本）',
      'wosCount': '{n} 本',
      'impact': '影响因子',
      'ifMin': '最低',
      'ifMax': '最高',
      'ifMinAria': '影响因子下限',
      'ifMaxAria': '影响因子上限',
      'ifHint': '2024 JCR，空着表示不限',
      'quartile': '2025 分区',
      'trend': '对比 2023',
      'top': 'Top 期刊',
      'oa': '开放获取',
      'keyword': '刊名关键词',
      'keywordPlaceholder': '空格分隔多个关键词，- 前缀表示排除（如 energy -review）',
      'any': '不限',
      'yes': '是',
      'no': '否',
      'qLabel': '{n} 区',
      'trendUp': '升级',
      'trendDown': '降级',
      'trendSame': '持平',
      'trendNew': '新增',
      'sort': '排序',
      'sortQ': '分区优先',
      'sortName': '刊名 A-Z',
      'sortIf': '影响因子 高→低',
      'sortIfAsc': '影响因子 低→高',
      'sortIfHint': '按影响因子排序（点一下切换高→低 / 低→高）',
      'sortDelta': '变化幅度',
      'countPrefix': '命中 ',
      'countUnit': '本',
      'distributionLabel': '分区分布',
      'distribution': 'Q1 {a} · Q2 {b} · Q3 {c} · Q4 {d}',
      'capped': '仅渲染前 {cap} 条',
      'export': '导出 CSV',
      'reset': '清空筛选',
      'close': '关闭',
      'colName': '期刊名称',
      'colQ25': '2025',
      'colTrend': 'vs 2023',
      'colTop': 'Top',
      'colOa': 'OA',
      'colField': '学科领域',
      'colIf': '影响因子',
      'colWos': 'WoS 索引',
      'more': '仅显示前 {cap} 条，导出 CSV 可拿到全部 {n} 条',
      'empty': '没有符合条件的期刊。放宽分区或变化条件，或减少刊名关键词再试。',
      'parsed': '已按你的要求更新条件',
      'parsedNothing': '没识别出可筛选的条件，已保持原条件；也可以直接点下面的标签',
      'ignored': '未识别：{words}',
      'ignoredHint': '（没匹配到筛选条件；学科请用中文词，如「材料」「医学」）',
      'dataNote': '离线表格 · 学科与影响因子取自 2025 中科院分区表（含 2024 JCR IF）',
      'open': '期刊筛选',
      'newCsv': '新增',
      'noQ23': '—',
      'dataIncomplete': '数据缺列',
    }

    const EN = {
      'title': 'Journal filter',
      'subtitle': 'CAS 2025 quartiles · {n} titles',
      'loading': 'Reading the journal table…',
      'loadFailed': 'Could not load: {msg}',
      'promptPlaceholder': 'Describe what you need: Q1-Q2, no OA, upgraded, name has energy',
      'apply': 'Apply',
      'topic': 'Major category',
      'topicUnknown': 'Unclassified',
      'topicUnknownHint': 'The 2025 partition table has no major category for this title',
      'coverage': '{n} titles carry an impact factor',
      'wos': 'WoS index',
      'wosHint': '{label} ({n} titles)',
      'wosCount': '{n} titles',
      'impact': 'Impact factor',
      'ifMin': 'min',
      'ifMax': 'max',
      'ifMinAria': 'Minimum impact factor',
      'ifMaxAria': 'Maximum impact factor',
      'ifHint': '2024 JCR; empty means no bound',
      'quartile': '2025 quartile',
      'trend': 'vs 2023',
      'top': 'Top journal',
      'oa': 'Open access',
      'keyword': 'Name keywords',
      'keywordPlaceholder': 'Space-separated; prefix a word with - to exclude (energy -review)',
      'any': 'Any',
      'yes': 'Yes',
      'no': 'No',
      'qLabel': 'Q{n}',
      'trendUp': 'Up',
      'trendDown': 'Down',
      'trendSame': 'Same',
      'trendNew': 'New',
      'sort': 'Sort',
      'sortQ': 'Quartile',
      'sortName': 'Name A-Z',
      'sortIf': 'Impact factor, high to low',
      'sortIfAsc': 'Impact factor, low to high',
      'sortIfHint': 'Sort by impact factor; click to switch high-to-low / low-to-high',
      'sortDelta': 'Change',
      'countPrefix': '',
      'countUnit': 'matches',
      'distributionLabel': 'Distribution',
      'distribution': 'Q1 {a} · Q2 {b} · Q3 {c} · Q4 {d}',
      'capped': 'first {cap} rendered',
      'export': 'Export CSV',
      'reset': 'Clear filters',
      'close': 'Close',
      'colName': 'Journal',
      'colQ25': '2025',
      'colTrend': 'vs 2023',
      'colTop': 'Top',
      'colOa': 'OA',
      'colField': 'Topic',
      'colIf': 'Impact factor',
      'colWos': 'WoS index',
      'more': 'Showing the first {cap} rows; export the CSV for all {n}',
      'empty': 'No journal matches. Relax the quartile or change filters, or drop a name keyword.',
      'parsed': 'Filters updated from your requirement',
      'parsedNothing': 'Nothing to filter on was recognised; filters unchanged — you can also click the chips below',
      'ignored': 'Ignored: {words}',
      'ignoredHint': ' (no filter matched; for topics use a Chinese word such as 材料)',
      'dataNote': 'Offline table · categories and impact factors come from the 2025 CAS partition table (2024 JCR IF)',
      'open': 'Journal filter',
      'newCsv': 'New',
      'noQ23': '—',
      'dataIncomplete': 'Missing column',
    }

    let translate = null
    let localeService = null

    // The active locale decides which dictionary backs the panel; a dictionary
    // the locale service resolves wins over that, and ZH is the last resort.
    function activeLocale() {
      if (localeService === null || typeof localeService.getLocale !== 'function') {
        return ''
      }
      try {
        return String(localeService.getLocale().active || '')
      } catch (error) {
        return ''
      }
    }

    function m(key, vars) {
      let text = null
      if (translate !== null) {
        const value = translate(key)
        if (typeof value === 'string' && value !== '' && value !== key) {
          text = value
        }
      }
      if (text === null) {
        const dictionary = /^en/i.test(activeLocale()) ? EN : ZH
        text = dictionary[key] === undefined ? ZH[key] : dictionary[key]
      }
      if (text === undefined) {
        text = key
      }
      if (vars) {
        text = text.replace(/\{(\w+)\}/g, (all, name) => (vars[name] === undefined ? all : String(vars[name])))
      }
      return text
    }

    // ---------------------------------------------------------------------
    // Dataset: decode the Host payload once per page
    // ---------------------------------------------------------------------
    let dataset = null
    let inflight = null

    function decode(raw) {
      const names = String(raw.names || '').split('\n')
      const q25 = String(raw.q25 || '')
      const q23 = String(raw.q23 || '')
      const flags = String(raw.flags || '')
      const fieldCodes = String(raw.field || '')
      const ifCodes = String(raw.if || '')
      const wosCodes = String(raw.wos || '')
      const fields = Array.isArray(raw.fields) ? raw.fields : []
      const wosNames = Array.isArray(raw.wosNames) ? raw.wosNames : ['']
      // One bit per Web of Science index: 1 SCIE, 2 SSCI, 4 ESCI, 8 AHCI.
      const wosMasks = wosNames.map(wosMask)
      const wosCounts = [0, 0, 0, 0]
      const journals = new Array(names.length)
      const fieldCounts = new Array(fields.length)
      const topicUnmatched = [0]
      for (let i = 0; i < fieldCounts.length; i += 1) {
        fieldCounts[i] = 0
      }
      for (let i = 0; i < names.length; i += 1) {
        const a = q25.charCodeAt(i) - 48
        const b = q23.charCodeAt(i) - 48
        const top = flags.charCodeAt(i * 2) === 49
        const oa = flags.charCodeAt(i * 2 + 1) === 49
        const rawCode = fieldCodes.charCodeAt(i)
        const fieldIndex = rawCode >= 65 && rawCode <= 90 ? rawCode - 65 : -1
        const impact = base36(ifCodes.slice(i * 3, i * 3 + 3)) / 10
        const wosIndex = base36(wosCodes.charAt(i))
        const wosBits = wosMasks[wosIndex] || 0
        for (let bit = 0; bit < 4; bit += 1) {
          if ((wosBits & (1 << bit)) !== 0) {
            wosCounts[bit] += 1
          }
        }
        if (fieldIndex >= 0 && fieldIndex < fieldCounts.length) {
          fieldCounts[fieldIndex] += 1
        } else {
          topicUnmatched[0] += 1
        }
        let trend = 'same'
        if (b === 0) {
          trend = 'new'
        } else if (a < b) {
          trend = 'up'
        } else if (a > b) {
          trend = 'down'
        }
        journals[i] = {
          name: names[i], q25: a, q23: b, top: top, oa: oa, trend: trend,
          f: fieldIndex, impact: impact > 0 ? impact : null, wos: wosIndex, wosBits: wosBits,
        }
      }
      return {
        journals: journals,
        count: journals.length,
        source: String(raw.source || ''),
        matched: Number(raw.matched || 0),
        fields: fields,
        wosNames: wosNames,
        wosMasks: wosMasks,
        wosCounts: wosCounts,
        fieldCounts: fieldCounts,
        topicUnmatched: topicUnmatched[0],
        withIf: Number(raw.withIf || 0),
      }
    }

    function loadData() {
      if (dataset !== null) {
        return Promise.resolve(dataset)
      }
      if (inflight === null) {
        inflight = fetch(DATA_PATH, { headers: { accept: 'application/json' } })
          .then((response) => {
            if (!response.ok) {
              throw new Error('HTTP ' + response.status)
            }
            return response.json()
          })
          .then((raw) => {
            dataset = decode(raw)
            return dataset
          })
          .finally(() => {
            inflight = null
          })
      }
      return inflight
    }

    // ---------------------------------------------------------------------
    // Requirement parser: turns a typed requirement into the same filters the
    // chips control. ASCII leftovers become name keywords; anything else is
    // reported as unrecognised instead of silently matching nothing.
    // ---------------------------------------------------------------------
    const CN_DIGIT = { '一': 1, '二': 2, '三': 3, '四': 4 }

    // Chinese topic words -> OpenAlex field names. Longest pattern first.
    // Chinese words -> one of the 21 CAS major categories (the English key is
    // the field table's `en`). Longest pattern first so 化学工程 never degrades
    // into 化学.
    const CATEGORY_WORDS = [
      ['化学工程|化工', 'Chemistry'],
      ['材料科学|材料', 'Materials Science'],
      ['计算机|计算技术|人工智能|软件', 'Computer Science'],
      ['综合性|综合|交叉|跨学科', 'Multidisciplinary'],
      ['化学', 'Chemistry'],
      ['物理|天文|天体|光学', 'Physics and Astronomy'],
      ['数学|统计', 'Mathematics'],
      ['医学|临床|医疗|外科|肿瘤|心血管|影像医学', 'Medicine'],
      ['心理学|心理', 'Psychology'],
      ['生物学|生物|遗传|细胞', 'Biology'],
      ['农林|农业|林业|畜牧|食品|植物|动物', 'Agriculture and Forestry'],
      ['环境|生态', 'Environmental Science and Ecology'],
      ['工程技术|工程学|工程', 'Engineering and Technology'],
      ['地球|地质|地理|行星|海洋|大气|遥感', 'Earth Science'],
      ['经济|金融|计量', 'Economics'],
      ['管理学|管理|商业|工商|会计|运筹|决策', 'Management'],
      ['教育学|教育', 'Education'],
      ['社会学|社科|社会科学|政治|法律|法学|犯罪', 'Sociology'],
      ['人文|艺术|音乐|美术|设计', 'Arts'],
      ['历史学|历史', 'History'],
      ['哲学', 'Philosophy'],
      ['文学|语言', 'Literature'],
    ]

    // A sub-discipline the CAS table never uses as a major category becomes an
    // English title keyword instead: narrower than a wrong category.
    const NAME_WORDS = [
      ['牙科|口腔', 'dental'],
      ['护理', 'nursing'],
      ['药理|药学|药物|毒理', 'pharmac'],
      ['免疫', 'immun'],
      ['神经科学|神经', 'neuro'],
      ['兽医', 'veterinar'],
      ['能源|电力|电池', 'energy'],
    ]

    const STOPWORDS = {
      '要': 1, '我要': 1, '我想': 1, '帮我': 1, '帮忙': 1, '筛': 1, '筛选': 1, '挑': 1, '选': 1,
      '找': 1, '选出': 1, '列出': 1, '给我': 1, '期刊': 1, '杂志': 1, '刊物': 1, '论文': 1,
      '的': 1, '了': 1, '和': 1, '或': 1, '以及': 1, '还有': 1, '并且': 1, '但是': 1, '但': 1,
      '要求': 1, '需要': 1, '符合': 1, '满足': 1, '只要': 1, '必须': 1, '同时': 1, '并且': 1,
      '是': 1, '在': 1, '里': 1, '中': 1, '中科院': 1, '分区': 1, '分区表': 1, '收录': 1,
      '期刊名': 1, '刊名': 1, '刊名含': 1, '期刊名含': 1, '名称': 1, '名字': 1, '标题': 1,
      '含': 1, '包含': 1, '带': 1, '含有': 1, '区': 1, '级别': 1,
      '类': 1, '方向': 1, '领域': 1, '学科': 1, '相关': 1, '方面': 1,
      'sci': 1, 'ssci': 1, 'jcr': 1, 'the': 1, 'a': 1, 'an': 1, 'and': 1, 'or': 1, 'with': 1,
      'that': 1, 'are': 1, 'is': 1, 'only': 1, 'filter': 1, 'journals': 1, 'journal': 1,
      'papers': 1, 'paper': 1, 'please': 1, 'list': 1, 'find': 1, 'show': 1, 'me': 1, 'to': 1,
      'in': 1, 'of': 1, 'on': 1, 'all': 1, 'any': 1, 'quartile': 1, 'top': 1,
      'for': 1, 'my': 1, 'our': 1, 'has': 1, 'have': 1, 'name': 1, 'names': 1,
      'contains': 1, 'containing': 1, 'about': 1, 'from': 1, 'by': 1, 'at': 1, 'as': 1,
      'be': 1, 'no': 1, 'not': 1, 'non': 1, 'without': 1, 'upgraded': 1, 'downgraded': 1,
    }

    function parsePrompt(text) {
      const out = {
        q: [], trend: [], top: 'any', oa: 'any', keywords: [], ignored: [], topics: [],
        ifMin: null, ifMax: null, wos: [],
        touched: {
          q: false, trend: false, top: false, oa: false, kw: false, topic: false, if: false,
          wos: false,
        },
      }
      const excludedQ = []
      let s = ' ' + String(text == null ? '' : text).replace(/[０-９]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 0xfee0)) + ' '

      s = s.replace(/["“]([^"”]{2,})["”]/g, (all, word) => {
        const token = String(word).trim()
        if (token !== '') {
          out.keywords.push(token)
        }
        return ' '
      })

      // 不要1区 / 不是二区 → the complement of the named quartiles
      s = s.replace(/(?:不要|不是|排除|不含|去掉|别)\s*([1-4]|一|二|三|四)\s*区/g, (all, a) => {
        excludedQ.push(CN_DIGIT[a] || Number(a))
        return ' '
      })

      // Impact factor: range, floor, ceiling, and "5分以上" style floor.
      const IF_WORD = '(?:影响因子|impact factor|jif|\\bif\\b)'
      let matchedIf = false
      s = s.replace(new RegExp(IF_WORD + '\\s*[:：]?\\s*([0-9]+(?:\\.[0-9]+)?)\\s*(?:-|~|～|到|至)\\s*([0-9]+(?:\\.[0-9]+)?)', 'gi'),
        (all, lo, hi) => {
          out.ifMin = Number(lo)
          out.ifMax = Number(hi)
          matchedIf = true
          return ' '
        })
      s = s.replace(new RegExp(IF_WORD + '\\s*(?:>=|≥|>|＞|大于|高于|超过|至少)\\s*([0-9]+(?:\\.[0-9]+)?)', 'gi'),
        (all, lo) => {
          out.ifMin = Number(lo)
          matchedIf = true
          return ' '
        })
      s = s.replace(new RegExp(IF_WORD + '\\s*(?:<=|≤|<|＜|小于|低于|不超过|最多)\\s*([0-9]+(?:\\.[0-9]+)?)', 'gi'),
        (all, hi) => {
          out.ifMax = Number(hi)
          matchedIf = true
          return ' '
        })
      s = s.replace(/([0-9]+(?:\.[0-9]+)?)\s*分\s*(?:以上|及以上|起|往上)/g, (all, lo) => {
        out.ifMin = Number(lo)
        matchedIf = true
        return ' '
      })
      s = s.replace(new RegExp(IF_WORD + '\\s*([0-9]+(?:\\.[0-9]+)?)\\s*(?:分)?\\s*(?:以上|及以上|\\+|起)?', 'gi'),
        (all, lo) => {
          if (!matchedIf) {
            out.ifMin = Number(lo)
            matchedIf = true
          }
          return ' '
        })
      s = s.replace(/(?:影响因子|impact factor|jif)/gi, ' ')
      out.touched.if = matchedIf

      // 1-2区 / 1~2区 / 1到2区
      s = s.replace(/([1-4])\s*(?:-|~|～|—|到|至)\s*([1-4])\s*区/g, (all, a, b) => {
        const lo = Math.min(Number(a), Number(b))
        const hi = Math.max(Number(a), Number(b))
        for (let i = lo; i <= hi; i += 1) {
          out.q.push(i)
        }
        return ' '
      })

      // 2区以上 / 二区及以上
      s = s.replace(/([1-4]|一|二|三|四)\s*区\s*(?:及以上|以上|往上|起步)/g, (all, a) => {
        const n = CN_DIGIT[a] || Number(a)
        for (let i = 1; i <= n; i += 1) {
          out.q.push(i)
        }
        return ' '
      })

      // 3区以下 / 三区及以下
      s = s.replace(/([1-4]|一|二|三|四)\s*区\s*(?:及以下|以下|往下)/g, (all, a) => {
        const n = CN_DIGIT[a] || Number(a)
        for (let i = n; i <= 4; i += 1) {
          out.q.push(i)
        }
        return ' '
      })

      // 一二区 / 一、二区
      s = s.replace(/([一二三四])\s*(?:、|,|，|和|与|\s)\s*([一二三四])\s*区/g, (all, a, b) => {
        out.q.push(CN_DIGIT[a], CN_DIGIT[b])
        return ' '
      })

      // 1、2区
      s = s.replace(/([1-4])\s*(?:、|,|，|和|与|\/)\s*([1-4])\s*区/g, (all, a, b) => {
        out.q.push(Number(a), Number(b))
        return ' '
      })

      // Q1 / q2
      s = s.replace(/\bq\s*([1-4])\b/gi, (all, a) => {
        out.q.push(Number(a))
        return ' '
      })

      // 一区 / 2区
      s = s.replace(/([1-4]|一|二|三|四)\s*区/g, (all, a) => {
        out.q.push(CN_DIGIT[a] || Number(a))
        return ' '
      })

      const negated = (pattern) => {
        const source = '(?:非|不是|不要|不要是|排除|不含|没有|只要不是|no|non|not|without|without any)\\s*-?\\s*(?:' + pattern + ')'
        if (!new RegExp(source, 'i').test(s)) {
          return false
        }
        s = s.replace(new RegExp(source, 'gi'), ' ')
        return true
      }
      const claimed = (pattern) => {
        if (!new RegExp('(?:' + pattern + ')', 'i').test(s)) {
          return false
        }
        s = s.replace(new RegExp('(?:' + pattern + ')', 'gi'), ' ')
        return true
      }

      // Web of Science index words. "SCI" is what people usually mean by an
      // SCIE journal, so it selects SCIE.
      const WOS_WORDS = [['ssci', 2], ['esci', 4], ['ahci', 8], ['scie|\\bsci\\b', 1]]
      for (const entry of WOS_WORDS) {
        const re = new RegExp('(?:^|[^a-z])(' + entry[0] + ')(?![a-z])', 'i')
        if (re.test(s)) {
          out.wos.push(entry[1])
          s = s.replace(new RegExp('(?:^|[^a-z])(' + entry[0] + ')(?![a-z])', 'gi'), ' ')
        }
      }
      out.wos = unique(out.wos)
      out.touched.wos = out.wos.length > 0

      // Chinese topic words become the OpenAlex field they name. Longest
      // patterns run first, so 化学工程 never degrades into 化学.
      for (const entry of CATEGORY_WORDS) {
        if (new RegExp(entry[0]).test(s)) {
          out.topics.push(entry[1])
          s = s.replace(new RegExp(entry[0], 'g'), ' ')
        }
      }
      out.topics = unique(out.topics)
      s = ' ' + s + ' '
      for (const entry of NAME_WORDS) {
        if (new RegExp(entry[0]).test(s)) {
          out.keywords.push(entry[1])
          s = s.replace(new RegExp(entry[0], 'g'), ' ')
        }
      }
      out.keywords = unique(out.keywords)

      const TOP = 'top|顶刊|顶尖'
      const OA = 'oa|开放获取|开源|开放出版|开放阅读'
      if (negated(TOP)) {
        out.top = 'no'
      } else if (claimed(TOP)) {
        out.top = 'yes'
      }
      if (negated(OA)) {
        out.oa = 'no'
      } else if (claimed(OA)) {
        out.oa = 'yes'
      }

      const TRENDS = [
        ['up', '升级|升区|升档|上调|提档|升了|上升|变好|\\bupgrad(?:e|ed|es|ing)\\b'],
        ['down', '降级|降区|降档|下调|掉档|降了|下降|变差|\\bdowngrad(?:e|ed|es|ing)\\b'],
        ['same', '持平|不变|没变|未变|原地|保持|\\bunchanged\\b|\\bsame quartile\\b'],
        ['new', '新增|新进|新收录|新入|2023未收录|新晋|\\bnewly (?:added|indexed)\\b|\\bnew in 2025\\b'],
      ]
      for (const entry of TRENDS) {
        if (new RegExp(entry[1], 'i').test(s)) {
          out.trend.push(entry[0])
          s = s.replace(new RegExp(entry[1], 'gi'), ' ')
        }
      }

      s = s.replace(/(?:排除|去除|去掉|不含|不要)\s*([^\s,，、;；]+)/g, (all, word) => {
        const token = String(word).trim()
        if (token !== '') {
          out.keywords.push('-' + token)
        }
        return ' '
      })

      for (const raw of s.split(/[\s,，、;；|/]+/)) {
        const token = raw.trim().replace(/^[.。·:：!！?？]+|[.。·:：!！?？]+$/g, '')
        if (token === '') {
          continue
        }
        if (STOPWORDS[token.toLowerCase()] === 1) {
          continue
        }
        if (/^-/.test(token)) {
          const bare = token.slice(1)
          if (bare !== '') {
            out.keywords.push('-' + bare)
          }
          continue
        }
        if (/^[A-Za-z0-9][A-Za-z0-9 .&+'\-]*$/.test(token)) {
          out.keywords.push(token)
          continue
        }
        out.ignored.push(token)
      }

      if (excludedQ.length > 0) {
        const kept = [1, 2, 3, 4].filter((n) => excludedQ.indexOf(n) < 0)
        out.q = out.q.length > 0 ? out.q.filter((n) => kept.indexOf(n) >= 0) : kept
        out.touched.q = true
      }
      if (out.q.length > 0) {
        out.touched.q = true
      }
      out.touched.trend = out.trend.length > 0
      out.touched.top = out.top !== 'any'
      out.touched.oa = out.oa !== 'any'
      out.touched.kw = out.keywords.length > 0
      out.touched.topic = out.topics.length > 0

      out.q = uniqueSorted(out.q)
      out.trend = unique(out.trend)
      out.keywords = unique(out.keywords)
      out.ignored = unique(out.ignored)
      return out
    }

    function unique(list) {
      const seen = {}
      const out = []
      for (const item of list) {
        const key = String(item)
        if (seen[key] === 1) {
          continue
        }
        seen[key] = 1
        out.push(item)
      }
      return out
    }

    function uniqueSorted(list) {
      return unique(list).sort((a, b) => a - b)
    }

    // ---------------------------------------------------------------------
    // Filtering and sorting
    // ---------------------------------------------------------------------
    const EMPTY_FILTERS = {
      topic: [], q: [], trend: [], top: 'any', oa: 'any', ifMin: '', ifMax: '', wos: [],
      kw: '', sort: 'q',
    }

    // Impact-factor bounds are typed text so an empty box means "no bound".
    function paramNumber(text) {
      const raw = String(text == null ? '' : text).trim()
      if (raw === '') {
        return null
      }
      const value = Number(raw)
      return Number.isFinite(value) ? value : null
    }

    function keywordTokens(kw) {
      return String(kw || '')
        .split(/[\s,，、]+/)
        .map((token) => token.trim())
        .filter((token) => token !== '')
    }

    function matches(journal, filters, tokens) {
      const topics = filters.topic || []
      if (topics.length > 0 && topics.indexOf(journal.f) < 0) {
        return false
      }
      const wosBits = filters.wos || []
      if (wosBits.length > 0) {
        const wanted = wosBits.reduce((acc, bit) => acc | bit, 0)
        if ((journal.wosBits & wanted) === 0) {
          return false
        }
      }
      const ifMin = paramNumber(filters.ifMin)
      const ifMax = paramNumber(filters.ifMax)
      if (ifMin !== null || ifMax !== null) {
        if (journal.impact === null) {
          return false
        }
        if (ifMin !== null && journal.impact < ifMin) {
          return false
        }
        if (ifMax !== null && journal.impact > ifMax) {
          return false
        }
      }
      if (filters.q.length > 0 && filters.q.indexOf(journal.q25) < 0) {
        return false
      }
      if (filters.trend.length > 0 && filters.trend.indexOf(journal.trend) < 0) {
        return false
      }
      if (filters.top !== 'any' && journal.top !== (filters.top === 'yes')) {
        return false
      }
      if (filters.oa !== 'any' && journal.oa !== (filters.oa === 'yes')) {
        return false
      }
      const name = journal.name.toLowerCase()
      for (const token of tokens) {
        const lower = token.toLowerCase()
        if (lower.charAt(0) === '-') {
          if (lower.length > 1 && name.indexOf(lower.slice(1)) >= 0) {
            return false
          }
          continue
        }
        if (name.indexOf(lower) < 0) {
          return false
        }
      }
      return true
    }

    const TREND_RANK = { up: 0, same: 1, new: 2, down: 3 }

    function sortRows(rows, sort) {
      if (sort === 'name') {
        return rows.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))
      }
      if (sort === 'if' || sort === 'if-asc') {
        const direction = sort === 'if-asc' ? 1 : -1
        return rows.sort((a, b) => {
          // "No impact factor" is missing data, not the lowest value, so those
          // rows stay at the bottom in both directions.
          if (a.impact === null && b.impact === null) {
            return a.q25 - b.q25
          }
          if (a.impact === null) {
            return 1
          }
          if (b.impact === null) {
            return -1
          }
          if (a.impact !== b.impact) {
            return direction * (a.impact - b.impact)
          }
          return a.q25 - b.q25
        })
      }
      if (sort === 'delta') {
        // Real moves first (biggest jump down in quartile number = best), then
        // unchanged rows, then the 2023-unlisted (new) ones: otherwise 8k new
        // titles would bury every upgrade.
        return rows.sort((a, b) => {
          const da = a.q23 === 0 ? -99 : a.q23 - a.q25
          const db = b.q23 === 0 ? -99 : b.q23 - b.q25
          if (da !== db) {
            return db - da
          }
          if (a.q25 !== b.q25) {
            return a.q25 - b.q25
          }
          return a.name.localeCompare(b.name)
        })
      }
      return rows.sort((a, b) => {
        if (a.q25 !== b.q25) {
          return a.q25 - b.q25
        }
        const ra = TREND_RANK[a.trend]
        const rb = TREND_RANK[b.trend]
        if (ra !== rb) {
          return ra - rb
        }
        return a.name.localeCompare(b.name)
      })
    }

    function filterRows(datasetRows, filters) {
      const tokens = keywordTokens(filters.kw)
      const out = []
      for (const journal of datasetRows) {
        if (matches(journal, filters, tokens)) {
          out.push(journal)
        }
      }
      return sortRows(out, filters.sort)
    }

    // ---------------------------------------------------------------------
    // Shared overlay state (footer action <-> overlay cell, same module)
    // ---------------------------------------------------------------------
    const overlayState = { open: false }
    const overlaySubs = []
    let lastTrigger = null

    function setOverlayOpen(open) {
      overlayState.open = open
      for (const notify of overlaySubs.slice()) {
        notify()
      }
    }

    function useOverlayOpen() {
      const pair = React.useState(overlayState.open)
      React.useEffect(() => {
        const notify = () => pair[1](overlayState.open)
        overlaySubs.push(notify)
        return () => {
          const index = overlaySubs.indexOf(notify)
          if (index >= 0) {
            overlaySubs.splice(index, 1)
          }
        }
      }, [])
      return pair[0]
    }

    function useLocaleRevision() {
      const pair = React.useState(0)
      React.useEffect(() => {
        const locale = localeService
        if (locale === null || typeof locale.subscribe !== 'function') {
          return undefined
        }
        return locale.subscribe(() => pair[1]((value) => value + 1))
      }, [])
      return pair[0]
    }

    // ---------------------------------------------------------------------
    // Small pieces
    // ---------------------------------------------------------------------
    function number(value) {
      return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    }

    function Chip(props) {
      return h('button', {
        type: 'button',
        className: 'cjf-chip',
        'aria-pressed': props.on ? 'true' : 'false',
        onClick: props.onClick,
        title: props.title,
      }, props.children)
    }

    function QuartilePill(props) {
      return h('span', { className: 'cjf-q' + (props.n === 1 ? ' q1' : '') }, 'Q' + props.n)
    }

    // "↑ 3→2" reads as "moved up from Q3 to Q2", which the Q pill alone cannot
    // convey; 持平 and 新增 need no second number.
    function TrendCell(props) {
      const journal = props.journal
      let text
      if (journal.trend === 'new') {
        text = m('trendNew')
      } else if (journal.trend === 'same') {
        text = m('trendSame')
      } else {
        text = (journal.trend === 'up' ? '↑ ' : '↓ ') + journal.q23 + '→' + journal.q25
      }
      return h('span', {
        className: 'cjf-trend ' + journal.trend,
        title: journal.q23 === 0 ? m('trendNew') : m('colTrend') + ': Q' + journal.q23 + ' → Q' + journal.q25,
      }, text)
    }

    // ---------------------------------------------------------------------
    // Footer action
    // ---------------------------------------------------------------------
    function SidebarAction(props) {
      const open = useOverlayOpen()
      const wide = !(props && props.wide === false)
      return h('button', {
        type: 'button',
        className: wide ? 'cjf-side' : 'cjf-side cjf-side-rail',
        'aria-expanded': open ? 'true' : 'false',
        'aria-label': m('open'),
        title: m('open'),
        onClick: (event) => {
          lastTrigger = event.currentTarget
          setOverlayOpen(!open)
        },
      }, wide ? m('open') : '筛')
    }

    function ifSortMark(sort) {
      if (sort === 'if') {
        return '↓'
      }
      return sort === 'if-asc' ? '↑' : '↕'
    }

    function ResultList(props) {
      const rows = props.rows
      const fields = props.fields || []
      return h('div', { className: 'cjf-list' },
        h('div', { className: 'cjf-headrow' },
          h('span', null, m('colName')),
          h('span', null, m('colQ25')),
          h('span', null, m('colTrend')),
          h('button', {
            type: 'button',
            className: 'cjf-sortbtn',
            onClick: props.onSortIf,
            title: m('sortIfHint'),
            'aria-label': m('sortIfHint'),
          }, m('colIf'), h('span', { className: 'cjf-sortarrow' }, ifSortMark(props.sort))),
          h('span', null, m('colTop')),
          h('span', null, m('colOa')),
        ),
        props.visible.map((journal, index) => h('div', { key: journal.name + index, className: 'cjf-row' },
          h('span', { className: 'cjf-namecell' },
            h('span', { className: 'cjf-name', title: journal.name }, journal.name),
            h('span', { className: 'cjf-topic' },
              journal.f >= 0 && fields[journal.f]
                ? (/^en/i.test(activeLocale()) ? fields[journal.f].en : fields[journal.f].zh)
                : m('topicUnknown'),
              journal.wosBits !== 0
                ? h('span', { className: 'cjf-topic-wos' }, ' · ' + wosBitsLabel(null, journal.wosBits))
                : null,
            ),
          ),
          h(QuartilePill, { n: journal.q25 }),
          h(TrendCell, { journal: journal }),
          h('span', { className: 'cjf-if' + (journal.impact === null ? ' none' : '') }, impactText(journal)),
          h('span', null, journal.top ? h('span', { className: 'cjf-tag' }, 'TOP') : null),
          h('span', null, journal.oa ? h('span', { className: 'cjf-tag' }, 'OA') : null),
        )),
        rows.length > ROW_CAP ? h('div', { className: 'cjf-more' },
          m('more', { cap: number(ROW_CAP), n: number(rows.length) }),
        ) : null,
      )
    }

    // ---------------------------------------------------------------------
    // Panel
    // ---------------------------------------------------------------------
    function Panel() {
      const open = useOverlayOpen()
      useLocaleRevision()
      const [data, setData] = React.useState(null)
      const [error, setError] = React.useState(null)
      const [filters, setFilters] = React.useState(EMPTY_FILTERS)
      const [prompt, setPrompt] = React.useState('')
      const [notice, setNotice] = React.useState(null)
      const [exportUrl, setExportUrl] = React.useState(null)
      const promptRef = React.useRef(null)
      const linkRef = React.useRef(null)
      const panelRef = React.useRef(null)

      React.useEffect(() => {
        if (!open) {
          return undefined
        }
        let live = true
        loadData()
          .then((next) => {
            if (live) {
              setData(next)
              setError(null)
            }
          })
          .catch((err) => {
            if (live) {
              setError(String((err && err.message) || err))
            }
          })
        return () => {
          live = false
        }
      }, [open])

      React.useEffect(() => {
        if (!open) {
          return undefined
        }
        const timer = setTimeout(() => {
          if (promptRef.current !== null) {
            promptRef.current.focus()
          }
        }, 30)
        const onKey = (event) => {
          if (composing(event)) {
            return
          }
          if (event.key === 'Escape') {
            setOverlayOpen(false)
            return
          }
          if (event.key === 'Tab') {
            trapTab(event, panelRef.current)
          }
        }
        document.addEventListener('keydown', onKey)
        return () => {
          clearTimeout(timer)
          document.removeEventListener('keydown', onKey)
          // Hand focus back to the sidebar control that opened the panel.
          if (lastTrigger !== null && lastTrigger.isConnected === true) {
            lastTrigger.focus()
          }
        }
      }, [open])

      const rows = React.useMemo(() => {
        if (data === null) {
          return []
        }
        return filterRows(data.journals, filters)
      }, [data, filters])

      const distribution = React.useMemo(() => {
        const counts = { 1: 0, 2: 0, 3: 0, 4: 0 }
        for (const journal of rows) {
          counts[journal.q25] += 1
        }
        return counts
      }, [rows])

      // Topic chips: only fields that actually occur, most common first, so the
      // shoulders of the list are the ones this table concentrates on.
      const topicOrder = React.useMemo(() => {
        if (data === null) {
          return []
        }
        const order = []
        for (let i = 0; i < data.fields.length; i += 1) {
          if (data.fieldCounts[i] > 0) {
            order.push(i)
          }
        }
        return order.sort((a, b) => data.fieldCounts[b] - data.fieldCounts[a])
      }, [data])

      if (!open) {
        return null
      }

      const topicLabel = (index) => {
        const english = /^en/i.test(activeLocale())
        return english ? data.fields[index].en : data.fields[index].zh
      }

      const toggleQ = (value) => {
        setNotice(null)
        setFilters((current) => ({ ...current, q: toggle(current.q, value) }))
      }
      const toggleTopic = (value) => {
        setNotice(null)
        setFilters((current) => ({ ...current, topic: toggle(current.topic, value) }))
      }
      const toggleWos = (value) => {
        setNotice(null)
        setFilters((current) => ({ ...current, wos: toggle(current.wos, value) }))
      }
      const toggleTrend = (value) => {
        setNotice(null)
        setFilters((current) => ({ ...current, trend: toggle(current.trend, value) }))
      }
      const setAny = (key, value) => {
        setNotice(null)
        setFilters((current) => ({ ...current, [key]: value }))
      }

      // Applying a requirement only overwrites the dimensions it names, so a
      // prompt like "升级" never wipes quartiles or keywords set by hand.
      const applyPrompt = () => {
        const parsed = parsePrompt(prompt)
        const touched = parsed.touched
        const nothing = !touched.q && !touched.trend && !touched.top && !touched.oa &&
          !touched.kw && !touched.topic && !touched.if && !touched.wos
        const topicIndexes = []
        if (touched.topic && data !== null) {
          for (const name of parsed.topics) {
            for (let i = 0; i < data.fields.length; i += 1) {
              if (data.fields[i].en === name) {
                topicIndexes.push(i)
                break
              }
            }
          }
        }
        setFilters((current) => ({
          topic: touched.topic && topicIndexes.length > 0 ? topicIndexes : current.topic,
          q: touched.q ? parsed.q : current.q,
          trend: touched.trend ? parsed.trend : current.trend,
          top: touched.top ? parsed.top : current.top,
          oa: touched.oa ? parsed.oa : current.oa,
          wos: touched.wos ? parsed.wos : current.wos,
          ifMin: touched.if ? (parsed.ifMin === null ? '' : String(parsed.ifMin)) : current.ifMin,
          ifMax: touched.if ? (parsed.ifMax === null ? '' : String(parsed.ifMax)) : current.ifMax,
          kw: touched.kw ? parsed.keywords.join(' ') : current.kw,
          sort: current.sort,
        }))
        setNotice({
          ok: !nothing,
          ignored: parsed.ignored,
        })
      }

      const exportCsv = () => {
        const head = [m('colName'), '2025', '2023', m('trend'), m('colIf'), m('colTop'), m('colOa'),
          m('colField'), m('colWos')]
        const lines = [head.map(csvCell).join(',')]
        for (const journal of rows) {
          lines.push([
            csvCell(journal.name),
            'Q' + journal.q25,
            journal.q23 === 0 ? '' : 'Q' + journal.q23,
            m('trend' + journal.trend.charAt(0).toUpperCase() + journal.trend.slice(1)),
            journal.impact === null ? '' : journal.impact.toFixed(1),
            journal.top ? m('yes') : m('no'),
            journal.oa ? m('yes') : m('no'),
            csvCell(journal.f >= 0 && data.fields[journal.f]
              ? (/^en/i.test(activeLocale()) ? data.fields[journal.f].en : data.fields[journal.f].zh)
              : m('topicUnknown')),
            csvCell(wosLabel(data, journal.wos)),
          ].join(','))
        }
        const blob = new Blob(['\ufeff' + lines.join('\r\n') + '\r\n'], { type: 'text/csv;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const link = linkRef.current
        if (link !== null) {
          link.href = url
          link.download = 'cas-journals-' + stamp() + '.csv'
          link.click()
        }
        if (exportUrl !== null) {
          URL.revokeObjectURL(exportUrl)
        }
        setExportUrl(url)
      }

      const visible = rows.length > ROW_CAP ? rows.slice(0, ROW_CAP) : rows

      return h('div', { className: 'cjf-mask', onClick: () => setOverlayOpen(false) },
        h('div', {
          ref: panelRef,
          className: 'cjf-panel',
          role: 'dialog',
          'aria-modal': 'true',
          'aria-label': m('title'),
          onClick: (event) => event.stopPropagation(),
        },
        h('div', { className: 'cjf-head' },
          h('div', null,
            h('div', { className: 'cjf-title' }, m('title')),
            h('div', { className: 'cjf-sub' }, m('subtitle', { n: data === null ? '—' : number(data.count) })),
          ),
          h('button', {
            type: 'button',
            className: 'cjf-iconbtn',
            title: m('close'),
            'aria-label': m('close'),
            onClick: () => setOverlayOpen(false),
          }, '✕'),
        ),
        h('div', { className: 'cjf-body' },
          h('div', { className: 'cjf-prompt' },
            h('input', {
              ref: promptRef,
              className: 'cjf-input',
              value: prompt,
              placeholder: m('promptPlaceholder'),
              'aria-label': m('promptPlaceholder'),
              onChange: (event) => {
                setPrompt(event.target.value)
                setNotice(null)
              },
              onKeyDown: (event) => {
                if (composing(event)) {
                  return
                }
                if (event.key === 'Enter') {
                  event.preventDefault()
                  applyPrompt()
                }
              },
            }),
            h('button', { type: 'button', className: 'cjf-btn primary', onClick: applyPrompt }, m('apply')),
          ),
          notice === null ? null : h('div', {
            className: 'cjf-notice',
            role: 'status',
            'aria-live': 'polite',
          },
            notice.ok ? m('parsed') : m('parsedNothing'),
            notice.ignored.length > 0 ? h('span', { className: 'cjf-warn' },
              ' · ' + m('ignored', { words: notice.ignored.join('、') }) + m('ignoredHint'),
            ) : null,
          ),
          h('div', { className: 'cjf-group' },
            h('span', { className: 'cjf-label' }, m('topic')),
            h('div', { className: 'cjf-chips cjf-chips-topic' },
              topicOrder.map((index) => h(Chip, {
                key: 'topic' + index,
                on: filters.topic.indexOf(index) >= 0,
                onClick: () => toggleTopic(index),
                title: data && data.fields[index] ? data.fields[index].en : '',
              }, topicLabel(index))),
              data !== null && data.topicUnmatched > 0 ? h(Chip, {
                key: 'topic-unknown',
                on: filters.topic.indexOf(-1) >= 0,
                onClick: () => toggleTopic(-1),
                title: m('topicUnknownHint'),
              }, m('topicUnknown')) : null,
            ),
          ),
          h('div', { className: 'cjf-group' },
            h('span', { className: 'cjf-label' }, m('quartile')),
            h('div', { className: 'cjf-chips' },
              [1, 2, 3, 4].map((value) => h(Chip, {
                key: 'q' + value,
                on: filters.q.indexOf(value) >= 0,
                onClick: () => toggleQ(value),
                title: m('qLabel', { n: value }),
              }, m('qLabel', { n: value }))),
            ),
          ),
          h('div', { className: 'cjf-group' },
            h('span', { className: 'cjf-label' }, m('trend')),
            h('div', { className: 'cjf-chips' },
              [['up', m('trendUp')], ['down', m('trendDown')], ['same', m('trendSame')], ['new', m('trendNew')]]
                .map((entry) => h(Chip, {
                  key: 't' + entry[0],
                  on: filters.trend.indexOf(entry[0]) >= 0,
                  onClick: () => toggleTrend(entry[0]),
                }, entry[1])),
            ),
          ),
          h('div', { className: 'cjf-group' },
            h('span', { className: 'cjf-label' }, m('top')),
            h('div', { className: 'cjf-chips' },
              [['any', m('any')], ['yes', m('yes')], ['no', m('no')]].map((entry) => h(Chip, {
                key: 'top' + entry[0],
                on: filters.top === entry[0],
                onClick: () => setAny('top', entry[0]),
              }, entry[1])),
            ),
          ),
          h('div', { className: 'cjf-group' },
            h('span', { className: 'cjf-label' }, m('oa')),
            h('div', { className: 'cjf-chips' },
              [['any', m('any')], ['yes', m('yes')], ['no', m('no')]].map((entry) => h(Chip, {
                key: 'oa' + entry[0],
                on: filters.oa === entry[0],
                onClick: () => setAny('oa', entry[0]),
              }, entry[1])),
            ),
          ),
          h('div', { className: 'cjf-group' },
            h('span', { className: 'cjf-label' }, m('wos')),
            h('div', { className: 'cjf-chips' },
              WOS_KEYS.map((entry, bit) => h(Chip, {
                key: 'wos' + entry[0],
                on: (filters.wos || []).indexOf(entry[1]) >= 0,
                onClick: () => toggleWos(entry[1]),
                title: m('wosHint', { label: entry[0], n: data === null ? 0 : data.wosCounts[bit] }),
              }, entry[0], data === null ? null : h('span', {
                className: 'cjf-chipcount',
              }, number(data.wosCounts[bit])))),
            ),
          ),
          h('div', { className: 'cjf-group' },
            h('span', { className: 'cjf-label' }, m('impact')),
            h('div', { className: 'cjf-chips cjf-ifbox' },
              h('input', {
                className: 'cjf-num',
                value: filters.ifMin,
                inputMode: 'decimal',
                placeholder: m('ifMin'),
                'aria-label': m('ifMinAria'),
                onChange: (event) => setAny('ifMin', event.target.value),
              }),
              h('span', { className: 'cjf-dash' }, '–'),
              h('input', {
                className: 'cjf-num',
                value: filters.ifMax,
                inputMode: 'decimal',
                placeholder: m('ifMax'),
                'aria-label': m('ifMaxAria'),
                onChange: (event) => setAny('ifMax', event.target.value),
              }),
              h('span', { className: 'cjf-muted' }, m('ifHint')),
            ),
          ),
          h('div', { className: 'cjf-group' },
            h('span', { className: 'cjf-label' }, m('keyword')),
            h('input', {
              className: 'cjf-input cjf-kw',
              value: filters.kw,
              placeholder: m('keywordPlaceholder'),
              'aria-label': m('keywordPlaceholder'),
              onChange: (event) => setAny('kw', event.target.value),
            }),
          ),
          h('div', { className: 'cjf-bar' },
            h('div', { className: 'cjf-count' }, m('countPrefix'),
              h('b', null, data === null ? '—' : number(rows.length)), ' ', m('countUnit')),
            h('div', { className: 'cjf-tools' },
              data === null ? null : h('span', { className: 'cjf-count' },
                m('distributionLabel') + ' ' + m('distribution', {
                  a: distribution[1], b: distribution[2], c: distribution[3], d: distribution[4],
                }),
                rows.length > ROW_CAP ? ' · ' + m('capped', { cap: number(ROW_CAP) }) : '',
              ),
              h('select', {
                className: 'cjf-select',
                value: filters.sort,
                'aria-label': m('sort'),
                onChange: (event) => setAny('sort', event.target.value),
              },
              h('option', { value: 'q' }, m('sortQ')),
              h('option', { value: 'if' }, m('sortIf')),
              h('option', { value: 'if-asc' }, m('sortIfAsc')),
              h('option', { value: 'name' }, m('sortName')),
              h('option', { value: 'delta' }, m('sortDelta')),
              ),
              h('button', {
                type: 'button',
                className: 'cjf-btn',
                disabled: rows.length === 0,
                onClick: exportCsv,
              }, m('export')),
              h('button', {
                type: 'button',
                className: 'cjf-btn',
                onClick: () => {
                  setNotice(null)
                  setPrompt('')
                  setFilters(EMPTY_FILTERS)
                },
              }, m('reset')),
            ),
          ),
          error !== null ? h('div', { className: 'cjf-empty cjf-warn' }, m('loadFailed', { msg: error })) :
            data === null ? h('div', { className: 'cjf-empty' }, m('loading')) :
              rows.length === 0 ? h('div', { className: 'cjf-empty' }, m('empty')) :
                h(ResultList, {
                  rows: rows,
                  visible: visible,
                  fields: data.fields,
                  sort: filters.sort,
                  onSortIf: () => {
                    setNotice(null)
                    setFilters((current) => ({
                      ...current,
                      sort: current.sort === 'if' ? 'if-asc' : 'if',
                    }))
                  },
                }),
        ),
        h('div', { className: 'cjf-foot' },
          h('span', null, m('dataNote'),
            data === null ? '' : ' · ' + m('coverage', { n: number(data.withIf) })),
          h('a', { ref: linkRef, style: { display: 'none' }, 'aria-hidden': 'true' }, ''),
        ),
        ),
      )
    }

    // A Chinese IME fires Enter/Escape while composing; those belong to the
    // candidate window, not to this panel.
    function composing(event) {
      if (event.isComposing === true || event.keyCode === 229) {
        return true
      }
      return event.nativeEvent !== undefined && event.nativeEvent !== null &&
        event.nativeEvent.isComposing === true
    }

    function trapTab(event, panel) {
      if (panel === null || panel === undefined) {
        return
      }
      const nodes = panel.querySelectorAll(
        'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])',
      )
      const focusable = []
      for (const node of nodes) {
        if (node.offsetParent !== null) {
          focusable.push(node)
        }
      }
      if (focusable.length === 0) {
        return
      }
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement
      if (event.shiftKey === true && (active === first || panel.contains(active) === false)) {
        event.preventDefault()
        last.focus()
        return
      }
      if (event.shiftKey !== true && (active === last || panel.contains(active) === false)) {
        event.preventDefault()
        first.focus()
      }
    }

    function toggle(list, value) {
      if (list.indexOf(value) >= 0) {
        return list.filter((item) => item !== value)
      }
      return list.concat([value])
    }

    // Impact factors travel as three base-36 digits holding tenths, so 0 and
    // "no IF on record" are the same code.
    function base36(text) {
      let value = 0
      for (let i = 0; i < text.length; i += 1) {
        const digit = parseInt(text.charAt(i), 36)
        if (!Number.isFinite(digit)) {
          return 0
        }
        value = value * 36 + digit
      }
      return value
    }

    const WOS_KEYS = [
      ['SCIE', 1], ['SSCI', 2], ['ESCI', 4], ['AHCI', 8],
    ]

    function wosMask(label) {
      let mask = 0
      for (const entry of WOS_KEYS) {
        if (String(label || '').indexOf(entry[0]) >= 0) {
          mask |= entry[1]
        }
      }
      return mask
    }

    // Display form of a bitmask: "SCIE+SSCI".
    function wosBitsLabel(data, bits) {
      const parts = []
      for (const entry of WOS_KEYS) {
        if ((bits & entry[1]) !== 0) {
          parts.push(entry[0])
        }
      }
      return parts.join('+')
    }

    function wosLabel(data, index) {
      if (data === null || index <= 0) {
        return ''
      }
      return (data.wosNames || [])[index] || ''
    }

    function impactText(journal) {
      return journal.impact === null ? '—' : journal.impact.toFixed(1)
    }

    function csvCell(value) {
      return '"' + String(value == null ? '' : value).replace(/"/g, '""') + '"'
    }

    function stamp() {
      const now = new Date()
      const pad = (value) => (value < 10 ? '0' + value : String(value))
      return now.getFullYear() + pad(now.getMonth() + 1) + pad(now.getDate()) + '-' +
        pad(now.getHours()) + pad(now.getMinutes())
    }

    function injectCss() {
      if (document.querySelector('style[data-plugin-css="cas-journal-filter"]') !== null) {
        return
      }
      const tag = document.createElement('style')
      tag.dataset.plugin = 'cas-journal-filter'
      tag.dataset.pluginCss = 'cas-journal-filter'
      tag.textContent = CSS
      document.head.appendChild(tag)
    }

    // ---------------------------------------------------------------------
    // Plugin entry
    // ---------------------------------------------------------------------
    const inject = ['slots', 'locale']

    function apply(ctx) {
      injectCss()
      const slots = ctx.get('slots')
      const locale = ctx.get('locale')
      localeService = locale === undefined ? null : locale
      if (localeService !== null && typeof localeService.register === 'function') {
        try {
          localeService.register(NS, 'zh', ZH)
          localeService.register(NS, 'en', EN)
        } catch (error) {
          // A locale dictionary never blocks the panel: m() falls back to ZH.
        }
        if (typeof localeService.bind === 'function') {
          try {
            translate = localeService.bind(NS)
          } catch (error) {
            translate = null
          }
        }
      }
      if (slots === undefined) {
        return
      }
      slots.inject('sidebar.footer.action', () => slots.register({
        name: 'sidebar.footer.action',
        id: 'cas-journal-filter',
        order: 30,
        label: () => m('open'),
      }, SidebarAction))
      slots.inject('shell.overlay', () => slots.register({
        name: 'shell.overlay',
        id: 'cas-journal-filter-panel',
        order: 40,
      }, Panel))
    }

    return {
      inject: inject,
      apply: apply,
      // Test-facing exports: the page only consumes apply(); a Node harness
      // drives these pure functions against the real payload.
      __internal: {
        Panel: Panel,
        ResultList: ResultList,
        setOverlayOpen: setOverlayOpen,
        categoryWords: CATEGORY_WORDS,
        nameWords: NAME_WORDS,
        parsePrompt: parsePrompt,
        decode: decode,
        filterRows: filterRows,
        matches: matches,
        keywordTokens: keywordTokens,
        sortRows: sortRows,
      },
    }
  },
})
