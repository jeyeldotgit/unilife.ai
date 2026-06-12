import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function walkFiles(root: string): string[] {
  return readdirSync(root).flatMap((entry) => {
    const fullPath = join(root, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      return walkFiles(fullPath);
    }

    return fullPath.endsWith(".tsx") ? [fullPath] : [];
  });
}

describe("authenticated identity regression", () => {
  it("removes hardcoded Alex greetings from authenticated routes", () => {
    const root = join(process.cwd(), "src", "app", "(app)");
    const files = walkFiles(root);

    for (const file of files) {
      const contents = readFileSync(file, "utf8");

      expect(contents).not.toContain("Hi, Alex");
      expect(contents).not.toContain("Good morning");
    }
  });
});
