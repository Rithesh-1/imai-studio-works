import { NextRequest, NextResponse } from "next/server";
import "@/lib/logger/serverConsoleHook";
import "@/lib/logger/enhancedTerminalLogger";
import { appendUserActivityLog, appendUserActivityLogs, UserActivityLog } from "@/lib/logger/userActivityLogger";

export const maxDuration = 60;

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = await request.json();
      if (Array.isArray(body)) {
        const entries = body.map(normalizeEntry);
        await appendUserActivityLogs(entries);
      } else {
        const entry = normalizeEntry(body);
        await appendUserActivityLog(entry);
      }
      return NextResponse.json({ ok: true });
    }

    const form = await request.formData();
    const raw = form.get("entry") as string | null;
    if (!raw) {
      return NextResponse.json({ ok: false, error: "Missing entry" }, { status: 400 });
    }
    const entry = normalizeEntry(JSON.parse(raw));
    await appendUserActivityLog(entry);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("/api/logs error:", error);
    return NextResponse.json({ ok: false, error: "Failed to write logs" }, { status: 500 });
  }
}

function normalizeEntry(input: any): UserActivityLog {
  const nowIso = new Date().toISOString();
  return {
    timestamp: input?.timestamp || nowIso,
    userId: input?.userId,
    chatId: input?.chatId,
    sessionId: input?.sessionId,
    type: input?.type || "custom",
    action: input?.action,
    details: input?.details || {},
    requestId: input?.requestId,
    durationMs: input?.durationMs,
    url: input?.url,
  };
}


