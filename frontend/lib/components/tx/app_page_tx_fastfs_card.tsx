// ========================================
// the FastFS card: what a FastFS upload is.
//
// a FastFS upload is a function call to `__fastdata_fastfs` whose
// arguments are RAW BORSH BYTES. this card decodes those bytes and
// shows the file they carry — its name, its type, its size — the link
// it will be served at, and a preview of it when the type allows one.
//
// --- WHY THE DECODER IS THE CLIENT'S AND NOT A COPY HERE: the queue
// page shows a QUEUED upload, before it is signed, and the transaction
// page shows an ON-CHAIN one. the two must read the same bytes the
// same way, and two decoders drift. the fastnear client owns the borsh
// rules, so this card asks it what the bytes mean.
//
// --- WHY THE CARD IS ITS OWN COMPONENT AND NOT A BLOCK IN EACH PAGE:
// the queue page and the transaction page both show one, and the rules
// about what a queued upload can show — no preview, no working link —
// are the same on both.
//
// --- WHY THE PREVIEW ONLY WORKS ON-CHAIN: the file is served by the
// FastData indexer, and the indexer only knows about a file after the
// transaction is on chain. a QUEUED upload is not on chain, so its url
// 404s and an image preview would be a broken picture.
//
// --- WHY THE LIMIT PROBLEMS ARE HERE: the indexer drops what breaks
// its rules SILENTLY, so a payload that breaks them describes a file
// that will never land. the problem has to be visible somewhere, and
// here is where the reader is looking.
//
// --- WHY THE RECEIPT IS NOT ARGUED ABOUT HERE: a FastFS call fails on
// purpose — the receiver has no contract and does not need one, so the
// receipt comes back with `CodeDoesNotExist`. that fact is in the
// skill and in the docs. the page does not need to argue with the
// reader about it.
//
// this component does NOT fetch. it renders what it is given.
import {
  decode_base64_bytes_raw,
  fastfs_can_display_fun,
  fastfs_decode_fun,
  fastfs_file_uri_fun,
  fastfs_file_url_fun,
  fastfs_is_call_fun,
  fastfs_validate_fun,
} from "@sleet-js/fastnear-explorer-api-client";
import { shit_1170_code_block_fun } from "./code_block";
import type { FASTFS_FILE_INFO } from "@sleet-js/fastnear-explorer-api-client";
// ========================================
// ========================================
// --- CONSTANTS -------------------------
// how many characters of a text file's content are shown.
//
// --- WHY A LIMIT: a text file can be a megabyte, and a card with a
// megabyte of text in it is not a card — it is the page. the limit
// keeps the preview readable, and the size is shown right beside it, so
// the reader knows how much of the file there is.
const SHIT_1170_FASTFS_TEXT_PREVIEW_LIMIT = 2000;

// how many bytes of a text file are read for the preview.
//
// --- WHY A BYTE LIMIT AND NOT A CHARACTER LIMIT ON THE SOURCE: the
// limit is on the BYTES, because a byte is what the file is. a
// multi-byte character cut in half would put a broken glyph in the
// preview, so the bytes are cut on a character boundary afterwards.
const SHIT_1170_FASTFS_TEXT_PREVIEW_BYTES = 4000;
// ========================================
// ========================================
// --- HELPERS ----------------------------
// the size of a file, in the units a reader thinks in.
//
// --- WHY THE UNITS ARE CHOSEN BY THE SIZE: a file of a few hundred
// bytes reads better in bytes, and a file of a few megabytes reads
// better in kilobytes or megabytes. one number in bytes would make the
// reader count zeroes.
export function size_text_fun(bytes: number): string {
  if (bytes < 1024) return `${bytes} BYTES`;
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// the text of a text file, cut to a readable length.
//
// --- WHY THE CUT IS ON A CHARACTER BOUNDARY: the bytes are cut first,
// because that is the file. a multi-byte character cut in half would
// show as a broken glyph, so the cut bytes are decoded and the last
// character is dropped if it is a partial one.
function text_preview_fun(content: Uint8Array): {
  text: string;
  truncated: boolean;
} {
  const shown =
    content.length > SHIT_1170_FASTFS_TEXT_PREVIEW_BYTES
      ? content.slice(0, SHIT_1170_FASTFS_TEXT_PREVIEW_BYTES)
      : content;
  const decoder = new TextDecoder("utf-8", { fatal: false });
  let text = decoder.decode(shown);
  // --- WHY THE REPLACEMENT CHARACTER IS CHECKED FOR: a truncated
  // multi-byte character decodes to the replacement character, and
  // showing one is showing a broken character.
  if (text.endsWith("�")) text = text.slice(0, -1);
  const truncated =
    content.length > SHIT_1170_FASTFS_TEXT_PREVIEW_BYTES ||
    text.length > SHIT_1170_FASTFS_TEXT_PREVIEW_LIMIT;
  if (text.length > SHIT_1170_FASTFS_TEXT_PREVIEW_LIMIT) {
    text = text.slice(0, SHIT_1170_FASTFS_TEXT_PREVIEW_LIMIT);
  }
  return { text, truncated };
}
// ========================================
// ========================================
// --- PREVIEW ----------------------------
// the preview of the file, when its type allows one.
//
// --- WHY A QUEUED UPLOAD GETS NO IMAGE AND NO VIDEO: the file is
// served by the indexer, and the indexer only knows about a file once
// its transaction is on chain. a queued upload is not on chain, so the
// url has nothing at it. the card says so instead of showing a broken
// picture.
function preview_fun(
  info: FASTFS_FILE_INFO,
  url: string,
  is_on_chain: boolean,
): preact.JSX.Element | null {
  const kind = fastfs_can_display_fun(info.mime_type);
  if (kind === null) return null;

  if (kind === "text") {
    const preview = text_preview_fun(info.content);
    return (
      <div class="fastfs-preview is-text">
        {shit_1170_code_block_fun({ code: preview.text })}
        {preview.truncated && (
          <span class="fastfs-preview-truncated">
            TRUNCATED — THE FILE IS {size_text_fun(info.content.length)}
          </span>
        )}
      </div>
    );
  }

  if (!is_on_chain) {
    return (
      <div class="fastfs-preview is-unavailable">
        <span class="fastfs-preview-note">
          NO {kind.toUpperCase()} PREVIEW YET — THE FILE IS NOT ON CHAIN, SO
          THERE IS NOTHING AT THE LINK YET
        </span>
      </div>
    );
  }

  // --- WHY --- AN EMPTY URL SHOWS NO PICTURE: the url is built from the
  // predecessor, and without one there is no file to point at. an `<img>`
  // with an empty source is a broken picture, and a broken picture says
  // less than a sentence.
  if (url === "") {
    return (
      <div class="fastfs-preview is-unavailable">
        <span class="fastfs-preview-note">
          NO {kind.toUpperCase()} PREVIEW — THE FILE IS SERVED UNDER THE
          ACCOUNT THAT SIGNED THE UPLOAD, AND THERE IS NONE
        </span>
      </div>
    );
  }

  if (kind === "image") {
    return (
      <div class="fastfs-preview is-image">
        <img class="fastfs-image" src={url} alt={info.relative_path} />
      </div>
    );
  }

  return (
    <div class="fastfs-preview is-video">
      {/* --- WHY THE CONTROLS ARE ON: a video the reader cannot pause
          or scrub is a thing that plays at them. */}
      <video class="fastfs-video" src={url} controls={true} />
    </div>
  );
}
// ========================================
// ========================================
// --- CARD -------------------------------
// the FastFS card: the file, the link, the preview, the notes.
export function FASTFS_CARD_FUN(props: {
  info: FASTFS_FILE_INFO;
  predecessor: string;
  receiver: string;
  // true when the upload is on chain — a transaction that already
  // happened. false for a queued upload, which is not signed yet.
  is_on_chain: boolean;
}): preact.JSX.Element {
  const info = props.info;
  // --- WHY --- THE LINK IS ONLY BUILT WHEN THERE IS A PREDECESSOR: the
  // predecessor is the HOST of the serving url, so without it the url
  // is `https://.fastfs.io/...` — a link to nothing, dressed up as a
  // link. a queued batch with no accounts on it has no signer yet, and
  // the card says so.
  const has_predecessor = props.predecessor !== "";
  const url = has_predecessor
    ? fastfs_file_url_fun(props.predecessor, props.receiver, info.relative_path)
    : "";
  const uri = has_predecessor
    ? fastfs_file_uri_fun(props.predecessor, props.receiver, info.relative_path)
    : "";
  const problems = fastfs_validate_fun(info);

  return (
    <div class="fastfs-card">
      <div class="fastfs-head">
        <span class="fastfs-label">FASTFS UPLOAD</span>
        <span class="fastfs-kind">
          {info.kind === "partial" ? "PARTIAL" : info.is_delete ? "DELETE" : "SIMPLE"}
        </span>
      </div>
      <div class="fastfs-path">{info.relative_path}</div>
      <div class="fastfs-facts">
        <span class="fastfs-fact">
          <span class="fastfs-fact-label">TYPE</span>
          <span class="fastfs-fact-value">
            {info.mime_type === "" ? "—" : info.mime_type}
          </span>
        </span>
        {info.kind === "partial" ? (
          // --- WHY THE CHUNK AND THE FILE ARE TWO NUMBERS AND NOT ONE:
          // a partial upload carries a piece of a file, and the piece
          // and the whole are different sizes. a reader who sees one
          // number has to guess which it is.
          <>
            <span class="fastfs-fact">
              <span class="fastfs-fact-label">CHUNK</span>
              <span class="fastfs-fact-value">{size_text_fun(info.size)}</span>
            </span>
            <span class="fastfs-fact">
              <span class="fastfs-fact-label">FILE</span>
              <span class="fastfs-fact-value">
                {size_text_fun(info.total_size)}
              </span>
            </span>
            <span class="fastfs-fact">
              <span class="fastfs-fact-label">OFFSET</span>
              <span class="fastfs-fact-value">{info.offset}</span>
            </span>
            <span class="fastfs-fact">
              <span class="fastfs-fact-label">NONCE</span>
              <span class="fastfs-fact-value">{info.nonce}</span>
            </span>
          </>
        ) : (
          <span class="fastfs-fact">
            <span class="fastfs-fact-label">SIZE</span>
            <span class="fastfs-fact-value">{size_text_fun(info.size)}</span>
          </span>
        )}
      </div>
      {has_predecessor ? (
        <div class="fastfs-links">
          <a class="fastfs-url" href={url}>
            {url}
          </a>
          <span class="fastfs-uri">{uri}</span>
        </div>
      ) : (
        <div class="fastfs-links is-unknown">
          <span class="fastfs-note">
            NO LINK YET — THE FILE IS SERVED UNDER THE ACCOUNT THAT SIGNS
            THE UPLOAD, AND NOBODY HAS SIGNED IT
          </span>
        </div>
      )}
      {props.is_on_chain ? (
        <div class="fastfs-note is-live">
          THE FILE IS SERVED FROM THE LINK ABOVE — THE INDEXER PICKED IT UP
          FROM THE TRANSACTION
        </div>
      ) : (
        <div class="fastfs-note is-queued">
          THE LINK DOES NOT WORK YET — THE FILE IS NOT INDEXED UNTIL THIS
          IS SIGNED AND THE INDEXER CATCHES UP
        </div>
      )}
      {preview_fun(info, url, props.is_on_chain)}
      {problems.length > 0 && (
        <div class="fastfs-problems">
          <span class="fastfs-problems-label">
            THE INDEXER WILL DROP THIS — {problems.length} PROBLEM
            {problems.length === 1 ? "" : "S"}
          </span>
          <ul class="fastfs-problems-list">
            {problems.map((problem) => (
              <li key={problem}>{problem}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
// ========================================
// ========================================
// --- PUBLIC -----------------------------
// the FastFS card, for a call that IS a FastFS upload.
//
// --- WHY THE BASE64 IS TAKEN AND NOT THE BYTES: the caller has the
// arguments as the base64 string the chain and the queue carry, and the
// card turns them into bytes with the client's own lossless base64
// decoder. the borsh rules live in the client, so the decode happens
// in ONE place, next to the rules about what a decoded upload means.
//
// --- WHY THE LOSSLESS DECODER AND NOT THE TEXT ONE: the arguments
// decoder the pages already use decodes the base64 to utf-8 TEXT and
// re-encodes it, and that round trip is lossy for anything that is
// not valid utf-8 — a png is not utf-8, and its bytes come back
// changed and longer. the file's bytes must survive the decode
// untouched, so the raw decoder is the one that is used.
//
// --- WHY A NULL IS RETURNED AND NOT A THROWN ERROR: a payload that is
// not FastFS borsh gives null, and the caller then renders the bytes as
// hex, which is what it does today. a decoder that throws would take
// down a transaction page.
export function shit_1170_fastfs_card_fun(props: {
  // the arguments of the call, as the base64 string the chain and the
  // queue carry them in.
  args_base64: string;
  // the method the call was made by.
  method_name: string;
  // the account that SIGNED — the receipt's predecessor. for a queued
  // upload it is the account the queue is for.
  predecessor: string;
  // the account the call was made to.
  receiver: string;
  // true when the upload is on chain — a transaction that already
  // happened. false for a queued upload, which is not signed yet.
  is_on_chain: boolean;
}): preact.JSX.Element | null {
  // --- WHY THE METHOD IS CHECKED FIRST: the bytes of any call could
  // decode as FastFS borsh by accident, and a card about a file would
  // be a lie. the method name is what says this IS a FastFS call.
  if (!fastfs_is_call_fun(props.method_name)) return null;
  const bytes = decode_base64_bytes_raw(props.args_base64);
  if (bytes === null) return null;
  const info = fastfs_decode_fun(bytes);
  if (info === null) return null;
  return (
    <FASTFS_CARD_FUN
      info={info}
      predecessor={props.predecessor}
      receiver={props.receiver}
      is_on_chain={props.is_on_chain}
    />
  );
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
