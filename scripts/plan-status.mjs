#!/usr/bin/env node
// Parses IMPLEMENTATION_PLAN.md and prints step progress plus the next open item.
// Usage: node scripts/plan-status.mjs [--json] [--plan <path>] [--strict]

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const json = args.includes("--json");
const strict = args.includes("--strict");
const planFlag = args.indexOf("--plan");
const planPath =
  planFlag !== -1 && args[planFlag + 1]
    ? args[planFlag + 1]
    : join(root, "IMPLEMENTATION_PLAN.md");

const text = readFileSync(planPath, "utf8");
const lines = text.split(/\r?\n/);

const steps = [];
let current = null;

const stepStart = /^### Step (\d+): (.+)$/;
const itemLine = /^(\s*)- \[( |x|X)\] \*\*(\d+(?:\.\d+)?)\*\*\s*(.*)$/;

for (const line of lines) {
  const stepMatch = line.match(stepStart);
  if (stepMatch) {
    current = {
      number: Number(stepMatch[1]),
      title: stepMatch[2].replace(/\*+\s*$/, "").trim(),
      done: 0,
      total: 0,
      items: [],
    };
    steps.push(current);
    continue;
  }
  if (/^## /.test(line)) current = null;
  if (!current) continue;

  if (/^\*\*Status:\*\*/.test(line)) {
    current.status = line.split("**Status:**")[1].trim();
    continue;
  }

  const itemMatch = line.match(itemLine);
  if (itemMatch) {
    const [, , mark, id, rest] = itemMatch;
    const checked = mark.toLowerCase() === "x";
    const label = rest.replace(/\s*—.*$/, "").replace(/`/g, "").trim();
    current.total += 1;
    if (checked) current.done += 1;
    current.items.push({ id, checked, label: label || "untitled item" });
    continue;
  }

  const verifyMatch = line.match(/^\s*- Verify:\s*(.*)$/);
  if (verifyMatch && current.items.length) {
    const last = current.items[current.items.length - 1];
    if (!last.verify) last.verify = verifyMatch[1].trim();
  }
}

const total = steps.reduce((sum, s) => sum + s.total, 0);
const done = steps.reduce((sum, s) => sum + s.done, 0);
const percent = total === 0 ? 0 : Math.round((done / total) * 100);

const openStep = steps.find((s) => s.done < s.total);
const openItem = openStep?.items.find((i) => !i.checked) ?? null;

if (json) {
  process.stdout.write(
    `${JSON.stringify(
      {
        plan: planPath,
        total,
        done,
        percent,
        currentStep: openStep?.number ?? null,
        nextItem: openItem ? `${openStep.number} → ${openItem.label}` : null,
        steps: steps.map((s) => ({
          number: s.number,
          title: s.title,
          status: s.status ?? (s.done === s.total ? "done" : "planned"),
          done: s.done,
          total: s.total,
          percent: s.total === 0 ? 0 : Math.round((s.done / s.total) * 100),
          open: s.items.filter((i) => !i.checked).map((i) => i.id),
        })),
      },
      null,
      2,
    )}\n`,
  );
} else {
  process.stdout.write(`\nDoctor Tracker — implementation progress\n${"=".repeat(46)}\n`);
  for (const s of steps) {
    const pct = s.total === 0 ? 0 : Math.round((s.done / s.total) * 100);
    const bar = "█".repeat(Math.round(pct / 5)).padEnd(20, "░");
    const mark = s.done === s.total ? "✅" : openStep === s ? "▶" : "  ";
    process.stdout.write(
      `${mark} Step ${s.number} ${bar} ${String(pct).padStart(3)}% (${s.done}/${s.total})  ${s.title}\n`,
    );
  }
  process.stdout.write(
    `${"-".repeat(46)}\nOverall: ${done}/${total} items (${percent}%)  |  plan: ${planPath}\n`,
  );
  if (openStep && openItem) {
    process.stdout.write(
      `Next open item: Step ${openStep.number}.${openItem.id.split(".")[1] ?? ""} → ${openItem.label}\n`,
    );
    if (openItem.verify) {
      process.stdout.write(`  Verify: ${openItem.verify}\n`);
    }
  } else {
    process.stdout.write("Nothing left open in the plan.\n");
  }
  process.stdout.write("\n");
}

if (strict && done !== total) process.exitCode = 1;
