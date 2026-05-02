import { ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-8 text-slate-100">
      <div className="max-w-xl rounded-xl border border-slate-800 bg-slate-900 p-8 shadow-lg">
        <h1 className="mb-3 flex items-center gap-2 text-2xl font-semibold">
          <ShieldCheck className="h-7 w-7 text-emerald-400" />
          Hunter Cyber Assessment
        </h1>
        <p className="mb-6 text-slate-300">
          Evaluate your security posture in a fast, guided assessment.
        </p>
        <Link
          href="/assessment"
          className="inline-flex items-center rounded-md bg-emerald-500 px-4 py-2 font-medium text-slate-950 transition hover:bg-emerald-400"
        >
          Start Assessment
        </Link>
      </div>
    </main>
  );
}
