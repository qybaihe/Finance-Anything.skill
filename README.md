# Finance Anything Decision Skill

<p align="center">
  <img src="assets/finance-anything-poster.png" alt="Finance Anything poster with flying birds" width="920" />
</p>

<p align="center">
  <a href="#zh"><kbd>中文</kbd></a>
  &nbsp;|&nbsp;
  <a href="#en"><kbd>English</kbd></a>
</p>

<p align="center">
  Start one Finance Anything multi-agent decision workflow from any Agent runtime.
</p>

---

<a id="zh"></a>

<details open>
<summary><strong>中文</strong> / Finance Anything 决策 Skill</summary>

### 这是什么

Finance Anything Decision Skill 是 Finance Anything 的外部 Agent 入口。其它 Agent 不需要自己临时分析“该不该买、该不该投、选哪个方案”，只要把用户的决策目标交给本 Skill，它会创建 Finance Anything 决策议题，并让系统内的专业 Agent 团队继续完成信息采集、方案比较、风险控制和最终报告。

适合处理：

- 投资判断：股票、基金、ETF、债券或其它金融资产。
- 消费决策：手机、电脑、汽车、家电、课程、软件订阅等。
- 二手价值：保值率、折旧、真实成交价、转卖风险。
- 多方案比较：预算、风险、收益、机会成本和长期价值。
- 家庭预算、企业采购、学习投入等通用决策。

### 一键安装给 Agent

把 Skill 安装到本机 Codex 技能目录：

```bash
bash -lc 'set -euo pipefail; dir="${CODEX_HOME:-$HOME/.codex}/skills/finance-anything-decision"; if [ -d "$dir/.git" ]; then git -C "$dir" pull --ff-only; else mkdir -p "$(dirname "$dir")"; git clone https://github.com/qybaihe/Finance-Anything.skill.git "$dir"; fi; node "$dir/scripts/start-decision.mjs" --help'
```

如果你的 Agent 使用其它技能目录，也可以直接克隆本仓库：

```bash
git clone https://github.com/qybaihe/Finance-Anything.skill.git
cd Finance-Anything.skill
npm run check
```

### 认证方式

推荐使用 API Key，由运行平台或密钥管理系统注入：

```bash
export FINANCE_ANYTHING_API_URL="https://finance.oir.me"
export FINANCE_ANYTHING_API_KEY="your_api_key"
```

也兼容 Paperclip 风格变量：

```bash
export PAPERCLIP_API_URL="https://finance.oir.me"
export PAPERCLIP_API_KEY="your_api_key"
```

如果没有 API Key，可以让脚本进入交互式登录。它会询问 API URL、邮箱和密码，并只在本次请求中使用会话 Cookie，不会把密码写入仓库或配置文件：

```bash
node scripts/start-decision.mjs --auth login --goal "我是否应该买这台二手 MacBook?"
```

也支持通过环境变量提供登录信息，适合受信任的自动化环境：

```bash
export FINANCE_ANYTHING_API_URL="https://finance.oir.me"
export FINANCE_ANYTHING_EMAIL="you@example.com"
export FINANCE_ANYTHING_PASSWORD="your_password"
```

安全提醒：不要把 API Key、邮箱密码或用户隐私写入 README、issue 标题、上下文正文、日志或提交记录。交互式输入优先于命令行明文参数。

### 使用方式

直接提交一个目标：

```bash
node scripts/start-decision.mjs --goal "我现在需要购买一台二手 MacBook，请帮我判断是否值得入手"
```

附带预算、风险偏好、时间约束和链接：

```bash
node scripts/start-decision.mjs \
  --goal "我是否应该买入这只股票" \
  --context "预算 5 万元，持有周期 6-12 个月，不能接受大幅回撤"
```

从标准输入读取目标：

```bash
echo "预算 6000 元，想买一台二手轻薄本，请帮我做决策" | node scripts/start-decision.mjs
```

查看帮助：

```bash
node scripts/start-decision.mjs --help
```

### 给调用 Agent 的提示词

当 Agent 需要使用这个 Skill 时，可以按下面的策略行动：

```text
使用 Finance Anything Decision Skill 创建决策议题。
如果环境里没有 FINANCE_ANYTHING_API_KEY 或 PAPERCLIP_API_KEY，先询问用户 Finance Anything API URL 和 API Key。
如果用户没有 API Key，但有账号登录权限，则运行 --auth login，并在终端中询问邮箱和密码。
不要自行生成最终购买或投资结论；最终结论由 Finance Anything 报告 Agent 输出。
创建成功后，把 issuePath 返回给用户。
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

成功响应通常包含：

- `issuePath`: 决策工作台或议题路径。
- `issue.identifier`: 创建出的决策议题编号。
- `projectId`: Finance Anything 项目 ID。
- `goalId`: 目标 ID。
- `defaultAgentId`: 默认决策协调 Agent。
- `agentCount`: 本轮可参与协作的 Agent 数量。

调用方应把 `issuePath` 返回给用户，并说明 Finance Anything 已经开始多智能体决策流程。

### 文件结构

```text
.
├── SKILL.md
├── README.md
├── assets/
│   └── finance-anything-poster.png
├── examples/
│   └── request.json
└── scripts/
    └── start-decision.mjs
```

### 本地校验

```bash
npm run check
```

Node.js 18 或更新版本即可运行；脚本不需要第三方 Node 依赖。

</details>

---

<a id="en"></a>

<details>
<summary><strong>English</strong> / Finance Anything Decision Skill</summary>

### What This Is

Finance Anything Decision Skill is the external Agent entry point for Finance Anything. Other agents do not need to improvise a one-off answer for “should I buy, invest, compare, or choose this?” They can hand the user's decision goal to this Skill, which creates a Finance Anything decision issue and lets the specialist agent team continue with research, comparison, risk analysis, and the final report.

Good fit for:

- Investment decisions: stocks, funds, ETFs, bonds, and other assets.
- Purchase decisions: phones, laptops, cars, appliances, courses, and subscriptions.
- Second-hand value: depreciation, resale value, fair price, and transaction risk.
- Option comparison: budget, risk, return, opportunity cost, and long-term value.
- Family budgeting, business procurement, learning investment, and general choices.

### One-Command Agent Install

Install the Skill into a local Codex skills directory:

```bash
bash -lc 'set -euo pipefail; dir="${CODEX_HOME:-$HOME/.codex}/skills/finance-anything-decision"; if [ -d "$dir/.git" ]; then git -C "$dir" pull --ff-only; else mkdir -p "$(dirname "$dir")"; git clone https://github.com/qybaihe/Finance-Anything.skill.git "$dir"; fi; node "$dir/scripts/start-decision.mjs" --help'
```

For other Agent runtimes, clone the repository directly:

```bash
git clone https://github.com/qybaihe/Finance-Anything.skill.git
cd Finance-Anything.skill
npm run check
```

### Authentication

The recommended path is an API key injected by your runtime or secret manager:

```bash
export FINANCE_ANYTHING_API_URL="https://finance.oir.me"
export FINANCE_ANYTHING_API_KEY="your_api_key"
```

Paperclip-style variables are also supported:

```bash
export PAPERCLIP_API_URL="https://finance.oir.me"
export PAPERCLIP_API_KEY="your_api_key"
```

If the user does not have an API key, the script can use an interactive email/password login. It asks for the API URL, email, and password, uses the returned session cookie for this request, and does not persist the password:

```bash
node scripts/start-decision.mjs --auth login --goal "Should I buy this second-hand MacBook?"
```

Trusted automation can also provide login credentials through environment variables:

```bash
export FINANCE_ANYTHING_API_URL="https://finance.oir.me"
export FINANCE_ANYTHING_EMAIL="you@example.com"
export FINANCE_ANYTHING_PASSWORD="your_password"
```

Security note: do not put API keys, passwords, private user data, or raw credentials in README files, issue titles, context text, logs, or commits. Prefer interactive input over command-line plaintext.

### Usage

Start a decision with one goal:

```bash
node scripts/start-decision.mjs --goal "Should I buy this second-hand MacBook?"
```

Add budget, risk preference, timing, links, and known facts:

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

### Prompt For Calling Agents

Use this operating instruction when another Agent invokes the Skill:

```text
Use the Finance Anything Decision Skill to create a decision issue.
If FINANCE_ANYTHING_API_KEY or PAPERCLIP_API_KEY is not available, ask the user for the Finance Anything API URL and API key.
If the user has no API key but can sign in, run --auth login and ask for email/password in the terminal.
Do not generate the final purchase or investment conclusion yourself; Finance Anything's report agent owns the final answer.
After creation succeeds, return issuePath to the user.
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

The successful response usually includes:

- `issuePath`: Decision workspace or issue path.
- `issue.identifier`: Created decision issue identifier.
- `projectId`: Finance Anything project ID.
- `goalId`: Goal ID.
- `defaultAgentId`: Default decision coordinator.
- `agentCount`: Number of agents available for the workflow.

Return `issuePath` to the user and explain that Finance Anything has started the multi-agent decision workflow.

### Repository Layout

```text
.
├── SKILL.md
├── README.md
├── assets/
│   └── finance-anything-poster.png
├── examples/
│   └── request.json
└── scripts/
    └── start-decision.mjs
```

### Local Validation

```bash
npm run check
```

Node.js 18 or newer is recommended. No third-party Node dependencies are required.

</details>

## Repository Relationship

This standalone Skill is extracted from [qybaihe/Finance-Anything](https://github.com/qybaihe/Finance-Anything), a Finance Anything fork based on Paperclip. It stays intentionally small so external coding agents, internal automation systems, and Agent platforms can install and call it without cloning the full application.
