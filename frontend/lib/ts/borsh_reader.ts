// ========================================
// minimal Borsh reader for contract byte responses.
// ========================================
// ========================================
// read one unsigned little-endian 32-bit integer.
export function read_u32_fun(bytes: Uint8Array, offset: number): number {
  if (offset + 4 > bytes.length) throw new Error("unexpected end of Borsh u32");
  const value =
    bytes[offset] |
    (bytes[offset + 1] << 8) |
    (bytes[offset + 2] << 16) |
    (bytes[offset + 3] << 24);
  return value >>> 0;
}
// ========================================
// read one unsigned little-endian 128-bit integer as a decimal string.
export function read_u128_fun(bytes: Uint8Array, offset: number): string {
  if (offset + 16 > bytes.length)
    throw new Error("unexpected end of Borsh u128");
  let value = 0n;
  for (let index = 15; index >= 0; index -= 1) {
    value = value * 256n + BigInt(bytes[offset + index]);
  }
  return value.toString();
}
// ========================================
// read one length-prefixed UTF-8 string.
export function read_string_fun(
  bytes: Uint8Array,
  offset: number,
): { value: string; offset: number } {
  const length = read_u32_fun(bytes, offset);
  const start = offset + 4;
  const end = start + length;
  if (end > bytes.length) throw new Error("unexpected end of Borsh string");
  return {
    value: new TextDecoder().decode(bytes.slice(start, end)),
    offset: end,
  };
}
// ========================================
// read one optional value encoded as a one-byte tag plus payload.
export function read_option_fun<T>(
  bytes: Uint8Array,
  offset: number,
  read_value: (
    bytes: Uint8Array,
    offset: number,
  ) => { value: T; offset: number },
): { value: T | null; offset: number } {
  if (offset >= bytes.length) throw new Error("unexpected end of Borsh option");
  const tag = bytes[offset];
  if (tag === 0) return { value: null, offset: offset + 1 };
  if (tag !== 1) throw new Error(`invalid Borsh option tag ${tag}`);
  return read_value(bytes, offset + 1);
}
// ========================================
// read a length-prefixed vector using the supplied item reader.
export function read_vec_fun<T>(
  bytes: Uint8Array,
  offset: number,
  read_value: (
    bytes: Uint8Array,
    offset: number,
  ) => { value: T; offset: number },
): { value: T[]; offset: number } {
  const length = read_u32_fun(bytes, offset);
  let cursor = offset + 4;
  const value: T[] = [];
  for (let index = 0; index < length; index += 1) {
    const item = read_value(bytes, cursor);
    value.push(item.value);
    cursor = item.offset;
  }
  return { value, offset: cursor };
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
