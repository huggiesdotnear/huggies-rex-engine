// ========================================
// API_INTEAR_TOKEN_FIELDS
// the field names /tokens accepts, used by bins to reject a bad
// --fields value before spending a request on it.
// ========================================

import { api_intear_get } from "./api_intear_get";

// --- WHY --- the tool box types token_field as a string union, but a
// bin taking --fields from argv has a plain string. rather than
// casting it and letting the API 400, check it here so the user gets
// the list of valid names.
export async function api_intear_token_fields(): Promise<string[]> {
  const schema = await api_intear_get<{ token_fields: { name: string }[] }>({
    key: "api_intear_schema",
    label: "INTEAR SCHEMA GET",
    fallback: "api_intear_token_fields failed",
  });
  return schema.token_fields.map((field) => field.name);
}
// ========================================
// copyright 2026 by sleet.near
