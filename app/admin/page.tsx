import { supabase } from "@/lib/supabase";
import { ADMIN_URL_SECRET } from "@/lib/admin-secret";
import { dbSchema, profilesTable } from "@/lib/db-config";
import TriggerWeeklyUpdate from "./trigger-weekly-update";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type AdminRow = {
  source: "assessment" | "profile";
  name: string;
  email: string;
  score: number | null;
  date: string | null;
};

const assessmentsTable =
  process.env.NEXT_PUBLIC_SUPABASE_ASSESSMENTS_TABLE ?? "assessments";

const formatDate = (date: string | null) => {
  if (!date) return "-";

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "-";

  return parsed.toLocaleString();
};

export default async function AdminPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const secret = params.secret;
  const secretValue = Array.isArray(secret) ? secret[0] : secret;

  if (secretValue !== ADMIN_URL_SECRET) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-slate-100">
        <section className="w-full max-w-lg rounded-xl border border-rose-500/30 bg-slate-900 p-6 text-center shadow-lg">
          <h1 className="mb-2 text-2xl font-semibold text-rose-300">
            Unauthorized
          </h1>
          <p className="text-slate-300">
            Add the correct <code>?secret=...</code> query parameter to access
            this page.
          </p>
        </section>
      </main>
    );
  }

  const [assessmentsResult, profilesResult] = await Promise.all([
    supabase
      .schema(dbSchema)
      .from(assessmentsTable)
      .select("email, score, answers, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .schema(dbSchema)
      .from(profilesTable)
      .select("email, created_at")
      .order("created_at", { ascending: false }),
  ]);

  const assessments = (assessmentsResult.data ?? []) as Array<{
    email: string | null;
    score: number | null;
    answers: Record<string, unknown> | null;
    created_at: string | null;
  }>;

  const profiles = (profilesResult.data ?? []) as Array<{
    email: string | null;
    created_at: string | null;
  }>;

  const rows: AdminRow[] = [
    ...assessments.map((item) => ({
      source: "assessment" as const,
      name:
        typeof item.answers?.meta === "object" &&
        item.answers?.meta &&
        "name" in item.answers.meta &&
        typeof item.answers.meta.name === "string"
          ? item.answers.meta.name
          : "-",
      email: item.email ?? "-",
      score: item.score,
      date: item.created_at,
    })),
    ...profiles.map((item) => ({
      source: "profile" as const,
      name: "-",
      email: item.email ?? "-",
      score: null,
      date: item.created_at,
    })),
  ].sort((a, b) => {
    const aTime = a.date ? new Date(a.date).getTime() : 0;
    const bTime = b.date ? new Date(b.date).getTime() : 0;
    return bTime - aTime;
  });

  const errorMessage =
    assessmentsResult.error?.message ?? profilesResult.error?.message ?? "";
  const hasNoData = rows.length === 0;

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-slate-100">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-2 text-3xl font-semibold">Admin Dashboard</h1>
        <p className="mb-6 text-slate-300">
          Records from <code>{dbSchema}.{assessmentsTable}</code> and{" "}
          <code>{dbSchema}.{profilesTable}</code>.
        </p>

        <TriggerWeeklyUpdate adminSecret={ADMIN_URL_SECRET} />

        {errorMessage ? (
          <p className="mb-4 rounded-md border border-rose-500/40 bg-rose-950/40 px-3 py-2 text-sm text-rose-200">
            Failed to load some data: {errorMessage}
          </p>
        ) : null}

        {!errorMessage && hasNoData ? (
          <p className="mb-4 rounded-md border border-amber-500/40 bg-amber-950/40 px-3 py-2 text-sm text-amber-200">
            No rows returned. If you already have records, this usually means
            RLS has no SELECT policy for the anon role.
          </p>
        ) : null}

        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-lg">
          <table className="min-w-full divide-y divide-slate-800">
            <thead className="bg-slate-800/60">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-200">
                  Source
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-200">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-200">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-200">
                  Score
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-200">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center text-sm text-slate-400"
                  >
                    No records found.
                  </td>
                </tr>
              ) : (
                rows.map((row, index) => (
                  <tr key={`${row.email}-${row.date ?? "no-date"}-${index}`}>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          row.source === "assessment"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-sky-500/20 text-sky-300"
                        }`}
                      >
                        {row.source}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-200">
                      {row.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-100">
                      {row.email}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-200">
                      {row.score ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">
                      {formatDate(row.date)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
