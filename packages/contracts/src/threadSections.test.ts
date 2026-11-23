import * as Schema from "effect/Schema";
import { describe, expect, it } from "vite-plus/test";

import { ServerSettings, ServerSettingsPatch } from "./settings.ts";
import {
  normalizeThreadSections,
  THREAD_SECTIONS_MAX,
  threadSectionOf,
  threadSectionTagChanges,
} from "./threadSections.ts";

const decodeServerSettings = Schema.decodeUnknownSync(ServerSettings);
const decodeServerSettingsPatch = Schema.decodeUnknownSync(ServerSettingsPatch);

describe("threadSections", () => {
  it("keeps valid, distinct, trimmed names in order", () => {
    expect(
      normalizeThreadSections([" Deploy ", "Deploy", "", 3, "x".repeat(65), "Review", "a\nb"]),
    ).toEqual(["Deploy", "Review"]);
    expect(
      normalizeThreadSections(Array.from({ length: 40 }, (_, index) => `s${index}`)),
    ).toHaveLength(THREAD_SECTIONS_MAX);
  });

  it("files a thread in the first listed section it carries", () => {
    expect(threadSectionOf(["private", "Review", "Deploy"], ["Deploy", "Review"])).toBe("Deploy");
    expect(threadSectionOf(["private"], ["Deploy"])).toBeNull();
    expect(threadSectionOf(undefined, ["Deploy"])).toBeNull();
  });

  it("moves between sections without touching other tags", () => {
    expect(threadSectionTagChanges(["private", "Review"], ["Review", "Deploy"], "Deploy")).toEqual([
      { tag: "Review", tagged: false },
      { tag: "Deploy", tagged: true },
    ]);
    expect(threadSectionTagChanges(["Deploy"], ["Deploy"], "Deploy")).toEqual([]);
    expect(threadSectionTagChanges(["Review", "Deploy"], ["Review", "Deploy"], null)).toEqual([
      { tag: "Review", tagged: false },
      { tag: "Deploy", tagged: false },
    ]);
  });

  it("decodes a hand-edited section list without failing the settings", () => {
    const settings = decodeServerSettings({
      threadSections: ["Awaiting deployment", 1, " Review "],
      hideTaggedThreads: true,
    });
    expect(settings.threadSections).toEqual(["Awaiting deployment", "Review"]);
    expect(settings.hideTaggedThreads).toBe(true);
    expect(decodeServerSettings({}).threadSections).toEqual([]);
  });

  it("refuses a patch that writes an invalid section name", () => {
    expect(() => decodeServerSettingsPatch({ threadSections: [""] })).toThrow();
    expect(decodeServerSettingsPatch({ threadSections: ["Deploy"] })).toEqual({
      threadSections: ["Deploy"],
    });
  });
});
