import { unstable_cache } from "next/cache";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import {
  DEFAULT_SEARCH_STYLES,
  SearchDisplay,
  SearchStyles,
  defaultSearchDisplay,
  resolveSearchDisplay,
  resolveSearchStyles,
} from "@/lib/searchRules";

export const SEARCH_DISPLAY_TAG = "search-display";

// The saved row holds the per-section choices plus a `style` entry (where results appear).
const loadRaw = unstable_cache(
  async (): Promise<unknown> => {
    const row = await prisma.searchDisplayConfig.findUnique({ where: { id: "search" } });
    return row ? row.config : null;
  },
  ["search-display"],
  { tags: [SEARCH_DISPLAY_TAG], revalidate: 300 },
);

const raw = cache(async (): Promise<unknown> => {
  try {
    return await loadRaw();
  } catch {
    return null; // table not created yet (migration not applied) -> the standard layout
  }
});

export const getSearchDisplay = cache(async (): Promise<SearchDisplay> => {
  const r = await raw();
  return r ? resolveSearchDisplay(r) : defaultSearchDisplay();
});

export const getSearchStyles = cache(async (): Promise<SearchStyles> => {
  const r = await raw();
  return r ? resolveSearchStyles(r) : { ...DEFAULT_SEARCH_STYLES };
});
