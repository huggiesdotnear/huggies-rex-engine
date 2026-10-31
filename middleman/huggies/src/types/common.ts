// ========================================
// COMMON
// cross-cutting shapes used by every endpoint wrapper.
// ========================================

// every non-2xx from the axum side returns
//   { "error": { "code": "...", "message": "..." } }
//
// the shape is built by the backend (see trezu_error_fun.rs on the
// rust side), so the client side parsing stays trivial: it always gets
// the same envelope, whether the failure came from our own route or
// from the api we proxy.
export interface HUGGIES_ERROR_RESPONSE {
  error?: {
    code?: string;
    message?: string;
  };
}
