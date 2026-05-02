import { NextResponse } from "next/server";
import { Resend } from "resend";
import { supabase } from "@/lib/supabase";
import { ADMIN_URL_SECRET } from "@/lib/admin-secret";
import { dbSchema, profilesTable } from "@/lib/db-config";

const assessmentsTable =
  process.env.NEXT_PUBLIC_SUPABASE_ASSESSMENTS_TABLE ?? "assessments";

const WEEKLY_TIPS = [
  "Turn on two-factor authentication for your email and banking accounts — it blocks most account takeover attempts even if your password leaks.",
  "Use a password manager and give every site a unique password. Reusing passwords is how one breach becomes many.",
  "Back up important files regularly and test a restore once in a while. Backups are your best recovery tool after ransomware or device loss.",
  "Enable automatic updates on phones and laptops. Most attacks exploit known bugs that patches already fix.",
  "Slow down on links and attachments: verify the sender and URL before you click — phishing is still the #1 way attackers get in.",
];

function tipForThisWeek(): string {
  const start = new Date(new Date().getFullYear(), 0, 1);
  const now = new Date();
  const week = Math.floor(
    (now.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000)
  );
  return WEEKLY_TIPS[Math.abs(week) % WEEKLY_TIPS.length] ?? WEEKLY_TIPS[0];
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as {
      secret?: string;
    } | null;

    if (body?.secret !== ADMIN_URL_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "RESEND_API_KEY is not set" },
        { status: 500 }
      );
    }

    const { data: profileData, error: profileQueryError } = await supabase
      .schema(dbSchema)
      .from(profilesTable)
      .select("email");

    if (profileQueryError) {
      return NextResponse.json(
        { error: profileQueryError.message },
        { status: 500 }
      );
    }

    const { data: assessmentData, error: assessmentQueryError } = await supabase
      .schema(dbSchema)
      .from(assessmentsTable)
      .select("email");

    if (assessmentQueryError) {
      return NextResponse.json(
        { error: assessmentQueryError.message },
        { status: 500 }
      );
    }

    const emails = [
      ...new Set(
        [...(profileData ?? []), ...(assessmentData ?? [])]
          .map((row: { email: string | null }) =>
            typeof row.email === "string" ? row.email.trim().toLowerCase() : ""
          )
          .filter(Boolean)
      ),
    ];

    if (emails.length === 0) {
      return NextResponse.json({
        sent: 0,
        total: 0,
        message: "No email addresses found in profiles.",
      });
    }

    const resend = new Resend(apiKey);
    const configuredFrom = process.env.RESEND_FROM_EMAIL?.trim();
    const from =
      configuredFrom && configuredFrom.length > 0
        ? configuredFrom
        : "Hunter Security <onboarding@resend.dev>";
    const tip = tipForThisWeek();
    const subject = "Weekly Security Update — Tip of the Week";
    const html = `
      <div style="font-family: system-ui, sans-serif; max-width: 560px; line-height: 1.5;">
        <h1 style="font-size: 20px; margin-bottom: 16px;">Security tip of the week</h1>
        <p style="margin-bottom: 16px;">${tip}</p>
        <p style="color: #64748b; font-size: 12px; margin-top: 24px;">
          You are receiving this because your email is on file from the Hunter Cyber Assessment.
        </p>
      </div>
    `;

    let sent = 0;
    const errors: string[] = [];

    for (const to of emails) {
      const { error: sendError } = await resend.emails.send({
        from,
        to,
        subject,
        html,
      });

      if (sendError) {
        errors.push(`${to}: ${sendError.message}`);
      } else {
        sent += 1;
      }
    }

    return NextResponse.json({
      sent,
      total: emails.length,
      errors: errors.length ? errors : undefined,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unexpected server error",
      },
      { status: 500 }
    );
  }
}
