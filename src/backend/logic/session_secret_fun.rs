// ========================================
// SESSION_SECRET_FUN
// read the secret the session key is encrypted with.
//
// --- WHY --- the secret is read ONCE, at startup: the session keys in
// the db are encrypted with it, so it has to be the same for every
// request. reading it per request would mean a typo in the environment
// would break every session mid-life.
//
// --- WHY --- a missing secret is an ERROR and the app refuses to start:
// the session keys are stored ENCRYPTED, so without the secret the
// existing sessions cannot be read and new ones cannot be written.
// starting without it would look fine until the first sign-in failed.
use std::sync::OnceLock;
// ========================================
// --- CONFIG -----------------------------
// the env var holding the secret.
const HUGGIES_SESSION_SECRET_ENV: &str = "HUGGIES_SESSION_SECRET";
// ========================================
// --- STATE ------------------------------
// the secret, read once.
static SESSION_SECRET: OnceLock<String> = OnceLock::new();
// ========================================
// --- READ ------------------------------
// the secret, read on the first call and kept.
//
// --- WHY --- the value is trimmed: a secret pasted with a trailing
// newline is the same secret, and trimming it here means the pasted
// value and the trimmed value encrypt the same way.
pub fn session_secret_fun() -> Result<&'static str, String> {
    if let Some(secret) = SESSION_SECRET.get() {
        return Ok(secret);
    }
    let raw = std::env::var(HUGGIES_SESSION_SECRET_ENV).map_err(|_| {
        format!("{HUGGIES_SESSION_SECRET_ENV} is not set — the session keys cannot be encrypted")
    })?;
    let trimmed = raw.trim().to_string();
    if trimmed.is_empty() {
        return Err(format!("{HUGGIES_SESSION_SECRET_ENV} is empty"));
    }
    let _ = SESSION_SECRET.set(trimmed);
    SESSION_SECRET
        .get()
        .map(|secret| secret.as_str())
        .ok_or_else(|| "the session secret could not be read".to_string())
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
