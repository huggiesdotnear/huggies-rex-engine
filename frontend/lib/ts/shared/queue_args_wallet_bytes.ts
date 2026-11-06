// ========================================
// queue_args_wallet_bytes.ts
// the bytes of a queued call, in the shape that survives every wallet.
//
// --- WHY THIS FILE IS ITS OWN ---
// the shape of the arguments is the thing that decides whether a FastFS
// upload works, and the reason is long enough that it needs a home of its
// own. this file makes the bytes and explains what they have to survive.
//
// --- WHAT GOES WRONG WITHOUT THIS ---
// a FastFS upload's arguments are BORSH BYTES, and the indexer reads them
// with `borsh::from_slice(&action.args)`. so the bytes have to reach the
// chain as bytes.
//
// the app decodes the queue's base64 into a `Uint8Array` and hands that to
// the wallet. the wallet then passes the transaction to its signer over a
// JSON boundary, and there the `Uint8Array` is `JSON.stringify`d — and
// `JSON.stringify` of a `Uint8Array` is an OBJECT whose keys are the byte
// indexes:
//
//   {"0":0,"1":15,"10":47,"11":115,...}
//
// the wallet's signer reads that object back as a MAP OF BYTES — a
// `BTreeMap<String, u8>` in rust — and writes it back out, and the action's
// args are that map's json, not the file's bytes.
//
// the indexer reads the json, finds no borsh, and DROPS THE ACTION
// SILENTLY. the receipt fails the way a FastFS receipt always fails, the
// file never appears at its url, and nothing anywhere says why. a 52-byte
// borsh payload arrives on chain as 426 bytes of json.
//
// --- THE FIX ---
// the bytes get a `toJSON` that returns them as an ARRAY OF NUMBERS.
//
// an array of numbers is what rust reads as `Vec<u8>` — the bytes. so the
// json boundary now carries the bytes, and the signer reads them back as
// bytes.
//
// --- WHY THE BYTES ARE STILL A `Uint8Array` ---
// near-api-js decides between bytes and json with a duck-type check:
//
//   const isUint8Array = args.byteLength !== undefined
//     && args.byteLength === args.length;
//   return isUint8Array ? args : Buffer.from(JSON.stringify(args));
//
// so a `Uint8Array` is passed through as bytes, and anything else is
// `JSON.stringify`d. this has to stay a `Uint8Array` or the bytes become
// the json text of an array before they ever reach a signer.
//
// `toJSON` is a method on the object, so it does not change what the object
// IS: `byteLength` is still the byte count, `length` is still the element
// count, and the duck-type check still says "these are bytes".
//
// --- WHY THE POSTMESSAGE PATH IS NOT BROKEN BY IT ---
// the wallets that borsh-serialize the transaction in the browser receive
// the transaction over `postMessage`, and `structuredClone` copies the
// bytes but NOT the `toJSON` method. those wallets then borsh the bytes
// directly, which is what they did before, so they are unchanged.
//
// the wallets that json-serialize the transaction are the ones that were
// broken, and the `toJSON` is what fixes them.
//
// --- WHY `Array.from` AND NOT A SPREAD ---
// `Array.from(this)` reads the bytes as numbers, which is what a json
// array of numbers has to be. a spread would build the same thing, but
// `Array.from` says it.
//
// --- WHY THE RETURN TYPE CARRIES A `toJSON` ---
// `toJSON` is not on `Uint8Array`'s type, so the type says the method
// exists. the value really is a `Uint8Array` — `byteLength` and `length`
// are the byte count and the element count, and near-api-js's duck-type
// check reads them exactly as it reads a plain `Uint8Array`.
export interface SHIT_1170_WALLET_BYTES extends Uint8Array {
  toJSON: () => number[];
}

export function shit_1170_queue_args_wallet_bytes_fun(
  bytes: Uint8Array,
): SHIT_1170_WALLET_BYTES {
  const wallet_bytes = new Uint8Array(bytes.length) as SHIT_1170_WALLET_BYTES;
  wallet_bytes.set(bytes);
  wallet_bytes.toJSON = function (): number[] {
    return Array.from(this);
  };
  return wallet_bytes;
}
// ========================================
// copyright 2026 by sleet.near
