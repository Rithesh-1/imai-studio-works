import fs from "fs";
import path from "path";
import util from "util";

declare global {
  // eslint-disable-next-line no-var
  var __IMAI_SERVER_CONSOLE_HOOKED__: boolean | undefined;
}

function ensureLogsDir(): string {
  const logsDir = path.join(process.cwd(), "User logs");
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  return logsDir;
}

function serverLogFilePath(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return path.join(ensureLogsDir(), `server-${yyyy}-${mm}-${dd}.log`);
}

function serverRawFilePath(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return path.join(ensureLogsDir(), `server-raw-${yyyy}-${mm}-${dd}.log`);
}

const __jsonQueue: string[] = [];
const __rawQueue: string[] = [];
let __flushScheduled = false;

function enqueue(level: string, args: any[]) {
  try {
    const enhancedDetails = args.map((a) => {
      if (a instanceof Error) {
        return { type: 'error', name: a.name, message: a.message, stack: a.stack };
      }

      if (typeof a === 'object' && a !== null) {
        if ((a as any).userId && ((a as any).silverCredits !== undefined || (a as any).goldCredits !== undefined)) {
          return {
            type: 'payment_record',
            userId: (a as any).userId,
            silverCredits: (a as any).silverCredits,
            goldCredits: (a as any).goldCredits,
            plan: (a as any).plan,
            status: (a as any).status,
            stripeCustomerId: (a as any).stripeCustomerId,
            createdAt: (a as any).createdAt,
            updatedAt: (a as any).updatedAt,
            raw: a
          };
        }

        if ((a as any).userId && (a as any).remaining !== undefined) {
          return {
            type: 'credit_consumption',
            userId: (a as any).userId,
            consumed: (a as any).consumed,
            remaining: (a as any).remaining,
            creditType: (a as any).type,
            raw: a
          };
        }
      }

      if (typeof a === 'string' && (a.includes('Route') || a.includes('API') || a.includes('POST') || a.includes('GET'))) {
        return { type: 'api_route', message: a, raw: a };
      }
      if (typeof a === 'string' && (a.includes('user') || a.includes('User'))) {
        return { type: 'user_activity', message: a, raw: a };
      }

      return { type: 'general', value: a, raw: a };
    });

    const jsonLine = JSON.stringify({
      timestamp: new Date().toISOString(),
      type: "server_console",
      level,
      details: enhancedDetails,
      raw_message: util.format.apply(util, args as any)
    }) + "\n";

    const raw = util.format.apply(util, args as any) + "\n";
    __jsonQueue.push(jsonLine);
    __rawQueue.push(raw);
    scheduleFlush();
  } catch (error) {
    // Avoid recursion
  }
}

function scheduleFlush() {
  if (__flushScheduled) return;
  __flushScheduled = true;
  setImmediate(async () => {
    __flushScheduled = false;
    const jsonCount = __jsonQueue.length;
    const rawCount = __rawQueue.length;
    if (jsonCount === 0 && rawCount === 0) return;
    const jsonPayload = jsonCount ? __jsonQueue.splice(0, jsonCount).join("") : "";
    const rawPayload = rawCount ? __rawQueue.splice(0, rawCount).join("") : "";
    try {
      const writes: Promise<any>[] = [];
      if (jsonPayload) writes.push(fs.promises.appendFile(serverLogFilePath(), jsonPayload, { encoding: "utf8" }));
      if (rawPayload) writes.push(fs.promises.appendFile(serverRawFilePath(), rawPayload, { encoding: "utf8" }));
      await Promise.allSettled(writes);
    } catch {}
  });
}

if (!global.__IMAI_SERVER_CONSOLE_HOOKED__) {
  global.__IMAI_SERVER_CONSOLE_HOOKED__ = true;
  ensureLogsDir();
  const orig = {
    log: console.log.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
  };
  console.log = (...args: any[]) => { const ret = orig.log(...args); enqueue("log", args); return ret; };
  console.warn = (...args: any[]) => { const ret = orig.warn(...args); enqueue("warn", args); return ret; };
  console.error = (...args: any[]) => { const ret = orig.error(...args); enqueue("error", args); return ret; };
}


