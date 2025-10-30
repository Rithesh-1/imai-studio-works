import fs from "fs";
import path from "path";

export type UserActivityLog = {
  timestamp: string;
  userId?: string;
  chatId?: string;
  sessionId?: string;
  type: "click" | "keypress" | "fetch_start" | "fetch_end" | "custom" | "user_click" | "user_keypress" | "user_form_submit" | "user_input" | "lifecycle" | "console" | "error";
  action?: string;
  details?: Record<string, unknown>;
  requestId?: string;
  durationMs?: number;
  url?: string;
};

function ensureLogsDir(): string {
  const logsDir = path.join(process.cwd(), "User logs");
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  return logsDir;
}

function getLogFilePath(userId?: string): string {
  const logsDir = ensureLogsDir();
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const base = userId ? `user-${userId}-${yyyy}-${mm}-${dd}.log` : `anonymous-${yyyy}-${mm}-${dd}.log`;
  return path.join(logsDir, base);
}

export async function appendUserActivityLog(entry: UserActivityLog): Promise<void> {
  try {
    const filePath = getLogFilePath(entry.userId);
    const line = JSON.stringify(entry) + "\n";
    await fs.promises.appendFile(filePath, line, { encoding: "utf8" });
  } catch (error) {
    console.error("Failed to write user activity log:", error);
  }
}

export async function appendUserActivityLogs(entries: UserActivityLog[]): Promise<void> {
  if (!entries || entries.length === 0) return;
  const buckets = new Map<string, string[]>();
  for (const e of entries) {
    const filePath = getLogFilePath(e.userId);
    const line = JSON.stringify(e) + "\n";
    const arr = buckets.get(filePath) || [];
    arr.push(line);
    buckets.set(filePath, arr);
  }
  const writePromises: Promise<void>[] = [];
  buckets.forEach((lines, filePath) => {
    writePromises.push(
      fs.promises
        .appendFile(filePath, lines.join(""), { encoding: "utf8" })
        .then(() => {})
        .catch((error) => {
          console.error("Failed to write batch user activity logs:", error);
        }),
    );
  });
  await Promise.allSettled(writePromises);
}


