import { redirect } from "next/navigation";
import DashboardShell from "@/components/DashboardShell";
import { AdminAreaProvider } from "@/lib/roleContext";
import { getAdminAccess } from "@/lib/adminAuth";
import { getSearchStyles } from "@/lib/searchDisplayServer";

// Always check the cookie on the server — never serve this area from a cache.
export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const access = await getAdminAccess();
  if (!access.isAdmin) redirect("/login?as=admin");
  const styles = await getSearchStyles();

  return (
    <AdminAreaProvider via={access.via}>
      <DashboardShell searchStyle={styles.admin}>{children}</DashboardShell>
    </AdminAreaProvider>
  );
}
