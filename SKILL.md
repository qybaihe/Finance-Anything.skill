---
name: finance-anything-decision
description: >
  Start a Finance Anything multi-agent decision workflow from a short natural
  language goal. Use this when an agent, OpenCode runtime, OpenCloud runtime, or
  user asks for help deciding whether to buy, invest in, compare, or choose
  something and wants the Finance Anything agent team to produce the final
  decision report.
---

# Finance Anything Decision

## 中文

当用户或外部 Agent 提出一个需要判断、购买、投资、比较或选择的问题时，使用这个 Skill 把目标交给 Finance Anything。不要用调用方自己的临时分析替代 Finance Anything 的多智能体工作流；本 Skill 的职责是创建决策议题，并把议题链接返回给调用方。

典型目标包括：

- 是否买入某只股票、基金、ETF 或其它金融资产。
- 是否购买某个商品、服务、课程、软件订阅或大件设备。
- 某个二手商品是否值得入手，当前价格是否合理，未来保值率如何。
- 多个备选方案之间如何选择，预算、风险、收益、机会成本如何权衡。

### 调用要求

调用方需要具备 Finance Anything 或 Paperclip API 身份。优先使用 API Key：

- `FINANCE_ANYTHING_API_URL` 或 `PAPERCLIP_API_URL`
- `FINANCE_ANYTHING_API_KEY` 或 `PAPERCLIP_API_KEY`
- 可选：`PAPERCLIP_RUN_ID`，用于审计和链路追踪

在正常 Paperclip、OpenCode、OpenCloud 或其它 Agent runtime 中，这些值通常由运行环境自动注入。

在 ArkClaw 中使用时，把本仓库作为标准 `SKILL.md` Skill 导入即可。运行环境需要 Node.js 18+、可访问 Finance Anything API，并通过 ArkClaw 的密钥或环境变量配置 `FINANCE_ANYTHING_API_URL` 与凭据。

如果环境里没有 API Key，先询问用户：

1. Finance Anything API URL，例如 `https://finance.oir.me`。
2. API Key。如果用户没有 API Key，再询问是否使用账号登录。
3. 如果用户选择账号登录，运行脚本时加 `--auth login`，由终端交互式询问用户名或邮箱和密码。Finance Anything 浏览器登录页使用“用户名”，Skill 会自动转换为后端需要的内部邮箱格式。

不要在对话正文、issue 标题、日志或上下文里记录用户密码、API Key 或未脱敏隐私。账号密码只用于本次登录换取会话 Cookie，不应持久化。

### 启动决策

在本 Skill 目录运行：

```bash
node scripts/start-decision.mjs --goal "我现在需要购买一台二手 MacBook，请帮我判断是否值得入手"
```

带额外约束：

```bash
node scripts/start-decision.mjs \
  --goal "我是否应该买入这只股票" \
  --context "预算 5 万元，持有周期 6-12 个月，不能接受大幅回撤"
```

也可以从标准输入读取目标：

```bash
echo "请判断这辆二手车是否值得购买" | node scripts/start-decision.mjs
```

如果需要账号密码登录：

```bash
node scripts/start-decision.mjs --auth login --goal "请判断这辆二手车是否值得购买"
```

脚本会调用：

```text
POST /api/finance/decisions
```

响应中会包含 `issuePath`、`issue.identifier`、`projectId`、`goalId`、`defaultAgentId` 等字段。调用方应该把创建出的 `issuePath` 返回给用户，并说明 Finance Anything 已经开始多智能体决策流程。

### 输入约束

- `goal` 应该保留用户原始决策目标，不要改写成过度抽象的问题。
- `context` 只放预算、时间、风险偏好、商品链接、候选方案、已知事实和用户限制。
- 不要在本 Skill 内生成最终投资或购买结论；最终结论由 Finance Anything 的报告智能体综合生成。
- 不要把 API Key、用户隐私或未脱敏凭证写入日志、README、issue 标题或上下文。
- 如果凭证缺失，先询问用户；不要猜测、伪造或从无关文件里寻找密码。

## English

Use this Skill when a user or external agent asks for a decision about buying, investing, comparing, or choosing something. The caller should not replace the Finance Anything workflow with its own temporary analysis. This Skill creates a decision issue and returns the issue link so the Finance Anything specialist agents can collaborate.

Common goals include:

- Decide whether to buy a stock, fund, ETF, or other financial asset.
- Decide whether to purchase a product, service, course, software subscription, or major device.
- Assess whether a second-hand item is worth buying, whether the price is fair, and how resale value may evolve.
- Compare options across budget, risk, return, opportunity cost, and user constraints.

### Requirements

The calling agent needs a Finance Anything or Paperclip API identity. Prefer API key authentication:

- `FINANCE_ANYTHING_API_URL` or `PAPERCLIP_API_URL`
- `FINANCE_ANYTHING_API_KEY` or `PAPERCLIP_API_KEY`
- Optional: `PAPERCLIP_RUN_ID` for audit trail

In normal Paperclip, OpenCode, OpenCloud, or other agent-runtime runs, these values are usually injected by the runtime.

For ArkClaw, import this repository as a standard `SKILL.md` Skill. The runtime needs Node.js 18+, network access to the Finance Anything API, and credentials provided through ArkClaw secrets or environment variables.

If no API key is available, ask the user for:

1. Finance Anything API URL, for example `https://finance.oir.me`.
2. API key. If they do not have one, ask whether to use account login.
3. If they choose account login, run the script with `--auth login` so the terminal can ask for username or email and password interactively. Finance Anything's browser sign-in accepts usernames; the Skill mirrors that conversion before calling the backend.

Do not write passwords, API keys, or unredacted private user data into conversation text, issue titles, logs, or context. Username/password login should only be used to obtain a session cookie for the current request.

### Start A Decision

From this Skill directory, run:

```bash
node scripts/start-decision.mjs --goal "Should I buy this second-hand MacBook?"
```

With extra context:

```bash
node scripts/start-decision.mjs \
  --goal "Should I buy this stock?" \
  --context "Budget: 50,000 CNY. Holding period: 6-12 months. Low tolerance for large drawdowns."
```

Read the goal from stdin:

```bash
echo "Please decide whether this used car is worth buying" | node scripts/start-decision.mjs
```

Use interactive username/password login when needed:

```bash
node scripts/start-decision.mjs --auth login --goal "Please decide whether this used car is worth buying"
```

The script calls:

```text
POST /api/finance/decisions
```

The response includes fields such as `issuePath`, `issue.identifier`, `projectId`, `goalId`, and `defaultAgentId`. Reply with the created `issuePath` and a short note that Finance Anything has started the multi-agent decision workflow.

### Input Discipline

- Keep `goal` close to the user's original decision target.
- Put only constraints, budget, timing, risk preference, product links, candidate options, and known facts in `context`.
- Do not generate the final purchase or investment conclusion inside this Skill. The final answer belongs to the Finance Anything report agent.
- Do not write API keys, user-private data, or unredacted credentials into logs, README examples, issue titles, or context.
- If credentials are missing, ask the user. Do not guess, invent, or search unrelated files for passwords.
