import fs from "fs";
import path from "path";
import util from "util";

declare global {
  // eslint-disable-next-line no-var
  var __IMAI_ENHANCED_TERMINAL_LOGGER_HOOKED__: boolean | undefined;
}

function ensureLogsDir(): string {
  const logsDir = path.join(process.cwd(), "User logs");
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  return logsDir;
}

function getEnhancedLogFilePath(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return path.join(ensureLogsDir(), `enhanced-terminal-${yyyy}-${mm}-${dd}.log`);
}

function getRawLogFilePath(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return path.join(ensureLogsDir(), `terminal-raw-${yyyy}-${mm}-${dd}.log`);
}

const enhancedLogQueue: any[] = [];
const rawLogQueue: string[] = [];
let flushScheduled = false;

function extractPaymentInfo(obj: any): any {
  if (!obj || typeof obj !== 'object') return null;
  if (obj.userId && (obj.silverCredits !== undefined || obj.goldCredits !== undefined)) {
    return {
      type: 'payment_record',
      userId: obj.userId,
      silverCredits: obj.silverCredits,
      goldCredits: obj.goldCredits,
      plan: obj.plan,
      status: obj.status,
      stripeCustomerId: obj.stripeCustomerId,
      createdAt: obj.createdAt,
      updatedAt: obj.updatedAt,
      fullRecord: obj
    };
  }
  if (obj.userId && (obj.consumed !== undefined || obj.remaining !== undefined)) {
    return {
      type: 'credit_consumption',
      userId: obj.userId,
      consumed: obj.consumed,
      remaining: obj.remaining,
      creditType: obj.type || 'silver',
      fullRecord: obj
    };
  }
  if (obj.endpoint || obj.route || obj.method) {
    return {
      type: 'api_route',
      endpoint: obj.endpoint,
      route: obj.route,
      method: obj.method,
      userId: obj.userId,
      chatId: obj.chatId,
      fullRecord: obj
    };
  }
  return null;
}

function extractUserInfo(obj: any): any {
  if (!obj || typeof obj !== 'object') return null;
  if (obj.userId || obj.user_id || obj.uid) {
    return {
      type: 'user_activity',
      userId: obj.userId || obj.user_id || obj.uid,
      chatId: obj.chatId || obj.chat_id,
      action: obj.action,
      message: obj.message,
      fullRecord: obj
    };
  }
  return null;
}

function processLogEntry(level: string, args: any[]): any {
  const timestamp = new Date().toISOString();
  const rawMessage = util.format.apply(util, args as any);
  const structuredData: any = { timestamp, level, raw_message: rawMessage, extracted_info: [] };
  for (const arg of args) {
    if (typeof arg === 'object' && arg !== null) {
      const paymentInfo = extractPaymentInfo(arg);
      if (paymentInfo) structuredData.extracted_info.push(paymentInfo);
      const userInfo = extractUserInfo(arg);
      if (userInfo) structuredData.extracted_info.push(userInfo);
    }
    if (typeof arg === 'string') {
      if (arg.includes('💳') || arg.includes('Payment record')) {
        structuredData.extracted_info.push({ type: 'payment_log', message: arg });
      }
      if (arg.includes('✅') || arg.includes('🔍') || arg.includes('🚀')) {
        structuredData.extracted_info.push({ type: 'processing_log', message: arg });
      }
      if (arg.includes('POST') || arg.includes('GET') || arg.includes('API')) {
        structuredData.extracted_info.push({ type: 'api_log', message: arg });
      }
    }
  }
  return structuredData;
}

function enqueueEnhancedLog(level: string, args: any[]) {
  try {
    const structuredEntry = processLogEntry(level, args);
    const rawMessage = util.format.apply(util, args as any) + "\n";
    enhancedLogQueue.push(structuredEntry);
    rawLogQueue.push(rawMessage);
    scheduleFlush();
  } catch {}
}

function scheduleFlush() {
  if (flushScheduled) return;
  flushScheduled = true;
  setImmediate(async () => {
    flushScheduled = false;
    if (enhancedLogQueue.length === 0 && rawLogQueue.length === 0) return;
    const enhancedToWrite = enhancedLogQueue.splice(0, enhancedLogQueue.length);
    const rawToWrite = rawLogQueue.splice(0, rawLogQueue.length);
    try {
      const writePromises: Promise<any>[] = [];
      if (enhancedToWrite.length > 0) {
        const enhancedContent = enhancedToWrite.map(entry => JSON.stringify(entry) + "\n").join("");
        writePromises.push(fs.promises.appendFile(getEnhancedLogFilePath(), enhancedContent, { encoding: "utf8" }));
      }
      if (rawToWrite.length > 0) {
        const rawContent = rawToWrite.join("");
        writePromises.push(fs.promises.appendFile(getRawLogFilePath(), rawContent, { encoding: "utf8" }));
      }
      await Promise.allSettled(writePromises);
    } catch (error) {
      // Avoid recursion
      try { console.error("Failed to write enhanced logs:", error); } catch {}
    }
  });
}

if (!global.__IMAI_ENHANCED_TERMINAL_LOGGER_HOOKED__) {
  global.__IMAI_ENHANCED_TERMINAL_LOGGER_HOOKED__ = true;
  ensureLogsDir();
  const originalConsole = {
    log: console.log.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
  };
  console.log = (...args: any[]) => { const ret = originalConsole.log(...args); enqueueEnhancedLog("log", args); return ret; };
  console.warn = (...args: any[]) => { const ret = originalConsole.warn(...args); enqueueEnhancedLog("warn", args); return ret; };
  console.error = (...args: any[]) => { const ret = originalConsole.error(...args); enqueueEnhancedLog("error", args); return ret; };
  const originalStdoutWrite = process.stdout.write.bind(process.stdout);
  const originalStderrWrite = process.stderr.write.bind(process.stderr);
  process.stdout.write = (chunk: any, ...args: any[]) => { const ret = originalStdoutWrite(chunk, ...args); if (typeof chunk === 'string') enqueueEnhancedLog("stdout", [chunk]); return ret; };
  process.stderr.write = (chunk: any, ...args: any[]) => { const ret = originalStderrWrite(chunk, ...args); if (typeof chunk === 'string') enqueueEnhancedLog("stderr", [chunk]); return ret; };
}


