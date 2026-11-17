import type { ReactNode } from "react";
import type { SearchSection } from "@/lib/searchRules";

// A different colour per section, so the origin of a result is clear at a glance
// (the section name is always written next to it as well, so colour is never the only clue).
export const TONE: Record<SearchSection, string> = {
  products: "bg-emerald-100 text-emerald-800",
  clients: "bg-sky-100 text-sky-800",
  diary: "bg-amber-100 text-amber-800",
  transport: "bg-violet-100 text-violet-800",
};

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Shows `text` with the searched words highlighted. */
export function Highlight({ text, words }: { text: string; words: string[] }): ReactNode {
  if (words.length === 0 || !text) return <>{text}</>;
  const re = new RegExp(`(${[...words].sort((a, b) => b.length - a.length).map(escapeRe).join("|")})`, "ig");
  return (
    <>
      {text.split(re).map((part, i) =>
        i % 2 === 1 ? (
          <mark key={i} className="rounded bg-accent/15 px-0.5 text-inherit">
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}

export const cn = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");
