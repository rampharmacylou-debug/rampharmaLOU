"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2, Search } from "lucide-react";
import DynamicIcon from "@/components/DynamicIcon";
import { Highlight, TONE, cn } from "@/components/search/searchUi";
import type { SearchSectionInfo } from "@/components/GlobalSearch";
import { SEARCH_MIN_CHARS, SearchGroup, SearchItem, SearchResponse, parseQuery } from "@/lib/searchRules";

type Props = {
  /** The sections this person can search, with the names and icons the admin chose. */
  sections: SearchSectionInfo[];
  /** Admins open a client's own page; staff go to the Clients list filtered to that client. */
  clientPages?: boolean;
  /** Show a search box on the page itself (phones, where the header box is a magnifier). */
  ownBox?: "phones" | "never";
};

const FIRST_LIMIT = 12;
const MORE_STEP = 24;

/**
 * Search results on the main screen: the same grouped results as the drop-down list (section name, coloured icon,
 * highlighted words, the details the admin chose), with room for more of them and every detail one tap away.
 * The words searched are in the address (?q=), so the page can be refreshed, bookmarked or shared.
 */
export default function SearchResults({ sections, clientPages = false, ownBox = "never" }: Props) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const q = (params.get("q") ?? "").trim();
  const words = useMemo(() => parseQuery(q), [q]);
  const searchable = q.length >= SEARCH_MIN_CHARS;

  const [data, setData] = useState<SearchResponse | null>(null);
  const [expanded, setExpanded] = useState<Record<string, SearchGroup>>({});
  const [loading, setLoading] = useState(false);
  const [more, setMore] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [box, setBox] = useState(q);
  const nonce = useRef(Date.now().toString(36));

  // keep the page's own box in step with the address
  useEffect(() => setBox(q), [q]);

  useEffect(() => {
    setExpanded({});
    if (!searchable) {
      setData(null);
      setLoading(false);
      setError("");
      return;
    }
    setLoading(true);
    const ctrl = new AbortController();
    fetch(`/api/search?q=${encodeURIComponent(q)}&limit=${FIRST_LIMIT}`, { signal: ctrl.signal, cache: "no-store" })
      .then((res) => {
        if (res.status === 401) {
          window.location.assign(window.location.pathname.startsWith("/staff") ? "/login?as=staff" : "/login?as=admin");
          return null;
        }
        if (!res.ok) throw new Error("search failed");
        return res.json() as Promise<SearchResponse>;
      })
      .then((json) => {
        if (json) {
          setData(json);
          setError("");
          nonce.current = Date.now().toString(36);
        }
      })
      .catch(() => {
        if (!ctrl.signal.aborted) setError("Search isn't working right now. Check your connection and try again.");
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });
    return () => ctrl.abort();
  }, [q, searchable]);

  async function showMore(group: SearchGroup, shown: number) {
    setMore(group.key);
    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(q)}&section=${group.key}&limit=${Math.min(100, shown + MORE_STEP)}`,
        { cache: "no-store" },
      );
      if (!res.ok) throw new Error();
      const json: SearchResponse = await res.json();
      const g = json.sections.find((s) => s.key === group.key);
      if (g) setExpanded((e) => ({ ...e, [group.key]: g }));
    } catch {
      setError("Couldn't load more results. Try again.");
    } finally {
      setMore(null);
    }
  }

  const groups = useMemo(
    () =>
      (data?.sections ?? [])
        .map((g) => ({ group: expanded[g.key] ?? g, info: sections.find((s) => s.key === g.key) }))
        .filter((x): x is { group: SearchGroup; info: SearchSectionInfo } => Boolean(x.info)),
    [data, expanded, sections],
  );
  const total = groups.reduce((n, g) => n + g.group.total, 0);
  const names = sections.map((s) => s.label).join(", ");

  const hrefFor = (info: SearchSectionInfo, item: SearchItem) =>
    clientPages && info.key === "clients"
      ? `/clients/${item.id}`
      : `${info.href}?q=${encodeURIComponent(item.title)}&s=${nonce.current}`;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Search</h1>
        <p className="mt-1 text-sm text-muted" aria-live="polite">
          {!searchable
            ? `Type at least ${SEARCH_MIN_CHARS} letters to search ${names} at once.`
            : loading && !data
              ? "Searching…"
              : error && !data
                ? ""
                : `${total} result${total === 1 ? "" : "s"} for “${q}”`}
        </p>
      </div>

      {ownBox !== "never" && (
        <form
          role="search"
          className="relative sm:hidden"
          onSubmit={(e) => {
            e.preventDefault();
            router.replace(`${pathname}?q=${encodeURIComponent(box.trim())}`);
          }}
        >
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            inputMode="search"
            enterKeyHint="search"
            value={box}
            autoFocus={!q}
            autoComplete="off"
            onChange={(e) => {
              setBox(e.target.value);
              router.replace(`${pathname}?q=${encodeURIComponent(e.target.value.trim())}`);
            }}
            placeholder={`Search ${names}…`}
            aria-label={`Search ${names}`}
            className="h-11 w-full rounded-md border border-hairline bg-white pl-9 pr-9 text-sm text-text outline-none focus:border-accent focus:ring-1 focus:ring-accent/40"
          />
          {loading && <Loader2 size={15} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-muted" aria-hidden="true" />}
        </form>
      )}

      {error && <p role="alert" className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}

      {searchable && data && groups.length === 0 && !loading && (
        <p className="rounded-lg border border-dashed border-hairline bg-surface/60 px-4 py-12 text-center text-sm text-muted">
          No matches for “<b className="font-medium text-ink">{q}</b>” in {names}.
        </p>
      )}

      {groups.length > 1 && (
        <nav aria-label="Jump to a section" className="flex flex-wrap gap-2">
          {groups.map(({ group, info }) => (
            <a key={info.key} href={`#res-${info.key}`} className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium", TONE[info.key])}>
              <DynamicIcon name={info.icon} size={13} />
              {info.label} · {group.total}
            </a>
          ))}
        </nav>
      )}

      <div className={cn("space-y-6 transition-opacity", loading && data ? "opacity-60" : undefined)}>
        {groups.map(({ group, info }) => (
          <section key={info.key} id={`res-${info.key}`} aria-labelledby={`res-h-${info.key}`} className="space-y-2 scroll-mt-20">
            <h2 id={`res-h-${info.key}`} className="flex items-center gap-2 text-sm font-semibold text-ink">
              <span className={cn("flex size-7 items-center justify-center rounded-md", TONE[info.key])}>
                <DynamicIcon name={info.icon} size={14} />
              </span>
              {info.label}
              <span className="font-normal text-muted">
                {group.total > group.items.length ? `${group.items.length} of ${group.total}` : group.total}
              </span>
            </h2>

            <ul className="grid gap-2 md:grid-cols-2">
              {group.items.map((item) => (
                <li key={item.id} className="rounded-lg border border-hairline bg-surface">
                  <Link href={hrefFor(info, item)} className="flex items-center gap-3 rounded-lg px-4 py-3 hover:bg-canvas">
                    <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-md", TONE[info.key])}>
                      <DynamicIcon name={info.icon} size={18} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink">
                        <Highlight text={item.title} words={words} />
                      </span>
                      {item.meta.length > 0 && (
                        <span className="block truncate text-xs text-muted">
                          <Highlight text={item.meta.join(" · ")} words={words} />
                        </span>
                      )}
                    </span>
                    <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium", TONE[info.key])}>{info.label}</span>
                  </Link>
                  {item.more && item.more.length > 0 && (
                    <details className="border-t border-hairline px-4 py-2 text-xs">
                      <summary className="cursor-pointer select-none py-1 font-medium text-accent">More details</summary>
                      <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 pb-1">
                        {item.more.map((m, i) => (
                          <div key={`${m.label}-${i}`} className="contents">
                            <dt className="text-muted">{m.label}</dt>
                            <dd className="break-words text-ink">{m.value}</dd>
                          </div>
                        ))}
                      </dl>
                    </details>
                  )}
                </li>
              ))}
            </ul>

            {group.total > group.items.length && (
              <button
                type="button"
                disabled={more === group.key}
                onClick={() => showMore(group, group.items.length)}
                className="inline-flex min-h-11 items-center gap-2 rounded-md border border-hairline px-4 text-sm font-medium text-accent hover:bg-canvas disabled:opacity-60"
              >
                {more === group.key && <Loader2 size={14} className="animate-spin" />}
                Show more {info.label.toLowerCase()} ({group.total - group.items.length} left)
              </button>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
