import React from "react";
import ReactDOM from "react-dom/client";
import App from "@/app/App";
import "@/index.css";
import "@/styles/globals.scss";
import { initDb } from "@/services/sql/sqlClient";

// Warm up the sql.js worker so the first dashboard query doesn't feel stuck.
// Any init error will surface in the Dashboard error UI.
initDb().catch((e) => console.error("DB init failed", e));

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
