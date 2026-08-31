import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../..");
const read = (relative: string) => readFileSync(resolve(repoRoot, relative), "utf8");

function frontmatter(relative: string): string {
  const match = read(relative).match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return match ? match[1] : "";
}

// Confirms the dev-agent integration is present and correctly shaped so Prime
// Agent actually consumes it (auto-loaded AGENTS.md + spec-valid skills), and
// that machine-local state stays out of the repo.
describe("Prime Agent integration is wired for consumption", () => {
  it("ships an auto-loaded AGENTS.md encoding the trust contract and stop-and-report rule", () => {
    const agents = read("AGENTS.md");
    expect(agents).toMatch(/local-first/i);
    expect(agents).toContain("INTERNET");
    expect(agents).toMatch(/evidence/i);
    expect(agents).toMatch(/stop and report the conflict/i);
    expect(agents).toMatch(/never add prime agent|never become part of the product/i);
  });

  it("ships tracked project settings", () => {
    expect(() => JSON.parse(read(".prime/agent/settings.json"))).not.toThrow();
  });

  it("ships spec-valid skills whose name matches the directory", () => {
    for (const skill of ["verify-changes", "accessibility-audit", "privacy-guardrail"]) {
      const fm = frontmatter(`.prime/agent/skills/${skill}/SKILL.md`);
      expect(fm).toMatch(new RegExp(`name:\\s*${skill}(?:\\s|$)`));
      expect(fm).toMatch(/description:\s*\S/);
    }
  });

  it("keeps the dev-agent checkout and local state gitignored while tracking config", () => {
    const gitignore = read(".gitignore");
    expect(gitignore).toContain("/prime-agent/");
    expect(gitignore).toContain(".prime/agent/auth.json");
    expect(gitignore).toContain(".prime/agent/sessions/");
    // skills + settings must NOT be ignored
    expect(gitignore).not.toMatch(/^\.prime\/agent\/skills\/?\s*$/m);
    expect(gitignore).not.toMatch(/^\.prime\/agent\/settings\.json\s*$/m);
  });

  it("documents Windows setup with credentials kept out of the repo", () => {
    expect(existsSync(resolve(repoRoot, "docs/PRIME_AGENT.md"))).toBe(true);
    const doc = read("docs/PRIME_AGENT.md");
    expect(doc).toMatch(/auth\.json/);
    expect(doc).toMatch(/not.*sandbox/i);
    expect(doc).toMatch(/removal/i);
  });
});
