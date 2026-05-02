"use client";

import { useState } from "react";

type Props = {
  adminSecret: string;
};

export default function TriggerWeeklyUpdate({ adminSecret }: Props) {
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    setStatus(null);
    try {
      const response = await fetch("/api/send-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: adminSecret }),
      });
      const data = (await response.json()) as {
        error?: string;
        sent?: number;
        total?: number;
        message?: string;
        errors?: string[];
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Request failed");
      }

      if (data.message) {
        setStatus(data.message);
        return;
      }

      const errCount = data.errors?.length ?? 0;
      setStatus(
        `Sent ${data.sent ?? 0} of ${data.total ?? 0} emails.${
          errCount > 0 ? ` ${errCount} failed (see server logs / response).` : ""
        }`
      );
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Could not send update."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mb-6 flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900/80 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium text-slate-200">
          Weekly Security Update
        </p>
        <p className="text-xs text-slate-400">
          Sends the current &quot;tip of the week&quot; to every email in{" "}
          <code>profiles</code>.
        </p>
      </div>
      <div className="flex flex-col items-stretch gap-2 sm:items-end">
        <button
          type="button"
          onClick={handleClick}
          disabled={loading}
          className="rounded-md bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Sending…" : "Trigger Weekly Update"}
        </button>
        {status ? (
          <p className="max-w-md text-right text-xs text-slate-300">{status}</p>
        ) : null}
      </div>
    </div>
  );
}
