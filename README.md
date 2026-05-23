# Finance Anything Decision Skill

Finance Anything Decision Skill 是一个独立的 Agent Skill，用来把一句自然语言决策目标交给 Finance Anything，让系统内的多智能体团队协同分析，并生成最终决策报告。

This repository contains a standalone Agent Skill for Finance Anything. It lets another agent, such as OpenCode or OpenCloud, send one natural-language decision goal to Finance Anything, start the specialist multi-agent workflow, and return the created decision workspace/report entry.

## 中文说明

### 这是什么

Finance Anything 是基于 Paperclip 分支改造的万能决策助手。这个 Skill 是它的外部入口封装：当其它 Agent 需要判断“是否值得买、是否值得投、哪个方案更优、二手价值如何、风险在哪里”时，不需要自己重新分析一遍，只需要调用本 Skill，把目标提交给 Finance Anything。

Finance Anything 后端会创建一个决策议题，并调度内部智能体协作，包括但不限于市场研究、价格对比、财务分析、风险控制、二手价值评估、用户约束分析和最终报告生成。

### 适用场景

- 股票、基金、ETF、债券或其它投资标的是否值得买入。
- 手机、电脑、汽车、家电、课程、软件订阅等商品是否值得购买。
- 二手商品的保值率、折旧、转卖风险和真实成交价值判断。
- 多个方案之间的预算、风险、收益和长期价值比较。
- 企业采购、个人消费、家庭预算、学习投入等通用决策。

### 环境配置

调用方需要提供 Finance Anything 或 Paperclip API 身份：

```bash
export FINANCE_ANYTHING_API_URL="https://your-finance-anything-domain.example"
export FINANCE_ANYTHING_API_KEY="your_api_key"
```

也兼容 Paperclip 风格的环境变量：

```bash
export PAPERCLIP_API_URL="https://your-paperclip-or-finance-anything-domain.example"
export PAPERCLIP_API_KEY="your_api_key"
```

可选审计字段：

```bash
export PAPERCLIP_RUN_ID="external-agent-run-id"
```

不要把 API Key 写进仓库。建议由运行平台、Agent runtime 或密钥管理系统注入。

### 使用方式

直接传入目标：

```bash
node scripts/start-decision.mjs --goal "我现在需要购买一台二手 MacBook，请帮我判断是否值得入手"
```

附带预算、风险偏好和其它约束：

```bash
node scripts/start-decision.mjs \
  --goal "我是否应该买入这只股票" \
  --context "预算 5 万元，持有周期 6-12 个月，不能接受大幅回撤"
```

从标准输入读取：

```bash
echo "预算 6000 元，想买一台二手轻薄本，请帮我做决策" | node scripts/start-decision.mjs
```

查看帮助：

```bash
node scripts/start-decision.mjs --help
```

### API 行为

脚本会调用：

```text
POST /api/finance/decisions
```

请求体：

```json
{
  "goal": "我现在需要购买一台二手 MacBook，请帮我判断是否值得入手",
  "context": "预算 6000 元，偏好轻便，担心电池和保值率"
}
```

成功响应通常会包含：

- `issuePath`: 决策工作台或议题路径。
- `issue.identifier`: 创建出的决策议题编号。
- `projectId`: Finance Anything 项目 ID。
- `goalId`: 目标 ID。
- `defaultAgentId`: 默认决策协调 Agent。
- `agentCount`: 本轮可参与协作的 Agent 数量。

调用方应把 `issuePath` 返回给用户，并说明 Finance Anything 已经开始多智能体决策流程。

## English

### What This Is

Finance Anything is a universal decision assistant built as a fork of Paperclip. This Skill is the external entry point for other agents. When another agent needs to decide whether to buy, invest, compare, or choose something, it should call this Skill instead of replacing the Finance Anything workflow with its own one-off analysis.

The Finance Anything backend creates a decision issue and coordinates specialist agents for market research, price comparison, financial analysis, risk control, second-hand value assessment, user constraint analysis, and final report generation.

### Use Cases

- Decide whether to buy a stock, fund, ETF, bond, or other investment asset.
- Evaluate whether a phone, laptop, car, appliance, course, or software subscription is worth buying.
- Analyze depreciation, resale value, transaction risk, and fair value for second-hand goods.
- Compare multiple options across budget, risk, return, and long-term value.
- Support general purchasing, family budget, learning investment, and business procurement decisions.

### Configuration

Provide a Finance Anything or Paperclip API identity:

```bash
export FINANCE_ANYTHING_API_URL="https://your-finance-anything-domain.example"
export FINANCE_ANYTHING_API_KEY="your_api_key"
```

Paperclip-style variable names are also supported:

```bash
export PAPERCLIP_API_URL="https://your-paperclip-or-finance-anything-domain.example"
export PAPERCLIP_API_KEY="your_api_key"
```

Optional audit field:

```bash
export PAPERCLIP_RUN_ID="external-agent-run-id"
```

Do not commit API keys. Inject them through your runtime, agent platform, or secret manager.

### Usage

Start a decision with one goal:

```bash
node scripts/start-decision.mjs --goal "Should I buy this second-hand MacBook?"
```

Add constraints and context:

```bash
node scripts/start-decision.mjs \
  --goal "Should I buy this stock?" \
  --context "Budget: 50,000 CNY. Holding period: 6-12 months. Low tolerance for large drawdowns."
```

Pipe the goal from stdin:

```bash
echo "Help me decide whether this used laptop is worth buying under a 6000 CNY budget" | node scripts/start-decision.mjs
```

Show help:

```bash
node scripts/start-decision.mjs --help
```

### API Behavior

The script calls:

```text
POST /api/finance/decisions
```

Payload:

```json
{
  "goal": "Should I buy this second-hand MacBook?",
  "context": "Budget: 6000 CNY. I prefer portability and care about battery health and resale value."
}
```

The successful response usually includes `issuePath`, `issue.identifier`, `projectId`, `goalId`, `defaultAgentId`, and `agentCount`. Return the created `issuePath` to the user and explain that Finance Anything has started the multi-agent decision workflow.

## Repository Relationship

This standalone Skill is extracted from [qybaihe/Finance-Anything](https://github.com/qybaihe/Finance-Anything), a Finance Anything fork based on Paperclip. It is intentionally small so that external coding agents, internal automation systems, or agent platforms can install and call it without cloning the full application.

## Local Validation

```bash
npm run check
```

No third-party Node dependencies are required. Node.js 18 or newer is recommended because the script uses the built-in `fetch` API.
