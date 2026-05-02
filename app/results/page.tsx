"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ShieldCheck } from "lucide-react";

const getGrade = (score: number) => {
  if (score >= 90) return "A";
  if (score >= 75) return "B";
  if (score >= 60) return "C";
  if (score >= 40) return "D";
  return "F";
};

export default function ResultsPage() {
  const searchParams = useSearchParams();
  const parsedScore = Number(searchParams.get("score"));
  const score = Number.isFinite(parsedScore) ? parsedScore : 0;
  const grade = getGrade(score);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-slate-100">
      <section className="w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-xl">
        <p className="mb-2 text-xs uppercase tracking-widest text-emerald-400">
          Assessment Result
        </p>
        <h1 className="mb-5 flex items-center gap-2 text-2xl font-semibold">
          <ShieldCheck className="h-6 w-6 text-emerald-400" />
          Your Security Score
        </h1>

        <div className="mb-6 rounded-xl border border-slate-700 bg-slate-950/70 p-6">
          <p className="text-sm text-slate-400">Final Score</p>
          <p className="text-4xl font-bold text-emerald-300">{score}/100</p>
          <p className="mt-3 text-sm text-slate-300">
            Security Grade:{" "}
            <span className="font-semibold text-emerald-300">{grade}</span>
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/"
            className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
          >
            Back Home
          </Link>
          <Link
            href="/assessment"
            className="rounded-md border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-100 hover:border-slate-500"
          >
            Retake Assessment
          </Link>
        </div>
      </section>
    </main>
  );
}
