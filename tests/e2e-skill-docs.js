#!/usr/bin/env node
/**
 * E2E test for SKILL.md documentation integrity after PR #1 selective merge.
 *
 * Tests:
 *   1. Frontmatter parsing compatibility with hub parseFrontmatter
 *   2. All documented script paths exist
 *   3. feishu-common module exports correct functions
 *   4. CLI scripts load without crash (--help or require)
 *   5. Documented CLI flags match actual script implementations
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
let passed = 0;
let failed = 0;
const failures = [];

function ok(desc) {
  passed++;
  console.log(`  [PASS] ${desc}`);
}
function fail(desc, detail) {
  failed++;
  failures.push({ desc, detail });
  console.log(`  [FAIL] ${desc}  --  ${detail}`);
}

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return { name: null, description: null, body: content };
  const raw = match[1];
  const body = content.slice(match[0].length).trim();
  const name = raw.match(/^name:\s*(.+)$/m)?.[1]?.trim() || null;
  const description =
    raw.match(/^description:\s*(.+)$/m)?.[1]?.trim() || null;
  return { name, description, body };
}

// -----------------------------------------------------------------------
// Test 1: Frontmatter parsing
// -----------------------------------------------------------------------
console.log("\n== Test 1: Frontmatter parsing (hub-compatible) ==\n");

const SKILLS = [
  "feishu-common",
  "feishu-message",
  "feishu-card",
  "feishu-calendar",
  "feishu-batch-sender",
];

for (const skill of SKILLS) {
  const content = fs.readFileSync(
    path.join(ROOT, skill, "SKILL.md"),
    "utf8"
  );
  const fm = parseFrontmatter(content);

  if (!fm.name) {
    fail(`${skill}: frontmatter name`, "missing");
  } else if (fm.name.startsWith('"') || fm.name.endsWith('"')) {
    fail(`${skill}: frontmatter name has quotes`, `got "${fm.name}"`);
  } else if (fm.name.length < 2 || fm.name.length > 64) {
    fail(
      `${skill}: frontmatter name length`,
      `${fm.name.length} chars (need 2-64)`
    );
  } else {
    ok(`${skill}: name = "${fm.name}"`);
  }

  if (!fm.description) {
    fail(`${skill}: frontmatter description`, "missing");
  } else if (
    fm.description.startsWith('"') ||
    fm.description.endsWith('"')
  ) {
    fail(
      `${skill}: frontmatter description has quotes`,
      `starts/ends with literal " -- hub regex will include them`
    );
  } else if (fm.description.length < 10 || fm.description.length > 1024) {
    fail(
      `${skill}: frontmatter description length`,
      `${fm.description.length} chars (need 10-1024)`
    );
  } else {
    ok(`${skill}: description (${fm.description.length} chars)`);
  }

  if (!fm.body || fm.body.length < 20) {
    fail(`${skill}: body after frontmatter`, "too short or missing");
  } else {
    ok(`${skill}: body present (${fm.body.length} chars)`);
  }
}

// -----------------------------------------------------------------------
// Test 2: All documented script paths exist
// -----------------------------------------------------------------------
console.log("\n== Test 2: Documented script paths exist ==\n");

const DOCUMENTED_PATHS = {
  "feishu-common": ["index.js", "feishu-client.js"],
  "feishu-message": [
    "index.js",
    "reaction.js",
    "get.js",
    "send-audio.js",
    "create_chat.js",
    "list_pins_v2.js",
  ],
  "feishu-card": ["send.js", "send_safe.js", "send_persona.js"],
  "feishu-calendar": [
    "list_test.js",
    "search_cal.js",
    "check_master.js",
    "sync_routine.js",
    "create.js",
    "setup_shared.js",
  ],
  "feishu-batch-sender": ["index.js"],
};

for (const [skill, files] of Object.entries(DOCUMENTED_PATHS)) {
  for (const file of files) {
    const full = path.join(ROOT, skill, file);
    if (fs.existsSync(full)) {
      ok(`${skill}/${file} exists`);
    } else {
      fail(`${skill}/${file}`, "file not found");
    }
  }
}

// -----------------------------------------------------------------------
// Test 3: feishu-common exports correct functions
// -----------------------------------------------------------------------
console.log("\n== Test 3: feishu-common module exports ==\n");

try {
  const mod = require(path.join(ROOT, "feishu-common/index.js"));
  const expected = [
    "getToken",
    "fetchWithRetry",
    "fetchWithAuth",
    "sendText",
    "sendPost",
    "sendCard",
  ];
  for (const fn of expected) {
    if (typeof mod[fn] === "function") {
      ok(`feishu-common exports ${fn}()`);
    } else {
      fail(`feishu-common exports ${fn}`, `typeof = ${typeof mod[fn]}`);
    }
  }

  const alias = require(path.join(ROOT, "feishu-common/feishu-client.js"));
  if (alias.getToken === mod.getToken && alias.fetchWithAuth === mod.fetchWithAuth) {
    ok("feishu-client.js re-exports same references as index.js");
  } else {
    fail("feishu-client.js alias", "exports differ from index.js");
  }
} catch (e) {
  fail("feishu-common require", e.message);
}

// -----------------------------------------------------------------------
// Test 4: CLI scripts load without crash (--help)
// -----------------------------------------------------------------------
console.log("\n== Test 4: CLI scripts --help / load test ==\n");

const CLI_SCRIPTS = [
  { skill: "feishu-card", file: "send.js", hasHelp: true },
  { skill: "feishu-card", file: "send_safe.js", hasHelp: true },
  { skill: "feishu-card", file: "send_persona.js", hasHelp: true },
  { skill: "feishu-message", file: "index.js", hasHelp: true },
  { skill: "feishu-batch-sender", file: "index.js", hasHelp: true },
];

for (const { skill, file, hasHelp } of CLI_SCRIPTS) {
  const scriptPath = path.join(ROOT, skill, file);
  try {
    const result = execSync(`node "${scriptPath}" --help 2>&1`, {
      timeout: 10000,
      encoding: "utf8",
    });
    if (result.length > 0) {
      ok(`${skill}/${file} --help runs (${result.trim().split("\n").length} lines)`);
    } else {
      fail(`${skill}/${file} --help`, "empty output");
    }
  } catch (e) {
    if (e.status === 0 || (e.stdout && e.stdout.length > 10)) {
      ok(`${skill}/${file} --help runs (exit ${e.status})`);
    } else {
      fail(`${skill}/${file} --help`, e.message.slice(0, 120));
    }
  }
}

// -----------------------------------------------------------------------
// Test 5: Documented CLI flags match actual script
// -----------------------------------------------------------------------
console.log("\n== Test 5: CLI flags match documentation ==\n");

function getHelpOutput(scriptPath) {
  try {
    return execSync(`node "${scriptPath}" --help 2>&1`, {
      timeout: 10000,
      encoding: "utf8",
    });
  } catch (e) {
    return e.stdout || e.stderr || "";
  }
}

const FLAG_CHECKS = [
  {
    skill: "feishu-card",
    file: "send.js",
    expectedFlags: ["-t", "--target", "-x", "--text", "-f", "--text-file", "--title", "--color", "--button-text", "--button-url", "--image-path"],
  },
  {
    skill: "feishu-batch-sender",
    file: "index.js",
    expectedFlags: ["-t", "--target", "-m", "--messages", "--delay"],
  },
  {
    skill: "feishu-message",
    file: "index.js",
    expectedFlags: ["get", "send-audio", "create-chat", "list-pins"],
  },
];

for (const { skill, file, expectedFlags } of FLAG_CHECKS) {
  const help = getHelpOutput(path.join(ROOT, skill, file));
  for (const flag of expectedFlags) {
    if (help.includes(flag)) {
      ok(`${skill}/${file} help contains "${flag}"`);
    } else {
      fail(`${skill}/${file} help missing "${flag}"`, `not found in --help output`);
    }
  }
}

// -----------------------------------------------------------------------
// Test 6: feishu-message Dependencies section preserved
// -----------------------------------------------------------------------
console.log("\n== Test 6: Content integrity checks ==\n");

const msgSkill = fs.readFileSync(
  path.join(ROOT, "feishu-message/SKILL.md"),
  "utf8"
);
const msgPkg = JSON.parse(
  fs.readFileSync(path.join(ROOT, "feishu-message/package.json"), "utf8")
);

if (msgSkill.includes("## Dependencies")) {
  ok("feishu-message SKILL.md has Dependencies section");
} else {
  fail("feishu-message SKILL.md", "missing Dependencies section");
}

for (const dep of ["axios", "form-data", "music-metadata", "commander"]) {
  if (msgSkill.includes(dep)) {
    ok(`feishu-message SKILL.md lists dependency: ${dep}`);
  } else {
    fail(`feishu-message SKILL.md`, `missing dependency: ${dep}`);
  }
  if (msgPkg.dependencies && msgPkg.dependencies[dep]) {
    ok(`feishu-message package.json has ${dep}: ${msgPkg.dependencies[dep]}`);
  } else {
    fail(`feishu-message package.json`, `missing dependency: ${dep}`);
  }
}

const calSkill = fs.readFileSync(
  path.join(ROOT, "feishu-calendar/SKILL.md"),
  "utf8"
);
if (calSkill.includes("Master")) {
  ok('feishu-calendar SKILL.md preserves "Master\'s Calendar" context');
} else {
  fail("feishu-calendar SKILL.md", '"Master" context was lost');
}

if (calSkill.includes("Task Marking Protocol")) {
  ok("feishu-calendar SKILL.md has Task Marking Protocol section");
} else {
  fail("feishu-calendar SKILL.md", "missing Task Marking Protocol");
}

const cardSkill = fs.readFileSync(
  path.join(ROOT, "feishu-card/SKILL.md"),
  "utf8"
);
if (cardSkill.includes("temp/msg.md")) {
  ok("feishu-card SKILL.md preserves step-by-step markdown workflow");
} else {
  fail("feishu-card SKILL.md", "missing step-by-step markdown workflow");
}
if (cardSkill.includes("Snarky") || cardSkill.includes("snarky")) {
  ok("feishu-card SKILL.md preserves persona descriptions");
} else {
  fail("feishu-card SKILL.md", 'persona descriptions missing (e.g. "Snarky suffix")');
}
if (cardSkill.includes("Missing Text")) {
  ok("feishu-card SKILL.md preserves Troubleshooting detail");
} else {
  fail("feishu-card SKILL.md", "Troubleshooting section missing detail");
}

// -----------------------------------------------------------------------
// Summary
// -----------------------------------------------------------------------
console.log("\n" + "=".repeat(60));
console.log(`  TOTAL: ${passed + failed}  |  PASSED: ${passed}  |  FAILED: ${failed}`);
console.log("=".repeat(60));

if (failures.length > 0) {
  console.log("\nFailure details:");
  for (const f of failures) {
    console.log(`  - ${f.desc}: ${f.detail}`);
  }
}

process.exit(failed > 0 ? 1 : 0);
