// ========================================
// HUGGIES_PING
// the answer of our own liveness route, GET /api/huggies/ping.
//
// `ok` is true when the backend answered, `app` names the app that
// answered so a health checker can tell the services apart.
// ========================================

export interface HUGGIES_PING {
  ok: boolean;
  app: string;
}
// ========================================
// copyright 2026 by sleet.near
