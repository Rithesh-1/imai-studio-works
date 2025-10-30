"use client";
import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useChat } from "@/contexts/ChatContext";

export default function LogListener() {
  const { user } = useAuth();
  const { currentChatId } = useChat();
  const sessionIdRef = useRef<string>(generateSessionId());
  const queueRef = useRef<any[]>([]);
  const flushScheduledRef = useRef(false);
  const inFlightRef = useRef(false);

  useEffect(() => {
    const sessionId = sessionIdRef.current;

    const log = (payload: any) => {
      queueRef.current.push(payload);
      scheduleFlush();
    };

    const buildBase = () => ({
      timestamp: new Date().toISOString(),
      userId: user?.uid,
      chatId: currentChatId || undefined,
      sessionId,
      url: typeof window !== "undefined" ? window.location.href : undefined,
    });

    const handleClick = (ev: MouseEvent) => {
      const target = ev.target as HTMLElement | null;
      if (!target) return;
      const role = target.getAttribute("data-role") || inferActionFromTarget(target);
      const text = target.innerText?.trim()?.slice(0, 100);
      const action = role || "click";
      log({
        ...buildBase(),
        type: "user_click",
        action,
        details: {
          text,
          tagName: target.tagName,
          id: target.id,
          className: target.className,
          x: ev.clientX,
          y: ev.clientY
        }
      });
    };

    const handleKeydown = (ev: KeyboardEvent) => {
      const target = ev.target as HTMLElement | null;
      if (!target) return;
      log({
        ...buildBase(),
        type: "user_keypress",
        action: ev.key,
        details: {
          key: ev.key,
          code: ev.code,
          tagName: target.tagName,
          id: target.id,
          className: target.className
        }
      });
    };

    const handleSubmit = (ev: SubmitEvent) => {
      const target = ev.target as HTMLFormElement | null;
      if (!target) return;
      log({
        ...buildBase(),
        type: "user_form_submit",
        action: "form_submit",
        details: {
          formId: target.id,
          formAction: target.action,
          formMethod: target.method
        }
      });
    };

    const handleInput = (ev: Event) => {
      const target = ev.target as HTMLInputElement | HTMLTextAreaElement | null;
      if (!target) return;
      if (target.type === 'text' || target.type === 'textarea' || target.type === 'search') {
        const value = target.value?.slice(0, 50);
        log({
          ...buildBase(),
          type: "user_input",
          action: "input_change",
          details: {
            fieldType: target.type,
            fieldName: target.name,
            fieldId: target.id,
            valueLength: target.value?.length || 0,
            valuePreview: value
          }
        });
      }
    };

    function scheduleFlush() {
      if (flushScheduledRef.current) return;
      flushScheduledRef.current = true;
      setTimeout(() => {
        flushScheduledRef.current = false;
        flushQueue();
      }, 250);
    }

    async function flushQueue() {
      if (inFlightRef.current) return;
      const items = queueRef.current;
      if (!items.length) return;
      queueRef.current = [];
      inFlightRef.current = true;
      const payload = JSON.stringify(items);
      try {
        await fetch("/api/logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        });
      } catch (e) {
        try { queueRef.current.unshift(...items); } catch {}
      } finally {
        inFlightRef.current = false;
        if (queueRef.current.length) scheduleFlush();
      }
    }

    const handlePageHide = () => { flushQueue(); };

    window.addEventListener("click", handleClick, true);
    window.addEventListener("keydown", handleKeydown, true);
    window.addEventListener("submit", handleSubmit, true);
    window.addEventListener("input", handleInput, true);
    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("beforeunload", handlePageHide);

    return () => {
      window.removeEventListener("click", handleClick, true);
      window.removeEventListener("keydown", handleKeydown, true);
      window.removeEventListener("submit", handleSubmit, true);
      window.removeEventListener("input", handleInput, true);
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("beforeunload", handlePageHide);
    };
  }, [user?.uid, currentChatId]);

  return null;
}

function generateSessionId(): string {
  return `sess_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

function inferActionFromTarget(target: HTMLElement): string | undefined {
  const id = target.id;
  const cls = target.className?.toString?.() || "";
  const text = target.innerText?.trim()?.toLowerCase?.() || "";
  if (/videogen|video|kling/.test(id + " " + cls + " " + text)) return "videogen_click";
  if (/lighting|light|timeofday/.test(id + " " + cls + " " + text)) return "lighting_click";
  if (/enter|send|chat/.test(id + " " + cls + " " + text)) return "chat_enter";
  if (/generate|create|make/.test(id + " " + cls + " " + text)) return "generate_click";
  if (/upload|file|image/.test(id + " " + cls + " " + text)) return "upload_click";
  if (/download|save/.test(id + " " + cls + " " + text)) return "download_click";
  if (/share|copy/.test(id + " " + cls + " " + text)) return "share_click";
  if (/delete|remove|clear/.test(id + " " + cls + " " + text)) return "delete_click";
  if (/login|signin|auth/.test(id + " " + cls + " " + text)) return "auth_click";
  if (/logout|signout/.test(id + " " + cls + " " + text)) return "logout_click";
  if (/profile|account|settings/.test(id + " " + cls + " " + text)) return "profile_click";
  if (/pricing|plan|subscribe/.test(id + " " + cls + " " + text)) return "pricing_click";
  return undefined;
}


