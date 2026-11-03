// ========================================
// SHIT_1170_PING
// the answer of our own liveness route, GET /api/shit-1170/ping.
//
// `ok` is true when the backend answered, `app` names the app that
// answered so a health checker can tell the services apart.
// ========================================

export interface SHIT_1170_PING {
  ok: boolean;
  app: string;
}
// ========================================
// copyright 2026 by sleet.near
