// ========================================
// the auth page's ONE entry: the page's html loads this file and
// nothing else.
//
// the order below IS the page's order of life, and it matters:
//
// 1. import-app-wide brings the network pin (hello.ts) and the
//    app-wide components.
// 2. the redirect decides whether the reader is already signed in and
//    bounces them to their account page.
// 3. the components mount last — the auth button that signs in.
import "./import-app-wide";
import "./auth/app_page_auth_redirect";
// ========================================
// copyright 2026 by sleet.near
// ========================================
