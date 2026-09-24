import type { Metadata } from "next";
import { adminConfigured, isAdmin } from "@/lib/intake/admin-auth";
import { dbConfigured, listSubmissions, type Submission } from "@/lib/intake/db";
import AdminLogin from "../_components/AdminLogin";
import ResponsesDashboard from "../_components/ResponsesDashboard";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Party Requests — Free Flow Fitness",
  robots: { index: false, follow: false },
};

export default async function ResponsesPage() {
  let body: React.ReactNode;
  if (!adminConfigured()) {
    body = <p className="page-note">INTAKE_ADMIN_PASSWORD is not set for this deployment.</p>;
  } else if (!isAdmin()) {
    body = <AdminLogin />;
  } else if (!dbConfigured()) {
    body = <p className="page-note">Supabase is not configured for this deployment.</p>;
  } else {
    let rows: Submission[] = [];
    let loadError: string | null = null;
    try {
      rows = await listSubmissions();
    } catch (e) {
      console.error("[intake] list failed:", e);
      loadError = "Couldn't load submissions — check the Supabase configuration.";
    }
    body = loadError ? (
      <p className="form-msg error">{loadError}</p>
    ) : (
      <ResponsesDashboard initialRows={rows} />
    );
  }

  return (
    <main className="page intake-page">
      <div className="wrap">
        <span className="eyebrow">Studio Only</span>
        <h1 className="page-title">Party Requests</h1>
        {body}
      </div>
    </main>
  );
}
