# dsh-journal-selection-plugin

给 [DeepSeek Harness](https://github.com/deepseek-ai)（DSH）用的**期刊筛选插件**：把 2025 中科院分区表（21,772 本）做成一个随叫随到的浮层面板，按**大类 / 影响因子 / 分区 / 相比 2023 的升降 / Top / 开放获取 / WoS 索引 / 刊名关键词**筛选，并导出 CSV。

全部在本地表格上计算：**不调用模型、不联网、不写任何文件**（除了你点「导出 CSV」那一下）。

## 功能

- **入口**：侧栏底部（设置上方）的「期刊筛选」按钮，点开在应用上浮出面板；Esc / 点遮罩 / ✕ 关闭。
- **一句话说要求**：面板顶部输入框写中文或英文要求，回车即变成筛选条件：
  - 分区：`2区以上`、`1-2区`、`一二区`、`Q1 Q2`、`不要1区`
  - 升降：`升级`、`降级`、`持平`、`新增`（对比 2023）
  - 影响因子：`IF>5`、`影响因子5分以上`、`5分以上`、`if 3-8`、`IF<2`
  - 学科：`材料`、`医学`、`工程`、`社科`、`综合类`、`农林`、`计算机`…（对应 21 个中科院大类）
  - 小类：`小类:法学`、`小类=law`、`minor:能源与燃料`（小类名支持中英文，模糊匹配）
  - Top / OA：`top`、`非OA`、`no OA`、`开源`
  - WoS：`SCIE`、`sci`、`SSCI`、`ESCI`、`AHCI`
  - 刊名：`刊名含 energy`、`排除 review`、`-review`
- **大类 + 小类两级选择**：21 个大类；选中大类后，小类列表自动收窄到该大类下的 254 个中相关的那部分，**小类可用搜索框直接找**（输入「法学」「能源与燃料」「law」），可多选。
- **也可以纯手点**：大类、小类、分区、升降、Top、OA、IF 区间、WoS 索引各一行标签/输入框。
- **排序**：分区优先 / 影响因子 高→低 / 影响因子 低→高 / 刊名 / 变化幅度；点表头「影响因子」也能切换升降序。
- **导出 CSV**：期刊名、2025 分区、2023 分区、变化、影响因子、Top、Open Access、中科院大类、WoS 索引（UTF-8 BOM，Excel 直接打开）。表格只渲染前 300 条，CSV 是全量。

## 安装

方式一（本地目录，推荐）：

```bash
git clone git@github.com:wongdark2017/dsh-journal-selection-plugin.git
```

然后在 DSH 的「插件」页 →「添加插件」→ 选择这个目录；或让 Agent 执行 `plugin_manager` 的 `install_bundle`，`target` 传该目录的绝对路径。

安装后 bundle 名为 `@local/cas-journal-filter`（本地安装名）。客户端改动刷新页面生效；`data/journals.json` 换文件后 Host 会按 mtime 自动重载，不需要重启。

## 数据

| 内容 | 来源 | 覆盖 |
|---|---|---|
| 2025 分区、2023 分区、Top、Open Access | 2025 中科院分区表（用户提供的 `2025中科院分区表完整版附2023vs2025对比版.xlsx`） | 21,772 / 21,772 |
| 中科院大类、**小类**、WoS 索引、2024 JCR 影响因子 | 公开流通的 2025 分区表合并数据（`FQBJCR2025-UTF8.csv` + ShowJCR 的 `JCR2024-UTF8.csv`） | 大类 21,772；小类 21,772（254 个，最多 6 个/本）；IF 20,872（95.9%） |

- 两张表的刊名 **100% 对得上**，分区逐条核对 **0 处不一致**。
- 影响因子是 **Clarivate JCR 2024**（2025 年 6 月发布）；未被 JCR 收录的 900 本显示「—」，一旦设置 IF 边界就会被排除。
- WoS 索引共 4 类（可多选，并集）：SCIE 9,426 / SSCI 3,525 / ESCI 8,217 / AHCI 1,742；4 本无索引。
- **合规提示**：分区表与 JCR 的版权归中国科学院文献情报中心与 Clarivate 所有。本仓库内的 `data/journals.json` 只是**便于个人科研使用的离线副本**，仅供个人研究参考；商业用途或再分发前请自行确认授权。不使用这些数据时删掉 `data/` 并自行生成即可（见下）。

### 换成自己的表

`data/journals.json` 是紧凑编码的单一 JSON，字段：

| 字段 | 说明 |
|---|---|
| `names` | 期刊名，`\n` 连接 |
| `q25` / `q23` | 2025 / 2023 分区，每行一个字符 `1`–`4`；`0` 表示 2023 未收录 |
| `flags` | 每行 2 个字符：Top、Open Access（`1`/`0`） |
| `field` | 每行 1 个字符，大类下标（`A` = 0）或 `.` = 未知 |
| `minor` | 每行一串 2 字符的 base36 小类下标（可多个），行与行之间用 `\|` 分隔；空串 = 无小类 |
| `minorNames` | 小类表，`{zh,en}`，254 项 |
| `if` | 每行 3 个字符的 base36，表示影响因子 ×10（`000` = 无 IF） |
| `wos` | 每行 1 个字符，base36 的 `wosNames` 下标 |
| `fields` / `wosNames` | 大类表（`{zh,en}`）与 WoS 标记表 |

`count` 必须与 `names` 的行数一致。

## 示例

| 你在要求框里写 | 得到 |
|---|---|
| `法学` | 大类=社会学 的 2,038 本（法学期刊在中科院表里归入社会学大类） |
| `小类:法学` | 精确的 **427 本** 法学小类期刊（Q1 9 / Q2 36 / Q3 77 / Q4 305） |
| `小类:法学 2区以上` | 法学小类里 Q1–Q2 的 45 本 |
| `材料 IF>10 SCIE` | 材料科学大类、IF ≥ 10、被 SCIE 收录 |
| `2区以上 非OA 升级 energy` | Q1–Q2、非 OA、2025 相比 2023 升级、刊名含 energy |

## 开发

```bash
node --check client.js && node --check index.js
node test/logic.mjs   # 解码 / 需求解析 / 筛选 / 排序 / 大类·小类（对真实数据）
node test/host.mjs    # 数据路由：GET/HEAD/405、缓存与惰性读取
```

`client.js` 是自包含的浏览器模块（`window.__ModuleLoader__` 的 `factory(require)` 形式，React 由宿主提供，无 JSX、无构建步骤）；`index.js` 是 Host 半，只注册一个只读资源路由 `/cas-journal-filter/data.json`。

## 目录

```
client.js          浮层面板 + 需求解析 + 筛选排序 + CSV
index.js           Host 半：只读数据路由（mtime 感知缓存）
cordis.patch.yml   bundle 的 loader patch（插入一行）
locale/{en,zh}.json 插件页的标题与说明
icon.svg           图标
data/journals.json 21,772 本的紧凑数据
test/              纯 Node 测试
```

## License

MIT（见 `LICENSE`）。数据部分见上方「合规提示」。
