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

    return fullPath.endsWith(".ts") && !fullPath.endsWith(".test.ts")
      ? [fullPath]
      : [];
  });
}

describe("api layer regression", () => {
  it("does not import frontend mocks into app-facing api files", () => {
    const root = join(process.cwd(), "src", "lib", "api");
    const files = walkFiles(root);

    for (const file of files) {
      const contents = readFileSync(file, "utf8");

      expect(contents).not.toMatch(/@\/lib\/mock\//);
      expect(contents).not.toMatch(/src\/lib\/mock\//);
    }
  });
});
