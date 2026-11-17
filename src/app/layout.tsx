import type { Metadata, Viewport } from "next";
import type { CSSProperties } from "react";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import "./globals.css";
import { RoleProvider } from "@/lib/roleContext";
import { AppearanceProvider } from "@/lib/appearanceContext";
import { getAppearance } from "@/lib/appearanceServer";
import { DiaryConfigProvider } from "@/lib/diaryConfigContext";
import { getDiaryConfig } from "@/lib/diaryConfigServer";

// The pharmacy store's fonts. They are downloaded once when you run `npm run build`
// and then served from your own app.
const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage" });
const body = Figtree({ subsets: ["latin"], variable: "--font-figtree" });

// Theme and app name are edited in Settings > Appearance and must show up straight away.
export const dynamic = "force-dynamic";

// Lets the page use the whole phone screen (notches, home bar); the layouts add their own safe-area spacing.
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

export async function generateMetadata(): Promise<Metadata> {
  const { appName } = await getAppearance();
  return {
    title: appName,
    description: "Operations record for products, diary, transport, and clients.",
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [appearance, diaryConfig] = await Promise.all([getAppearance(), getDiaryConfig()]);

  return (
    <html
      lang="en"
      data-theme={appearance.theme}
      data-font={appearance.fontStyle}
      className={`${display.variable} ${body.variable}`}
      style={{ "--brand": appearance.brandColor } as CSSProperties}
    >
      <body className="antialiased">
        <AppearanceProvider value={appearance}>
          <DiaryConfigProvider value={diaryConfig}>
            <RoleProvider>{children}</RoleProvider>
          </DiaryConfigProvider>
        </AppearanceProvider>
      </body>
    </html>
  );
}
