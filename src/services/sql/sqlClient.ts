type WorkerResp =
  | { type: "init:ok"; requestId: string }
  | { type: "init:error"; requestId: string; error: string }
  | { type: "query:ok"; requestId: string; rows: any[] }
  | { type: "query:error"; requestId: string; error: string };

const worker = new Worker(new URL("./sql.worker.ts", import.meta.url), { type: "module" });

worker.onerror = (e) => console.error("SQL worker error:", e);
worker.onmessageerror = (e) => console.error("SQL worker message error:", e);

const pending = new Map<string, { resolve: (v: any) => void; reject: (e: Error) => void }>;

function makeId() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

worker.onmessage = (e: MessageEvent<WorkerResp>) => {
  const msg = e.data;
  const p = pending.get(msg.requestId);
  if (!p) return;
  pending.delete(msg.requestId);

  if (msg.type === "init:ok") {
    p.resolve(undefined);
    return;
  }
  if (msg.type === "query:ok") {
    p.resolve(msg.rows);
    return;
  }

  p.reject(new Error((msg as any).error ?? "Unknown SQL worker error"));
};

let initPromise: Promise<void> | null = null;

export function initDb() {
  if (!initPromise) {
    initPromise = new Promise<void>((resolve, reject) => {
      const requestId = makeId();
      pending.set(requestId, { resolve, reject });
      worker.postMessage({ type: "init", requestId });

      setTimeout(() => {
        if (pending.has(requestId)) {
          pending.delete(requestId);
          reject(new Error("DB init timed out"));
        }
      }, 60_000);
    });
  }
  return initPromise;
}

export async function query(sql: string, params?: Record<string, any>) {
  await initDb();

  return new Promise<any[]>((resolve, reject) => {
    const requestId = makeId();
    pending.set(requestId, { resolve, reject });
    worker.postMessage({ type: "query", requestId, sql, params });

    setTimeout(() => {
      if (pending.has(requestId)) {
        pending.delete(requestId);
        reject(new Error("SQL query timed out"));
      }
    }, 60_000);
  });
}
