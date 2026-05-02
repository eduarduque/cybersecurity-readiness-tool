"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";

type AnswerValue = "Yes" | "No" | null;

type Question = {
  id: string;
  prompt: string;
  description: string;
};

const questions: Question[] = [
  {
    id: "two_factor_auth",
    prompt: "Do you enable two-factor authentication (2FA) on critical accounts?",
    description: "Covers email, banking, social, and work accounts.",
  },
  {
    id: "password_manager",
    prompt: "Do you use a password manager with unique passwords?",
    description: "Avoiding password reuse reduces credential stuffing risk.",
  },
  {
    id: "regular_backups",
    prompt: "Do you keep regular, tested backups of important data?",
    description: "Backups are essential for ransomware and hardware recovery.",
  },
  {
    id: "software_updates",
    prompt: "Do you keep devices and software updated automatically?",
    description: "Most attacks exploit known vulnerabilities with available patches.",
  },
  {
    id: "phishing_checks",
    prompt: "Do you verify suspicious emails and links before clicking?",
    description: "Phishing awareness is one of the strongest daily defenses.",
  },
];

const dbSchema = process.env.NEXT_PUBLIC_SUPABASE_SCHEMA ?? "public";
const profilesTable =
  process.env.NEXT_PUBLIC_SUPABASE_PROFILES_TABLE ?? "profiles";
const assessmentsTable =
  process.env.NEXT_PUBLIC_SUPABASE_ASSESSMENTS_TABLE ?? "assessments";

export default function AssessmentPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>(
    () =>
      Object.fromEntries(
        questions.map((question) => [question.id, null as AnswerValue])
      ) as Record<string, AnswerValue>
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [warningMessage, setWarningMessage] = useState("");

  const question = questions[step];
  const progress = ((step + 1) / questions.length) * 100;

  const score = useMemo(
    () =>
      Object.values(answers).reduce(
        (total, answer) => total + (answer === "Yes" ? 20 : 0),
        0
      ),
    [answers]
  );

  const setAnswer = (value: Exclude<AnswerValue, null>) => {
    setAnswers((previous) => ({ ...previous, [question.id]: value }));
    setErrorMessage("");
  };

  const goNext = () => {
    if (!answers[question.id]) {
      setErrorMessage("Select an answer before continuing.");
      return;
    }

    setErrorMessage("");
    setStep((previous) => Math.min(previous + 1, questions.length - 1));
  };

  const goBack = () => {
    setErrorMessage("");
    setStep((previous) => Math.max(previous - 1, 0));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setWarningMessage("");

    if (!email.trim()) {
      setErrorMessage("Please enter your email.");
      return;
    }
    if (!name.trim()) {
      setErrorMessage("Please enter your name.");
      return;
    }

    const unanswered = questions.some((item) => !answers[item.id]);
    if (unanswered) {
      setErrorMessage("Please answer all questions before submitting.");
      return;
    }

    setIsSubmitting(true);

    try {
      const normalizedName = name.trim();
      const normalizedEmail = email.trim().toLowerCase();
      const { error: profileError } = await supabase
        .schema(dbSchema)
        .from(profilesTable)
        .upsert(
          { email: normalizedEmail, name: normalizedName },
          { onConflict: "email" }
        );

      if (profileError) {
        // Some schemas only have email in profiles. Retry with email-only.
        const { error: profileRetryError } = await supabase
          .schema(dbSchema)
          .from(profilesTable)
          .upsert({ email: normalizedEmail }, { onConflict: "email" });

        if (profileRetryError) {
          setWarningMessage(
            `Profile email was not saved in ${dbSchema}.${profilesTable}: ${profileRetryError.message}`
          );
        }
      }

      const { error: assessmentError } = await supabase
        .schema(dbSchema)
        .from(assessmentsTable)
        .insert({
          email: normalizedEmail,
          score,
          answers: {
            ...answers,
            meta: {
              name: normalizedName,
            },
          },
        });

      if (assessmentError) {
        throw new Error(
          `Could not save assessment in ${dbSchema}.${assessmentsTable}: ${assessmentError.message}`
        );
      }

      router.push(`/results?score=${score}`);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to submit assessment. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-slate-100">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-7 shadow-xl"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="mb-1 text-xs uppercase tracking-widest text-emerald-400">
              Cybersecurity Assessment
            </p>
            <h1 className="flex items-center gap-2 text-2xl font-semibold">
              <ShieldCheck className="h-6 w-6 text-emerald-400" />
              Step {step + 1} of {questions.length}
            </h1>
          </div>
          <span className="rounded-full border border-slate-700 px-3 py-1 text-sm text-slate-300">
            Score Preview: {score}/100
          </span>
        </div>

        <div className="mb-7 h-2 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <label className="mb-4 block">
          <span className="mb-2 block text-sm font-medium text-slate-200">
            Your Name
          </span>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Eduardo Duque"
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-emerald-400 placeholder:text-slate-500 focus:ring-2"
            required
          />
        </label>

        <label className="mb-6 block">
          <span className="mb-2 block text-sm font-medium text-slate-200">
            Your Email
          </span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@company.com"
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-emerald-400 placeholder:text-slate-500 focus:ring-2"
            required
          />
        </label>

        <section className="rounded-xl border border-slate-800 bg-slate-950/60 p-5">
          <p className="mb-2 text-lg font-semibold">{question.prompt}</p>
          <p className="mb-5 text-sm text-slate-400">{question.description}</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {(["Yes", "No"] as const).map((option) => {
              const selected = answers[question.id] === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setAnswer(option)}
                  className={`rounded-md border px-4 py-3 text-left font-medium transition ${
                    selected
                      ? "border-emerald-400 bg-emerald-500/20 text-emerald-200"
                      : "border-slate-700 bg-slate-900 text-slate-200 hover:border-slate-500"
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </section>

        {errorMessage && (
          <p className="mt-4 rounded-md border border-rose-500/40 bg-rose-950/40 px-3 py-2 text-sm text-rose-200">
            {errorMessage}
          </p>
        )}

        {warningMessage && (
          <p className="mt-4 rounded-md border border-amber-500/40 bg-amber-950/40 px-3 py-2 text-sm text-amber-200">
            {warningMessage}
          </p>
        )}

        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            onClick={goBack}
            disabled={step === 0 || isSubmitting}
            className="inline-flex items-center gap-1 rounded-md border border-slate-700 px-3 py-2 text-sm text-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>

          {step < questions.length - 1 ? (
            <button
              type="button"
              onClick={goNext}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1 rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Submitting..." : "Submit Assessment"}
            </button>
          )}
        </div>
      </form>
    </main>
  );
}
