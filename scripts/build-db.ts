/* eslint-disable no-console */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import Database from "better-sqlite3";

// Default location (user can keep ui_demo.json here locally; we .gitignore it)
const DEFAULT_LOCAL_JSON = "src/data/ui_demo.json";
const RAW_URL = "https://raw.githubusercontent.com/chanduusc/Ui-Demo-Data/main/ui_demo.json";

type RawRoot = {
  name: string;
  groups: Record<string, any>;
};

function normalizeSeverity(input?: string) {
  const s = (input ?? "").toLowerCase().trim();
  return s === "critical" || s === "high" || s === "medium" || s === "low" ? s : "unknown";
}

function makeId(imageName: string, cve: string, pkg: string, ver: string) {
  return `${imageName}::${cve}::${pkg}::${ver}`;
}

function peekFileStart(filePath: string, n = 512) {
  const fd = fs.openSync(filePath, "r");
  const buf = Buffer.alloc(n);
  const bytes = fs.readSync(fd, buf, 0, buf.length, 0);
  fs.closeSync(fd);
  return buf.slice(0, bytes).toString("utf-8").trimStart();
}

function isLikelyJson(filePath: string) {
  const head = peekFileStart(filePath);
  return head.startsWith("{") || head.startsWith("[");
}

function isGitLfsPointer(filePath: string) {
  const head = peekFileStart(filePath, 256);
  return head.includes("version https://git-lfs.github.com/spec/v1");
}

async function downloadToFile(url: string, outPath: string) {
  console.log(`Downloading JSON:\n${url}\n→ ${outPath}`);

  const res = await fetch(url, {
    headers: {
      Accept: "application/json,text/plain;q=0.9,*/*;q=0.8",
      "User-Agent": "vuln-dashboard-build-script",
    },
    redirect: "follow",
  });

  if (!res.ok || !res.body) throw new Error(`Download failed: ${res.status} ${res.statusText}`);

  const total = Number(res.headers.get("content-length") ?? 0);
  let downloaded = 0;

  const nodeStream = Readable.fromWeb(res.body as any);
  nodeStream.on("data", (chunk: Buffer) => {
    downloaded += chunk.length;
    const mb = (downloaded / (1024 * 1024)).toFixed(1);
    if (total > 0) {
      const pct = ((downloaded / total) * 100).toFixed(1);
      process.stdout.write(`\rDownloaded ${pct}% (${mb} MB)`);
    } else {
      process.stdout.write(`\rDownloaded ${mb} MB`);
    }
  });

  await pipeline(nodeStream, fs.createWriteStream(outPath));
  process.stdout.write("\nDownload complete.\n");
}

function createSchema(db: Database.Database) {
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS vulnerabilities (
      id TEXT PRIMARY KEY,
      cve TEXT NOT NULL,
      severity TEXT NOT NULL,
      cvss REAL,
      kaiStatus TEXT,

      groupId TEXT NOT NULL,
      groupName TEXT NOT NULL,
      repoId TEXT NOT NULL,
      repoName TEXT NOT NULL,

      imageKey TEXT NOT NULL,
      imageName TEXT NOT NULL,
      imageVersion TEXT NOT NULL,

      baseImage TEXT NOT NULL,
      buildType TEXT,
      maintainer TEXT,
      createTime TEXT,

      packageName TEXT NOT NULL,
      packageVersion TEXT NOT NULL,
      packageType TEXT,

      published TEXT,
      fixDate TEXT,
      status TEXT,
      description TEXT,
      link TEXT,
      owner TEXT,
      path TEXT
    );

    CREATE TABLE IF NOT EXISTS vuln_risk_factors (
      vulnId TEXT NOT NULL,
      factor TEXT NOT NULL,
      PRIMARY KEY (vulnId, factor)
    );

    CREATE INDEX IF NOT EXISTS idx_vuln_cve ON vulnerabilities(cve);
    CREATE INDEX IF NOT EXISTS idx_vuln_severity ON vulnerabilities(severity);
    CREATE INDEX IF NOT EXISTS idx_vuln_kaiStatus ON vulnerabilities(kaiStatus);
    CREATE INDEX IF NOT EXISTS idx_vuln_published ON vulnerabilities(published);
    CREATE INDEX IF NOT EXISTS idx_rf_factor ON vuln_risk_factors(factor);
  `);
}

function buildDbFromJsonFile(jsonPath: string, outDbPath: string) {
  console.log(`Reading JSON from disk: ${jsonPath}`);
  const raw = JSON.parse(fs.readFileSync(jsonPath, "utf-8")) as RawRoot;

  fs.mkdirSync(path.dirname(outDbPath), { recursive: true });
  if (fs.existsSync(outDbPath)) fs.unlinkSync(outDbPath);

  console.log(`Creating SQLite DB: ${outDbPath}`);
  const db = new Database(outDbPath);
  createSchema(db);

  const insertV = db.prepare(`
    INSERT INTO vulnerabilities (
      id, cve, severity, cvss, kaiStatus,
      groupId, groupName, repoId, repoName,
      imageKey, imageName, imageVersion,
      baseImage, buildType, maintainer, createTime,
      packageName, packageVersion, packageType,
      published, fixDate, status, description, link,
      owner, path
    ) VALUES (
      @id, @cve, @severity, @cvss, @kaiStatus,
      @groupId, @groupName, @repoId, @repoName,
      @imageKey, @imageName, @imageVersion,
      @baseImage, @buildType, @maintainer, @createTime,
      @packageName, @packageVersion, @packageType,
      @published, @fixDate, @status, @description, @link,
      @owner, @path
    )
    ON CONFLICT(id) DO UPDATE SET
      severity = CASE
        WHEN excluded.severity = 'critical' THEN 'critical'
        WHEN vulnerabilities.severity = 'critical' THEN 'critical'
        WHEN excluded.severity = 'high' AND vulnerabilities.severity IN ('medium','low','unknown') THEN 'high'
        WHEN excluded.severity = 'medium' AND vulnerabilities.severity IN ('low','unknown') THEN 'medium'
        WHEN excluded.severity = 'low' AND vulnerabilities.severity = 'unknown' THEN 'low'
        ELSE vulnerabilities.severity
      END,
      cvss = CASE
        WHEN vulnerabilities.cvss IS NULL THEN excluded.cvss
        WHEN excluded.cvss IS NULL THEN vulnerabilities.cvss
        WHEN excluded.cvss > vulnerabilities.cvss THEN excluded.cvss
        ELSE vulnerabilities.cvss
      END,
      kaiStatus = COALESCE(vulnerabilities.kaiStatus, excluded.kaiStatus),
      description = CASE
        WHEN length(excluded.description) > length(vulnerabilities.description) THEN excluded.description
        ELSE vulnerabilities.description
      END,
      published = COALESCE(vulnerabilities.published, excluded.published),
      fixDate = COALESCE(vulnerabilities.fixDate, excluded.fixDate),
      status = COALESCE(vulnerabilities.status, excluded.status),
      link = COALESCE(vulnerabilities.link, excluded.link),
      owner = COALESCE(vulnerabilities.owner, excluded.owner),
      path = COALESCE(vulnerabilities.path, excluded.path)
  `);

  const insertRF = db.prepare(`
    INSERT OR IGNORE INTO vuln_risk_factors (vulnId, factor)
    VALUES (@vulnId, @factor)
  `);

  const tx = db.transaction(() => {
    let count = 0;

    for (const [groupId, group] of Object.entries(raw.groups ?? {})) {
      for (const [repoId, repo] of Object.entries((group as any).repos ?? {})) {
        for (const [imageKey, image] of Object.entries((repo as any).images ?? {})) {
          for (const v of ((image as any).vulnerabilities ?? []) as any[]) {
            const id = makeId((image as any).name, v.cve, v.packageName, v.packageVersion);

            insertV.run({
              id,
              cve: v.cve,
              severity: normalizeSeverity(v.severity),
              cvss: v.cvss ?? null,
              kaiStatus: v.kaiStatus ?? null,

              groupId,
              groupName: (group as any).name,
              repoId,
              repoName: (repo as any).name,

              imageKey,
              imageName: (image as any).name,
              imageVersion: (image as any).version,

              baseImage: (image as any).baseImage,
              buildType: (image as any).buildType,
              maintainer: (image as any).maintainer,
              createTime: (image as any).createTime,

              packageName: v.packageName,
              packageVersion: v.packageVersion,
              packageType: v.packageType,

              published: v.published,
              fixDate: v.fixDate,
              status: v.status,
              description: v.description,
              link: v.link,
              owner: v.owner,
              path: v.path,
            });

            for (const factor of Object.keys(v.riskFactors ?? {})) {
              insertRF.run({ vulnId: id, factor });
            }

            count++;
            if (count % 50_000 === 0) console.log(`Inserted ${count.toLocaleString()} vulns...`);
          }
        }
      }
    }

    console.log(`Inserted total: ${count.toLocaleString()} vulnerabilities`);
  });

  tx();
  db.close();
  console.log("✅ DB build complete.");
}

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (name: string) => {
    const idx = args.indexOf(name);
    if (idx === -1) return undefined;
    return args[idx + 1];
  };
  return { jsonPath: get("--json") };
}

async function main() {
  const { jsonPath } = parseArgs();
  const outDb = path.join(process.cwd(), "public", "vuln.db");

  if (jsonPath) {
    const abs = path.isAbsolute(jsonPath) ? jsonPath : path.join(process.cwd(), jsonPath);
    console.log(`Using local JSON: ${abs}`);

    if (!fs.existsSync(abs)) throw new Error(`--json file not found: ${abs}`);
    if (isGitLfsPointer(abs)) throw new Error(`The file is a Git LFS pointer, not real JSON: ${abs}`);
    if (!isLikelyJson(abs)) throw new Error(`--json file does not look like JSON. First bytes:\n${peekFileStart(abs, 220)}`);

    buildDbFromJsonFile(abs, outDb);
    return;
  }

  // Default: try local file under src/data, else fallback to download.
  const local = path.join(process.cwd(), DEFAULT_LOCAL_JSON);
  if (fs.existsSync(local) && !isGitLfsPointer(local) && isLikelyJson(local)) {
    console.log(`Using default local JSON: ${local}`);
    buildDbFromJsonFile(local, outDb);
    return;
  }

  const tmpJson = path.join(os.tmpdir(), `ui_demo_${Date.now()}.json`);
  await downloadToFile(RAW_URL, tmpJson);

  if (isGitLfsPointer(tmpJson)) {
    const preview = peekFileStart(tmpJson, 220).replace(/\s+/g, " ");
    throw new Error(`Downloaded Git LFS pointer, not JSON:\n${preview}`);
  }
  if (!isLikelyJson(tmpJson)) {
    const preview = peekFileStart(tmpJson, 220).replace(/\s+/g, " ");
    throw new Error(`Downloaded file is not JSON. First bytes:\n${preview}`);
  }

  buildDbFromJsonFile(tmpJson, outDb);
  fs.unlinkSync(tmpJson);
}

main().catch((err) => {
  console.error("\n❌ Build failed:");
  console.error(err?.message ?? err);
  process.exit(1);
});
