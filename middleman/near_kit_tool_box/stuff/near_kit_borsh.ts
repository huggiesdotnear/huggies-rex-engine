// ========================================
// NEAR_KIT_BORSH
// the single borsh reader/writer this folder uses. it replaces the
// two duplicated copies that used to live in frontend/lib/ts
// (borsh_reader.ts and intear_dex_borsh.ts).
//
// deliberately dependency-free — it only covers what the INTEAR DEX
// helpers need:
//   - u8 / u32 / u128
//   - String
//   - Vec<T>
//   - Option<T>
//   - enum variants with a u8 discriminant
//
// amounts are u128 and are carried as decimal strings, matching the
// rest of this folder and the NEAR json convention of using strings
// for 128-bit integers.
// ========================================

// ========================================
// the borsh reader. reads little-endian values out of a byte array.
export class BorshReader {
  private offset = 0;

  constructor(private readonly data: Uint8Array) {}

  // --- WHY --- the slice is copied before the DataView is built:
  // a Uint8Array can sit at a non-zero byte offset inside its
  // buffer, and a DataView over the raw buffer would then read the
  // wrong bytes.
  private take(length: number): Uint8Array {
    if (this.offset + length > this.data.length) {
      throw new Error(
        `borsh: unexpected end of input (need ${length} bytes at offset ${this.offset}, have ${this.data.length - this.offset})`,
      );
    }
    const slice = this.data.subarray(this.offset, this.offset + length);
    this.offset += length;
    return slice;
  }

  // the bytes left to read.
  get remaining(): number {
    return this.data.length - this.offset;
  }

  // read one unsigned 8-bit integer.
  u8(): number {
    return this.take(1)[0] as number;
  }

  // read one unsigned little-endian 32-bit integer.
  u32(): number {
    const bytes = this.take(4).slice();
    return new DataView(bytes.buffer).getUint32(0, true);
  }

  // read one unsigned little-endian 64-bit integer.
  u64(): bigint {
    const bytes = this.take(8).slice();
    return new DataView(bytes.buffer).getBigUint64(0, true);
  }

  // read one unsigned little-endian 128-bit integer.
  u128(): bigint {
    const bytes = this.take(16).slice();
    const view = new DataView(bytes.buffer);
    const low = view.getBigUint64(0, true);
    const high = view.getBigUint64(8, true);
    return (high << 64n) | low;
  }

  // read one length-prefixed byte string.
  bytes(): Uint8Array {
    return this.take(this.u32());
  }

  // read one length-prefixed UTF-8 string.
  string(): string {
    return new TextDecoder().decode(this.bytes());
  }

  // read one optional value encoded as a one-byte tag plus payload.
  option<T>(read: (reader: BorshReader) => T): T | null {
    const tag = this.u8();
    if (tag === 0) return null;
    if (tag !== 1) throw new Error(`borsh: invalid option tag ${tag}`);
    return read(this);
  }

  // read one length-prefixed vector using the supplied item reader.
  vec<T>(read: (reader: BorshReader) => T): T[] {
    const length = this.u32();
    const out: T[] = [];
    for (let index = 0; index < length; index += 1) {
      out.push(read(this));
    }
    return out;
  }
}

// ========================================
// the borsh writer. builds a byte array out of borsh values.
export class BorshWriter {
  private chunks: Uint8Array[] = [];

  // append one unsigned 8-bit integer.
  u8(value: number): this {
    const bytes = new Uint8Array(1);
    bytes[0] = value & 0xff;
    this.chunks.push(bytes);
    return this;
  }

  // append one unsigned little-endian 32-bit integer.
  u32(value: number): this {
    const bytes = new Uint8Array(4);
    new DataView(bytes.buffer).setUint32(0, value >>> 0, true);
    this.chunks.push(bytes);
    return this;
  }

  // append one length-prefixed byte string.
  bytes(value: Uint8Array): this {
    this.u32(value.length);
    this.chunks.push(value);
    return this;
  }

  // append one length-prefixed UTF-8 string.
  string(value: string): this {
    return this.bytes(new TextEncoder().encode(value));
  }

  // append one length-prefixed vector using the supplied item writer.
  vec<T>(
    values: ReadonlyArray<T>,
    write: (writer: BorshWriter, value: T) => void,
  ): this {
    this.u32(values.length);
    for (const value of values) write(this, value);
    return this;
  }

  // join the encoded chunks into one byte array.
  toBytes(): Uint8Array {
    const length = this.chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const out = new Uint8Array(length);
    let offset = 0;
    for (const chunk of this.chunks) {
      out.set(chunk, offset);
      offset += chunk.length;
    }
    return out;
  }
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
