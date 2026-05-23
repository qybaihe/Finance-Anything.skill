#!/usr/bin/env node

// 中文：这个脚本是 Finance Anything 决策 Skill 的最小外部入口。
// English: This script is the minimal external entry point for the Finance Anything Decision Skill.

function readFlag(args, name) {
  const index = args.indexOf(name);
  if (index === -1) return null;
  const value = args[index + 1];
  return value && !value.startsWith("--") ? value : "";
}

function hasFlag(args, name) {
  return args.includes(name);
}

function printHelp() {
  console.log(`Finance Anything Decision Skill

中文：把一个购买、投资、比较或选择目标提交给 Finance Anything 多智能体决策工作流。
English: Submit one purchase, investment, comparison, or choice goal to the Finance Anything multi-agent workflow.

Usage:
  node scripts/start-decision.mjs --goal "我是否应该购买这台二手 MacBook?"
  node scripts/start-decision.mjs --goal "Should I buy this stock?" --context "Budget: 50,000 CNY"
  echo "请帮我判断这辆二手车是否值得买" | node scripts/start-decision.mjs

Environment:
  FINANCE_ANYTHING_API_URL   Finance Anything API base URL
  FINANCE_ANYTHING_API_KEY   Finance Anything API key
  PAPERCLIP_API_URL          Compatible Paperclip API base URL
  PAPERCLIP_API_KEY          Compatible Paperclip API key
  PAPERCLIP_RUN_ID           Optional audit/run identifier
`);
}

async function readStdinIfAvailable() {
  if (process.stdin.isTTY) return "";
  let input = "";
  for await (const chunk of process.stdin) input += chunk;
  return input.trim();
}

function normalizeBaseUrl(value) {
  return value.replace(/\/+$/, "").replace(/\/api$/, "");
}

const args = process.argv.slice(2);

if (hasFlag(args, "--help") || hasFlag(args, "-h")) {
  printHelp();
  process.exit(0);
}

const goalFlag = readFlag(args, "--goal");
const context = readFlag(args, "--context") ?? "";
const positional = args.filter((arg, index) => {
  const previous = args[index - 1];
  return !arg.startsWith("--") && previous !== "--goal" && previous !== "--context";
});

const stdinGoal = await readStdinIfAvailable();
const flagOrPositionalGoal = goalFlag ?? positional.join(" ");
const goal = (flagOrPositionalGoal || stdinGoal).trim();

if (!goal) {
  console.error("Missing decision goal. Use --goal \"...\" or pipe text on stdin.");
  process.exit(2);
}

// 中文：优先使用 Finance Anything 变量；为了兼容 Paperclip runtime，也接受 PAPERCLIP_*。
// English: Prefer Finance Anything variables, while accepting PAPERCLIP_* for runtime compatibility.
const apiUrl = normalizeBaseUrl(
  process.env.FINANCE_ANYTHING_API_URL ||
  process.env.PAPERCLIP_API_URL ||
  "http://127.0.0.1:3300",
);
const apiKey = process.env.FINANCE_ANYTHING_API_KEY || process.env.PAPERCLIP_API_KEY || "";

if (!apiKey) {
  console.error("Missing PAPERCLIP_API_KEY or FINANCE_ANYTHING_API_KEY.");
  process.exit(2);
}

const headers = {
  "content-type": "application/json",
  authorization: apiKey.toLowerCase().startsWith("bearer ") ? apiKey : `Bearer ${apiKey}`,
};
if (process.env.PAPERCLIP_RUN_ID) {
  headers["x-paperclip-run-id"] = process.env.PAPERCLIP_RUN_ID;
}

// 中文：后端会创建决策议题，再由 Finance Anything 的专业 Agent 团队继续协同。
// English: The backend creates a decision issue, then Finance Anything specialist agents continue the work.
const response = await fetch(`${apiUrl}/api/finance/decisions`, {
  method: "POST",
  headers,
  body: JSON.stringify({ goal, context }),
});

const bodyText = await response.text();
let body;
try {
  body = bodyText ? JSON.parse(bodyText) : null;
} catch {
  body = bodyText;
}

if (!response.ok) {
  console.error(JSON.stringify({ status: response.status, body }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify(body, null, 2));
