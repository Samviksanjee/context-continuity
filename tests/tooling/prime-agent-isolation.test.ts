import { describe, it, expect } from "vitest";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import type { Dirent } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join, extname } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../..");

// The dev agent (Prime Agent) must never become part of the product runtime or
// build dependency graph, and the product trust contract must hold. This is the
// hard architectural boundary; a future agent session cannot quietly cross it.

const PRODUCT_DIRS = ["client", "server", "android-contextos"];
const AGENT_TOKENS = ["prime-agent", "pi-coding-agent"];
const CLOUD_AI_PACKAGES = [
  "openai",
  "@anthropic-ai/sdk",
  "@google/generative-ai",
  "@google-cloud/aiplatform",
  "cohere-ai",
  "replicate",
  "langchain",
  "@langchain/core",
  "@mistralai/mistralai",
  "groq-sdk",
  "@aws-sdk/client-bedrock-runtime",
];
const SCAN_EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".kt", ".kts", ".gradle", ".xml", ".json", ".css", ".html"]);
const SKIP_DIRS = new Set(["node_modules", "dist", "build", ".gradle", ".git", ".idea", "coverage"]);

function walk(dir: string, files: string[] = []): string[] {
  let entries: Dirent[];
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return files;
  }
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) walk(join(dir, entry.name), files);
    } else if (entry.isFile() && SCAN_EXTS.has(extname(entry.name))) {
      files.push(join(dir, entry.name));
    }
  }
  return files;
}

const productFiles = PRODUCT_DIRS.flatMap((relative) => walk(resolve(repoRoot, relative)));
const rootPkg = JSON.parse(readFileSync(resolve(repoRoot, "package.json"), "utf8")) as {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  workspaces?: string[] | { packages?: string[] };
};
const allDeps = { ...(rootPkg.dependencies ?? {}), ...(rootPkg.devDependencies ?? {}) };
const depNames = Object.keys(allDeps);

describe("Prime Agent isolation — product carries no dev-agent coupling", () => {
  it("no product source references the dev agent", () => {
    const offenders = productFiles.filter((file) => {
      const text = readFileSync(file, "utf8").toLowerCase();
      return AGENT_TOKENS.some((token) => text.includes(token));
    });
    expect(offenders).toEqual([]);
  });

  it("the product package.json has no dev-agent dependency", () => {
    expect(depNames.filter((name) => AGENT_TOKENS.some((token) => name.includes(token)))).toEqual([]);
  });

  it("declares no workspaces pulling in the dev agent", () => {
    const workspaces = rootPkg.workspaces;
    const list = Array.isArray(workspaces) ? workspaces : (workspaces?.packages ?? []);
    expect(list.some((entry) => entry.includes("prime-agent"))).toBe(false);
  });

  it("introduces no cloud-AI SDK into the product dependency graph", () => {
    expect(depNames.filter((name) => CLOUD_AI_PACKAGES.includes(name))).toEqual([]);
  });

  it("the lockfile does not resolve the dev-agent package", () => {
    const lockPath = resolve(repoRoot, "pnpm-lock.yaml");
    if (!existsSync(lockPath)) return;
    const lock = readFileSync(lockPath, "utf8");
    expect(lock).not.toContain("pi-coding-agent");
    expect(lock).not.toContain("@earendil-works/pi-coding-agent");
  });

  it("build/config entry points do not reference the dev agent", () => {
    const configFiles = ["vite.config.ts", "server/index.ts", "package.json"]
      .map((relative) => resolve(repoRoot, relative))
      .filter(existsSync);
    for (const file of configFiles) {
      const text = readFileSync(file, "utf8").toLowerCase();
      expect(AGENT_TOKENS.some((token) => text.includes(token))).toBe(false);
    }
  });

  it("preserves the Android no-INTERNET contract (any INTERNET line is a removal)", () => {
    const manifest = readFileSync(
      resolve(repoRoot, "android-contextos/app/src/main/AndroidManifest.xml"),
      "utf8",
    );
    const internetLines = manifest.split(/\r?\n/).filter((line) => line.includes("android.permission.INTERNET"));
    for (const line of internetLines) {
      expect(line).toContain('tools:node="remove"');
    }
  });
});
