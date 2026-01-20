/// <reference lib="webworker" />

import initSqlJs, { Database } from "sql.js";

let db: Database | null = null;

type InitMsg = { type: "init"; requestId: string };
type QueryMsg = { type: "query"; requestId: string; sql: string; params?: Record<string, any> };
type Msg = InitMsg | QueryMsg;

function post(payload: any) {
  (self as unknown as Worker).postMessage(payload);
}

self.onmessage = async (e: MessageEvent<Msg>) => {
  const msg = e.data;

  if (msg.type === "init") {
    try {
      const SQL = await initSqlJs({
        // We copy sql-wasm.wasm into /public via postinstall.
        locateFile: (file) => `/${file}`
      });

      const res = await fetch("/vuln.db");
      if (!res.ok) {
        post({ type: "init:error", requestId: msg.requestId, error: `Failed to fetch /vuln.db (${res.status})` });
        return;
      }

      const buf = await res.arrayBuffer();
      db = new SQL.Database(new Uint8Array(buf));

      post({ type: "init:ok", requestId: msg.requestId });
    } catch (err: any) {
      post({ type: "init:error", requestId: msg.requestId, error: String(err?.message ?? err) });
    }
    return;
  }

  if (msg.type === "query") {
    if (!db) {
      post({ type: "query:error", requestId: msg.requestId, error: "DB not initialized" });
      return;
    }

    try {
      const stmt = db.prepare(msg.sql);
      if (msg.params) stmt.bind(msg.params);

      const rows: any[] = [];
      while (stmt.step()) rows.push(stmt.getAsObject());
      stmt.free();

      post({ type: "query:ok", requestId: msg.requestId, rows });
    } catch (err: any) {
      post({ type: "query:error", requestId: msg.requestId, error: String(err?.message ?? err) });
    }
  }
};
