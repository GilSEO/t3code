import * as Schema from "effect/Schema";

import { ThreadTag } from "./threadTags.ts";

/**
 * A sidebar section is a thread tag the user listed in `threadSections`. A thread sits in the
 * first listed section among its tags; tags outside the list keep their other meanings.
 */
export const ThreadSectionName = ThreadTag;
export type ThreadSectionName = typeof ThreadSectionName.Type;

export const THREAD_SECTIONS_MAX = 24;

const isThreadSectionName = Schema.is(ThreadSectionName);

/** Hand-edited or older lists keep their valid, distinct names in order. */
export function normalizeThreadSections(values: ReadonlyArray<unknown>): ReadonlyArray<string> {
  const sections: string[] = [];
  for (const value of values) {
    if (typeof value !== "string") continue;
    const name = value.trim();
    if (!isThreadSectionName(name) || sections.includes(name)) continue;
    sections.push(name);
    if (sections.length === THREAD_SECTIONS_MAX) break;
  }
  return sections;
}

export function threadSectionOf(
  tags: ReadonlyArray<string> | undefined,
  sections: ReadonlyArray<string>,
): string | null {
  if (tags === undefined || tags.length === 0) return null;
  return sections.find((section) => tags.includes(section)) ?? null;
}

/** The tag writes that leave a thread in `target` only, or in no section when null. */
export function threadSectionTagChanges(
  tags: ReadonlyArray<string> | undefined,
  sections: ReadonlyArray<string>,
  target: string | null,
): ReadonlyArray<{ readonly tag: string; readonly tagged: boolean }> {
  const current = tags ?? [];
  const changes = sections
    .filter((section) => section !== target && current.includes(section))
    .map((tag) => ({ tag, tagged: false }));
  if (target !== null && !current.includes(target)) changes.push({ tag: target, tagged: true });
  return changes;
}
