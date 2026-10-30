// ========================================
// PARSE_ERROR
// turn a non-2xx backend response into a thrown Error.
//
// our backend answers failures with `{ "error": { "code", "message" } }`,
// so the code and the message are pulled out and put on the error itself.
// the framed banner is the mirror of api_call's success log.
//
// --- WHY --- the error carries the status and the code, not just a
// message: the code is what the backend decided (invalid_account_id,
// trezu_unreachable, ...), and a caller branching on it needs it as a
// field, not as text it has to parse.
// ========================================

import type { HUGGIES_ERROR_RESPONSE } from "../types/common";

export interface HUGGIES_API_ERROR extends Error {
  status: number;
  code: string;
}

export interface PARSE_ERROR_CONTEXT {
  url?: string;
  method?: string;
  // wrapper-level label, e.g. "TREZU TREASURIES GET".
  label?: string;
  // JSON.stringify'd body sent on the wire. undefined for GETs.
  request_body?: BodyInit | null;
}

export async function parse_error(
  res: Response,
  fallback: string,
  context: PARSE_ERROR_CONTEXT = {},
): Promise<HUGGIES_API_ERROR> {
  let detail = "";
  let response_json: unknown;
  let response_text = "";
  try {
    const text = await res.text();
    response_text = text;
    if (text) {
      try {
        const parsed = JSON.parse(text) as HUGGIES_ERROR_RESPONSE;
        const envelope = parsed?.error;
        if (
          envelope &&
          typeof envelope.message === "string" &&
          envelope.message.length > 0
        ) {
          detail = `: ${envelope.message}`;
        } else {
          detail = `: ${text}`;
        }
        response_json = parsed;
      } catch {
        detail = `: ${text}`;
      }
    }
  } catch {
    // body read failed — leave detail empty.
  }
  // ========================================
  // framed failure banner; mirrors api_call's success shape.
  const label_str = context.label ?? fallback.toUpperCase();
  const verb = context.method ?? "REQUEST";
  console.log("=============================");
  if (context.url) {
    console.log(
      ` ${label_str} VIA ${verb} failed: ${res.status} ${res.statusText} on:`,
      context.url,
    );
  } else {
    console.log(
      ` ${label_str} VIA ${verb} failed: ${res.status} ${res.statusText}`,
    );
  }
  if (context.request_body !== undefined && context.request_body !== null) {
    console.log("REQUEST BODY:", context.request_body);
  }
  if (response_text) {
    console.log("RESPONSE BODY:", response_json ?? response_text);
  }
  console.log("=============================");
  // ========================================
  const code = extract_code_fun(response_json, res.status);
  const error = new Error(
    `${fallback} (${res.status} ${res.statusText})${detail}`,
  ) as HUGGIES_API_ERROR;
  error.name = "HUGGIES_API_ERROR";
  error.status = res.status;
  error.code = code;
  return error;
}

// ========================================
// pull the error code out of the envelope. falls back to a code derived
// from the status when the body carried no code, so the field is never
// empty.
function extract_code_fun(response_json: unknown, status: number): string {
  const envelope = (response_json as HUGGIES_ERROR_RESPONSE | null)?.error;
  if (
    envelope &&
    typeof envelope.code === "string" &&
    envelope.code.length > 0
  ) {
    return envelope.code;
  }
  return status === 404 ? "not_found" : "internal";
}
// ========================================
// copyright 2026 by sleet.near
