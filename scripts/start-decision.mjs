#!/usr/bin/env node

import { createInterface } from "node:readline/promises";

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
  node scripts/start-decision.mjs --auth login --goal "请帮我判断这台车是否值得买"
  echo "请帮我判断这辆二手车是否值得买" | node scripts/start-decision.mjs

Options:
  --goal TEXT          Decision goal
  --context TEXT       Budget, constraints, links, risk preference, known facts
  --api-url URL        Finance Anything or Paperclip API base URL
  --api-key KEY        API key for non-interactive runs
  --auth key|login     Use API key auth or email/password login prompt

Environment:
  FINANCE_ANYTHING_API_URL   Finance Anything API base URL
  FINANCE_ANYTHING_API_KEY   Finance Anything API key
  FINANCE_ANYTHING_EMAIL     Optional sign-in email when no API key is available
  FINANCE_ANYTHING_PASSWORD  Optional sign-in password when no API key is available
  PAPERCLIP_API_URL          Compatible Paperclip API base URL
  PAPERCLIP_API_KEY          Compatible Paperclip API key
  PAPERCLIP_EMAIL            Compatible sign-in email
  PAPERCLIP_PASSWORD         Compatible sign-in password
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

function originFromApiUrl(apiUrl) {
  try {
    return new URL(apiUrl).origin;
  } catch {
    return apiUrl;
  }
}

function canPrompt() {
  return Boolean(process.stdin.isTTY && process.stdout.isTTY);
}

async function promptLine(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    return await rl.question(question);
  } finally {
    rl.close();
  }
}

async function promptSecret(question) {
  if (!canPrompt() || typeof process.stdin.setRawMode !== "function") {
    return promptLine(question);
  }

  return new Promise((resolve) => {
    let value = "";
    const input = process.stdin;

    function cleanup() {
      input.off("data", onData);
      input.setRawMode(false);
      input.pause();
    }

    function onData(chunk) {
      const text = chunk.toString("utf8");
      for (const char of text) {
        if (char === "\u0003") {
          cleanup();
          process.stdout.write("\n");
          process.exit(130);
        }
        if (char === "\r" || char === "\n") {
          cleanup();
          process.stdout.write("\n");
          resolve(value);
          return;
        }
        if (char === "\u007f" || char === "\b") {
          value = value.slice(0, -1);
          continue;
        }
        value += char;
      }
    }

    process.stdout.write(question);
    input.setRawMode(true);
    input.resume();
    input.on("data", onData);
  });
}

async function readResponseBody(response) {
  const bodyText = await response.text();
  if (!bodyText) return null;
  try {
    return JSON.parse(bodyText);
  } catch {
    return bodyText;
  }
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithNetworkRetry(url, options, attempts = 3) {
  let lastError = null;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fetch(url, options);
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await wait(700 * attempt);
    }
  }
  throw lastError;
}

function getSetCookieValues(headers) {
  if (typeof headers.getSetCookie === "function") {
    return headers.getSetCookie();
  }
  const single = headers.get("set-cookie");
  return single ? [single] : [];
}

async function signInWithEmailPassword(apiUrl, email, password) {
  const origin = originFromApiUrl(apiUrl);
  const response = await fetchWithNetworkRetry(`${apiUrl}/api/auth/sign-in/email`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin,
      referer: `${origin}/finance`,
    },
    body: JSON.stringify({ email, password }),
  });
  const body = await readResponseBody(response);
  if (!response.ok) {
    throw new Error(JSON.stringify({ status: response.status, body }, null, 2));
  }

  const cookieHeader = getSetCookieValues(response.headers)
    .map((cookie) => cookie.split(";")[0])
    .filter(Boolean)
    .join("; ");
  if (!cookieHeader) {
    throw new Error("Sign-in succeeded but the server did not return a session cookie.");
  }
  return cookieHeader;
}

const args = process.argv.slice(2);

if (hasFlag(args, "--help") || hasFlag(args, "-h")) {
  printHelp();
  process.exit(0);
}

const goalFlag = readFlag(args, "--goal");
const context = readFlag(args, "--context") ?? "";
const apiUrlFlag = readFlag(args, "--api-url");
const apiKeyFlag = readFlag(args, "--api-key");
const authModeFlag = readFlag(args, "--auth");
const positional = args.filter((arg, index) => {
  const previous = args[index - 1];
  return !arg.startsWith("--")
    && previous !== "--goal"
    && previous !== "--context"
    && previous !== "--api-url"
    && previous !== "--api-key"
    && previous !== "--auth";
});

const stdinGoal = await readStdinIfAvailable();
const flagOrPositionalGoal = goalFlag ?? positional.join(" ");
let goal = (flagOrPositionalGoal || stdinGoal).trim();

if (!goal && canPrompt()) {
  goal = (await promptLine("Decision goal: ")).trim();
}

if (!goal) {
  console.error("Missing decision goal. Use --goal \"...\" or pipe text on stdin.");
  process.exit(2);
}

// 中文：优先使用 Finance Anything 变量；为了兼容 Paperclip runtime，也接受 PAPERCLIP_*。
// English: Prefer Finance Anything variables, while accepting PAPERCLIP_* for runtime compatibility.
let rawApiUrl = apiUrlFlag
  || process.env.FINANCE_ANYTHING_API_URL
  || process.env.PAPERCLIP_API_URL
  || "http://127.0.0.1:3300";

let apiKey = apiKeyFlag || process.env.FINANCE_ANYTHING_API_KEY || process.env.PAPERCLIP_API_KEY || "";
let email = process.env.FINANCE_ANYTHING_EMAIL || process.env.PAPERCLIP_EMAIL || "";
let password = process.env.FINANCE_ANYTHING_PASSWORD || process.env.PAPERCLIP_PASSWORD || "";
let cookieHeader = "";

if (!apiKey && canPrompt() && !apiUrlFlag && !process.env.FINANCE_ANYTHING_API_URL && !process.env.PAPERCLIP_API_URL) {
  const answer = await promptLine(`Finance Anything API URL [${rawApiUrl}]: `);
  rawApiUrl = answer.trim() || rawApiUrl;
}

const apiUrl = normalizeBaseUrl(rawApiUrl);
let authMode = (authModeFlag || "").trim().toLowerCase();

if (!apiKey && !email && !password && canPrompt()) {
  const answer = await promptLine("Authentication method: API key or email/password login? [key/login] (key): ");
  authMode = answer.trim().toLowerCase() || "key";
}

if (!apiKey && (authMode === "login" || email || password)) {
  if (!email && canPrompt()) email = (await promptLine("Finance Anything email: ")).trim();
  if (!password && canPrompt()) password = await promptSecret("Finance Anything password: ");
  if (!email || !password) {
    console.error("Missing Finance Anything email/password for login auth.");
    process.exit(2);
  }
  try {
    cookieHeader = await signInWithEmailPassword(apiUrl, email, password);
  } catch (error) {
    console.error("Finance Anything sign-in failed.");
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

if (!apiKey && !cookieHeader && canPrompt()) {
  apiKey = await promptSecret("Finance Anything API key: ");
}

if (!apiKey && !cookieHeader) {
  console.error("Missing credentials. Set FINANCE_ANYTHING_API_KEY/PAPERCLIP_API_KEY, or run with --auth login.");
  process.exit(2);
}

const headers = {
  "content-type": "application/json",
};
const requestOrigin = originFromApiUrl(apiUrl);
headers.origin = requestOrigin;
headers.referer = `${requestOrigin}/finance`;
if (apiKey) {
  headers.authorization = apiKey.toLowerCase().startsWith("bearer ") ? apiKey : `Bearer ${apiKey}`;
}
if (cookieHeader) {
  headers.cookie = cookieHeader;
}
if (process.env.PAPERCLIP_RUN_ID) {
  headers["x-paperclip-run-id"] = process.env.PAPERCLIP_RUN_ID;
}

// 中文：后端会创建决策议题，再由 Finance Anything 的专业 Agent 团队继续协同。
// English: The backend creates a decision issue, then Finance Anything specialist agents continue the work.
let response;
try {
  response = await fetch(`${apiUrl}/api/finance/decisions`, {
    method: "POST",
    headers,
    body: JSON.stringify({ goal, context }),
  });
} catch (error) {
  console.error("Finance Anything decision request failed.");
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

const body = await readResponseBody(response);

if (!response.ok) {
  console.error(JSON.stringify({ status: response.status, body }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify(body, null, 2));
