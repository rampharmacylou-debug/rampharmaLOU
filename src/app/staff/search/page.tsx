"use client";

import SearchResults from "@/components/search/SearchResults";
import { useVisibleTabs } from "@/lib/staffConfigContext";

// Staff search results on the main screen. Only the tabs the admin switched on are searched, and only by the fields
// they show (the server enforces this in /api/search).
export default function StaffSearchPage() {
  const tabs = useVisibleTabs();
  return <SearchResults sections={tabs} />;
}
