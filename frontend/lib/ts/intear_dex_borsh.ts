// ========================================
// minimal Borsh encoding and decoding for INTEAR DEX sub-dex views.
// ========================================
// ========================================
// append one unsigned little-endian 32-bit integer.
export function write_u32_fun(chunks: Uint8Array[], value: number): void {
  const bytes = new Uint8Array(4);
  new DataView(bytes.buffer).setUint32(0, value, true);
  chunks.push(bytes);
}
// ========================================
// append one length-prefixed UTF-8 string.
export function write_string_fun(chunks: Uint8Array[], value: string): void {
  const bytes = new TextEncoder().encode(value);
  write_u32_fun(chunks, bytes.length);
  chunks.push(bytes);
}
// ========================================
// append a length-prefixed vector of unsigned 32-bit integers.
export function write_u32_vec_fun(
  chunks: Uint8Array[],
  values: ReadonlyArray<number>,
): void {
  write_u32_fun(chunks, values.length);
  for (const value of values) write_u32_fun(chunks, value);
}
// ========================================
// join encoded Borsh chunks into one byte array.
export function borsh_bytes_fun(chunks: ReadonlyArray<Uint8Array>): Uint8Array {
  const length = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const out = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}
// ========================================
// read one unsigned little-endian 32-bit integer.
export function read_u32_fun(bytes: Uint8Array, offset: number): number {
  if (offset + 4 > bytes.length) throw new Error("unexpected end of Borsh u32");
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return view.getUint32(offset, true);
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
// read one unsigned little-endian 128-bit integer as a decimal string.
export function read_u128_fun(bytes: Uint8Array, offset: number): string {
  if (offset + 16 > bytes.length) {
    throw new Error("unexpected end of Borsh u128");
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const low = view.getBigUint64(offset, true);
  const high = view.getBigUint64(offset + 8, true);
  return ((high << 64n) | low).toString();
}
// ========================================
// read one optional unsigned 128-bit integer.
export function read_option_u128_fun(
  bytes: Uint8Array,
  offset: number,
): { value: string | null; offset: number } {
  if (offset >= bytes.length) throw new Error("unexpected end of Borsh option");
  const tag = bytes[offset];
  if (tag === 0) return { value: null, offset: offset + 1 };
  if (tag !== 1) throw new Error(`invalid Borsh option tag ${tag}`);
  return { value: read_u128_fun(bytes, offset + 1), offset: offset + 17 };
}
// ========================================
// read a length-prefixed vector of optional unsigned 128-bit integers.
export function read_option_u128_vec_fun(
  bytes: Uint8Array,
): ReadonlyArray<string | null> {
  const length = read_u32_fun(bytes, 0);
  let offset = 4;
  const out: Array<string | null> = [];
  for (let index = 0; index < length; index += 1) {
    const item = read_option_u128_fun(bytes, offset);
    out.push(item.value);
    offset = item.offset;
  }
  return out;
}
// ========================================
// encode bytes as standard base64 without relying on Node's Buffer.
export function bytes_to_base64_fun(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  if (typeof btoa === "function") return btoa(binary);
  const buffer = (
    globalThis as {
      Buffer?: {
        from(
          data: string,
          encoding: string,
        ): { toString(encoding: string): string };
      };
    }
  ).Buffer;
  if (buffer !== undefined) {
    return buffer.from(binary, "binary").toString("base64");
  }
  throw new Error("no base64 encoder is available in this runtime");
}
// ========================================
// decode standard base64 into bytes without relying on Node's Buffer.
export function base64_to_bytes_fun(value: string): Uint8Array {
  if (typeof atob === "function") {
    const binary = atob(value);
    const out = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      out[index] = binary.charCodeAt(index);
    }
    return out;
  }
  const buffer = (
    globalThis as {
      Buffer?: {
        from(data: string, encoding: string): Uint8Array;
      };
    }
  ).Buffer;
  if (buffer !== undefined) return buffer.from(value, "base64");
  throw new Error("no base64 decoder is available in this runtime");
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
