// Default to the SQLite-backed implementation (sql.js + web worker).
// Falls back to mock if someone wants to run without generating public/vuln.db.
export { sqlDataService as dataService } from "./sqlDataService";
