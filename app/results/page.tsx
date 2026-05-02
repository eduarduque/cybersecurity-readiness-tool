import { Suspense } from "react";
import { ResultsContent } from "./results-content";

export default function ResultsPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-slate-100">
      <Suspense fallback={<div className="text-slate-400">Loading results...</div>}> 
        <ResultsContent />
      </Suspense>
    </main>
  );
}