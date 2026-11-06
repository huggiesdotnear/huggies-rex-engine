// ========================================
// the queue page's files widget: the FastFS uploads the batch asks for —
// the files it will put up.
//
// a FastFS upload is a function call to `__fastdata_fastfs` whose
// arguments are RAW BORSH BYTES. the queue carries those bytes as
// base64, and the fastnear client's parser decodes them, so this widget
// reads the upload off the call and shows it.
//
// --- WHY --- IT IS A WIDGET AND NOT A SECTION OF THE PAGE: a file is
// ONE kind of thing the batch asks for, and it stands beside the
// transfers rather than inside the calls. the widget says whether it
// applies, and the page says where it sits.
//
// --- WHY --- THE FILES ARE THEIR OWN WIDGET AND NOT A CARD IN THE CALLS
// LIST: the tx page keeps a protocol's own detail in its own widget,
// beside the transfers, and the raw action list stays raw. a file is
// what the batch will DO — it belongs with the transfers, in the place
// the reader looks for what will happen — and buried in a wall of hex
// arguments it is the one thing the reader came for, lost.
//
// --- WHY --- ONE ROW PER UPLOAD, LIKE THE TRANSFERS: the transfers
// section has one row per transfer and this has one row per upload. the
// same question — what will this batch move — and the same answer shape.
//
// --- WHY --- THE ROW IS A SENTENCE AND NOT A LIST OF FIELDS: the row
// says who will put up WHAT and WHERE it will be served — the mime and
// the byte count are the detail beside that, not the headline.
//
// --- WHY --- THE CARD IS UNDER THE ROW: the row says what will happen
// and the card says what the bytes MEAN — the file's facts, the link,
// the preview and the indexer's complaints. the card is the detail of
// the row, and a detail sits under its row.
//
// --- WHY --- THE CARD IS NOT ON-CHAIN: the batch is queued. nobody has
// signed it, so the file is not indexed and its url has nothing at it.
// the card says so, and that is the truth about a queued upload.
//
// it reads the loaded batch from the page's store. it fetches nothing.
import { render } from "preact";
import { FileUp, Image as ImageIcon, Film, Trash } from "lucide-preact";
import {
  decode_base64_bytes_raw,
  fastfs_decode_fun,
  fastfs_is_call_fun,
} from "@sleet-js/fastnear-explorer-api-client";
import { SHIT_1170_MOUNT_ID } from "../../../ts/shared/mount_ids";
import { SHIT_1170_APP_PAGE_QUEUE_STORE } from "../../../ts/queue/app_page_queue_store";
import { use_page_store_fun } from "../../../ts/shared/use_page_store";
import { current_app_depth_fun } from "../../../ts/shared/app_depth";
import { SHIT_1170_AUTH } from "../../../ts/shared/auth_status";
import {
  fastfs_card_fun,
  size_text_fun,
} from "../../shared/app_page_fastfs_card";
import { SHIT_1170_QUEUE_WIDGETS } from "./queue_widgets";
import type { FASTFS_FILE_INFO } from "@sleet-js/fastnear-explorer-api-client";
import type { SHIT_1170_TX_QUEUE } from "@huggies/shit-1170-rex-engine-middleman";
// ========================================
// ========================================
// --- TYPES ------------------------------
// one upload, read out of a queued call.
interface QUEUE_FASTFS_UPLOAD {
  // the file's facts, decoded from the call's bytes.
  info: FASTFS_FILE_INFO;
  // the contract the upload is made to — the file's namespace.
  receiver: string;
}
// ========================================
// ========================================
// --- HELPERS ----------------------------
// the account link for an account id.
//
// --- WHY --- the depth is asked for here and not baked in: the page
// can sit at any depth under /app/, and a link built for the wrong
// depth lands on a page that does not exist.
function account_href_fun(account_id: string): string {
  const depth = current_app_depth_fun();
  return `${"../".repeat(depth)}account.html?id=${encodeURIComponent(account_id)}`;
}

// the account the batch is FOR — the one that will sign it, and so the
// predecessor of any FastFS file in it.
//
// --- WHY THE FIRST ACCOUNT OF THE BATCH AND NOT THE READER: the
// predecessor of a FastFS file is the account that SIGNS the upload,
// and the batch is queued for a set of accounts. the reader may be
// looking at a batch that is not theirs, and the reader's account may
// not be on it at all.
//
// --- WHY THE READER IS THE FALLBACK: a batch with no accounts on it
// is a batch nobody has picked up yet, and the reader looking at it is
// the one who will most likely sign it.
//
// --- WHY THE EMPTY STRING IS THE LAST FALLBACK: a file with no
// predecessor has no url to show, and a url with an empty host is worse
// than no url. the row says what it can.
function predecessor_fun(queue: SHIT_1170_TX_QUEUE): string {
  const first = queue.accounts[0];
  if (first !== undefined) return first.accountId;
  const reader = SHIT_1170_AUTH.get_account_id();
  return reader ?? "";
}

// one upload, read out of a queued call.
//
// --- WHY --- THE BYTES ARE DECODED HERE AND NOT BY THE CARD: the card
// is given the DECODED file, and the row needs the file's facts — the
// path, the mime and the size — to be built. so the decode happens
// once, here, and both the row and the card are given the result. the
// decode is the client's own, so the two pages read the same bytes the
// same way.
//
// --- WHY --- A CALL THAT IS NOT A FASTFS UPLOAD GIVES NO FILE: the
// method name is what says this IS a FastFS call, and the bytes of any
// call could decode as FastFS borsh by accident.
function upload_of_fun(transaction: {
  method: string;
  argsBase64: string | null;
  contractId: string;
}): QUEUE_FASTFS_UPLOAD | null {
  if (!fastfs_is_call_fun(transaction.method.trim())) return null;
  const args_base64 = transaction.argsBase64;
  if (args_base64 === null || args_base64 === undefined) return null;
  const bytes = decode_base64_bytes_raw(args_base64);
  if (bytes === null) return null;
  const info = fastfs_decode_fun(bytes);
  if (info === null) return null;
  return {
    info,
    receiver: transaction.contractId,
  };
}
// ========================================
// ========================================
// --- ICON ------------------------------
// the icon of an upload, chosen by what the upload does.
//
// --- WHY --- AN ICON AND NOT THE WORD EVERY TIME: the explorer puts an
// icon at the head of every widget card, and the icon says at a glance
// what kind of thing this is — a file up, a picture, a video, a
// delete. the word is still there beside it, for a reader who does not
// know the icons.
function upload_icon_fun(info: FASTFS_FILE_INFO): preact.JSX.Element {
  if (info.is_delete) {
    return <Trash size={16} class="queue-fastfs-icon is-delete" />;
  }
  if (info.mime_type.startsWith("image/")) {
    return <ImageIcon size={16} class="queue-fastfs-icon is-image" />;
  }
  if (info.mime_type.startsWith("video/")) {
    return <Film size={16} class="queue-fastfs-icon is-video" />;
  }
  return <FileUp size={16} class="queue-fastfs-icon is-file" />;
}
// ========================================
// ========================================
// --- ROW --------------------------------
// one upload: who will put it up, what it is, where it will be served,
// and the card that says what the bytes mean.
function upload_fun(
  upload: QUEUE_FASTFS_UPLOAD,
  signer_id: string,
): preact.JSX.Element {
  const info = upload.info;

  return (
    <div class="queue-fastfs-upload">
      <div class="queue-fastfs-line">
        {upload_icon_fun(info)}
        {signer_id !== "" && (
          <a class="queue-fastfs-account" href={account_href_fun(signer_id)}>
            {signer_id}
          </a>
        )}
        <span class="queue-fastfs-verb">
          {info.is_delete
            ? "will delete"
            : info.kind === "partial"
              ? "will upload a chunk of"
              : "will upload"}
        </span>
        <span class="queue-fastfs-file">{info.relative_path}</span>
        {info.mime_type !== "" && (
          <span class="queue-fastfs-type">{info.mime_type}</span>
        )}
        <span class="queue-fastfs-size">
          {info.kind === "partial"
            ? `${size_text_fun(info.size)} OF ${size_text_fun(info.total_size)}`
            : size_text_fun(info.size)}
        </span>
      </div>
      {/* --- WHY --- THE URL IS NOT IN THE ROW: the card below shows the
          serving link, and the row is the one-line summary. a url in
          both places is the same link twice on one screen, and the
          reader has to work out whether they are the same link or two.
          the card also says the link does not work until the batch is
          signed, and the row does not need to say it twice. */}
      {fastfs_card_fun({
        info,
        predecessor: signer_id,
        receiver: upload.receiver,
        // --- WHY IT IS NOT ON CHAIN: the batch is queued. nobody has
        // signed it yet, so the file is not indexed and its url has
        // nothing at it.
        is_on_chain: false,
      })}
    </div>
  );
}
// ========================================
// ========================================
// --- COMPONENT --------------------------
export function SHIT_1170_COMPONENT_QUEUE_WIDGET_FASTFS_FUN() {
  const state = use_page_store_fun(SHIT_1170_APP_PAGE_QUEUE_STORE);
  const queue = state.queue;
  if (queue === null) return null;
  // --- WHY --- THE REGISTRY DECIDES: this widget applies when the
  // batch uploads a file, and the registry is where that is written
  // down. the widget does not carry its own rule, so there is ONE place
  // that says which widgets apply to a batch.
  if (!SHIT_1170_QUEUE_WIDGETS.applies("fastfs", queue)) return null;
  // the uploads in the batch, in the order of the batch.
  const uploads: QUEUE_FASTFS_UPLOAD[] = [];
  for (const transaction of queue.transactions) {
    const upload = upload_of_fun(transaction);
    if (upload === null) continue;
    uploads.push(upload);
  }
  // a batch that uploads nothing has no files section.
  if (uploads.length === 0) return null;
  // the account that will sign — the batch's own first account.
  const signer_id = predecessor_fun(queue);

  return (
    <section class="queue-fastfs">
      <h2>FILES ({uploads.length})</h2>
      <div class="queue-fastfs-list">
        {uploads.map((upload, index) => (
          <div key={`fastfs-${index}`}>
            {upload_fun(upload, signer_id)}
          </div>
        ))}
      </div>
    </section>
  );
}
// ========================================
// ========================================
// --- MOUNT ------------------------------
// self-mount guarded by id check.
//
// --- WHY --- THE MOUNT ID IS THE PAGE'S: the page's divs and their
// order are the page's layout, and a widget does not move the page's
// layout around. the id is the page's, and the widget answers to it.
const SELF_MOUNT_ID = SHIT_1170_MOUNT_ID.SHIT_1170_COMPONENT_QUEUE_FASTFS;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) render(<SHIT_1170_COMPONENT_QUEUE_WIDGET_FASTFS_FUN />, el);
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
