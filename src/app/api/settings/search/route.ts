import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";
import { resolveSearchDisplay, resolveSearchStyles } from "@/lib/searchRules";
import { SEARCH_DISPLAY_TAG, getSearchDisplay, getSearchStyles } from "@/lib/searchDisplayServer";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  return NextResponse.json({ display: await getSearchDisplay(), styles: await getSearchStyles() }, { headers: { "Cache-Control": "no-store" } });
}

// Saves which details the global search shows under each result. Whatever is sent is cleaned up first.
export async function PUT(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const display = resolveSearchDisplay(body);
  const styles = resolveSearchStyles(body);
  const config = { ...display, style: styles };
  try {
    await prisma.searchDisplayConfig.upsert({
      where: { id: "search" },
      create: { id: "search", config },
      update: { config },
    });
  } catch {
    return NextResponse.json(
      { error: "Could not save. Run `npm run db:migrate` once, then restart the app." },
      { status: 500 },
    );
  }
  revalidateTag(SEARCH_DISPLAY_TAG);
  return NextResponse.json({ display, styles });
}
