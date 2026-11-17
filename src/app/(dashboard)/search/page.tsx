"use client";

import SearchResults from "@/components/search/SearchResults";
import { useAppearance } from "@/lib/appearanceContext";
import { SEARCH_SECTIONS } from "@/lib/searchRules";

// Admin search results on the main screen (used when Settings > Search results is set to "On the main screen").
export default function AdminSearchPage() {
  const { nav } = useAppearance();
  const sections = SEARCH_SECTIONS.map((key) => ({ key, label: nav[key].label, icon: nav[key].icon, href: `/${key}` }));
  return <SearchResults sections={sections} clientPages ownBox="phones" />;
}
