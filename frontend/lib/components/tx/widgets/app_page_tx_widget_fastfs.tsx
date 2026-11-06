// ========================================
// the files widget: the transaction's FastFS uploads — the files it put
// up.
//
// a FastFS upload is a function call to `__fastdata_fastfs` whose
// arguments are RAW BORSH BYTES. the fastnear client's parser decodes
// them and hangs the file on the action, so this widget reads the
// upload off the action and shows it.
//
// --- WHY --- IT IS A WIDGET AND NOT A SECTION OF THE PAGE: a file is
// ONE kind of thing the transaction did, and it stands beside the
// transfers rather than inside them. the widget says whether it
// applies, and the page says where it sits.
//
// --- WHY --- THE UPLOADS ARE THEIR OWN WIDGET AND NOT A BLOCK IN THE
// ACTIONS LIST: the fastnear explorer keeps a protocol's own detail in
// its own widget, beside the transfers and above the receipts, and the
// raw action list stays raw. a file is what the transaction DID — it
// belongs with the transfers, in the place the reader looks for what
// happened — and buried in a wall of base64 arguments it is the one
// thing the reader came for, lost.
//
// --- WHY --- ONE ROW PER UPLOAD, LIKE THE TRANSFERS: the transfers
// section has one row per transfer and this has one row per upload.
// the same question — what did this transaction move — and the same
// answer shape.
//
// --- WHY --- THE ROW IS A SENTENCE AND NOT A LIST OF FIELDS: the
// explorer's transfer widgets read "alice transferred 1.5 USDC to bob",
// and the file's details are linked rather than dumped. a reader wants
// to know WHO put up WHAT and WHERE it is served — the mime and the
// byte count are the detail beside that, not the headline.
//
// --- WHY --- THE PREVIEW IS UNDER THE ROW AND NOT IN IT: the preview
// is a picture or a video, and a picture inside a one-line sentence
// breaks the line. the row says what happened; the preview shows the
// file.
//
// --- WHY --- THE CARD IS THE SHARED ONE AND NOT A COPY: the queue
// page's files widget shows the same card, and the card's own rules —
// what a preview needs, what the link means, what the indexer will
// drop — are the same on both. one card, in the shared folder, and the
// two pages hand it what they know. this page's upload IS on chain, so
// the card is told so, and it renders the live preview.
//
// --- WHY --- THE ACCOUNT LINKS: the uploader is the account that
// SIGNED — the receipt's predecessor — and it is the account the file
// is served under. a reader who wants the account goes to the account.
//
// it reads the loaded transaction from the page's store. it fetches
// nothing.
import { render } from "preact";
import { FileUp, Image as ImageIcon, Film, Trash } from "lucide-preact";
import { SHIT_1170_MOUNT_ID } from "../../../ts/shared/mount_ids";
import { SHIT_1170_APP_PAGE_TX_STORE } from "../../../ts/tx/app_page_tx_store";
import { use_page_store_fun } from "../../../ts/shared/use_page_store";
import { current_app_depth_fun } from "../../../ts/shared/app_depth";
import {
  fastfs_card_fun,
  size_text_fun,
} from "../../shared/app_page_fastfs_card";
import { SHIT_1170_TX_WIDGETS } from "./tx_widgets";
import type {
  FASTFS_FILE_INFO,
  PARSED_ACTION,
} from "@sleet-js/fastnear-explorer-api-client";
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
// ========================================
// ========================================
// --- ICON ------------------------------
// the icon of an upload, chosen by what the upload did.
//
// --- WHY --- AN ICON AND NOT THE WORD EVERY TIME: the explorer puts an
// icon at the head of every widget card, and the icon says at a glance
// what kind of thing this is — a file up, a picture, a video, a
// delete. the word is still there beside it, for a reader who does not
// know the icons.
function upload_icon_fun(info: FASTFS_FILE_INFO): preact.JSX.Element {
  if (info.is_delete) {
    return <Trash size={16} class="tx-fastfs-icon is-delete" />;
  }
  if (info.mime_type.startsWith("image/")) {
    return <ImageIcon size={16} class="tx-fastfs-icon is-image" />;
  }
  if (info.mime_type.startsWith("video/")) {
    return <Film size={16} class="tx-fastfs-icon is-video" />;
  }
  return <FileUp size={16} class="tx-fastfs-icon is-file" />;
}
// ========================================
// ========================================
// --- ROW --------------------------------
// one upload: who put it up, what it is, where it is served, and the
// card that says what the bytes mean.
function upload_fun(
  action: PARSED_ACTION,
  signer_id: string,
  receiver_id: string,
): preact.JSX.Element {
  const info = action.fastfs;
  // --- WHY --- THE NULL IS GUARDED: the action carries a FastFS upload
  // only when the parser decoded one, and the section only asks for
  // the actions that have one. the guard is here so a future change
  // cannot render a row with nothing in it.
  if (info === undefined) return <></>;

  return (
    <div class="tx-fastfs-upload">
      <div class="tx-fastfs-line">
        {upload_icon_fun(info)}
        <a class="tx-fastfs-account" href={account_href_fun(signer_id)}>
          {signer_id}
        </a>
        <span class="tx-fastfs-verb">
          {info.is_delete
            ? "deleted"
            : info.kind === "partial"
              ? "uploaded a chunk of"
              : "uploaded"}
        </span>
        <span class="tx-fastfs-file">{info.relative_path}</span>
        {info.mime_type !== "" && (
          <span class="tx-fastfs-type">{info.mime_type}</span>
        )}
        <span class="tx-fastfs-size">
          {info.kind === "partial"
            ? `${size_text_fun(info.size)} OF ${size_text_fun(info.total_size)}`
            : size_text_fun(info.size)}
        </span>
      </div>
      {/* --- WHY --- THE URL IS NOT IN THE ROW: the card below shows
          the serving link and the `fastfs://` uri, and the row is the
          one-line summary. a url in both places is the same link twice
          on one screen, and the reader has to work out whether they
          are the same link or two. */}
      {fastfs_card_fun({
        info,
        predecessor: signer_id,
        receiver: receiver_id,
        // --- WHY IT IS ON CHAIN: the transaction already happened. the
        // indexer has the file, the link works, and the preview renders.
        is_on_chain: true,
      })}
    </div>
  );
}
// ========================================
// ========================================
// --- COMPONENT --------------------------
export function SHIT_1170_COMPONENT_TX_WIDGET_FASTFS_FUN() {
  const state = use_page_store_fun(SHIT_1170_APP_PAGE_TX_STORE);
  const data = state.data;
  // no transaction yet — there is nothing to show.
  if (data === null) return null;
  // --- WHY --- THE REGISTRY DECIDES: this widget applies when the
  // transaction uploaded a file, and the registry is where that is
  // written down. the widget does not carry its own rule, so there is
  // ONE place that says which widgets apply to a transaction.
  if (!SHIT_1170_TX_WIDGETS.applies("fastfs", data.parsed)) return null;
  // the actions that carry a FastFS upload. the parser hangs the
  // decoded file on the call it belongs to, so the uploads are found
  // by looking for that.
  const uploads = data.parsed.actions.filter(
    (action) => action.fastfs !== undefined,
  );
  // a transaction that uploaded nothing has no files section.
  if (uploads.length === 0) return null;
  // the account that signed — the receipt's predecessor. it is the
  // account the file is served under.
  const signer_id = data.parsed.signer_id;
  // the contract the call was made to — the namespace the file is
  // served under. the parser built the url from it too.
  const receiver_id = data.parsed.receiver_id;

  return (
    <section class="tx-fastfs">
      <h2>FILES ({uploads.length})</h2>
      <div class="tx-fastfs-list">
        {uploads.map((action, index) => (
          <div key={`fastfs-${index}`}>
            {upload_fun(action, signer_id, receiver_id)}
          </div>
        ))}
      </div>
    </section>
  );
}
// ========================================
// --- MOUNT ------------------------------
// self-mount guarded by id check.
//
// --- WHY --- THE MOUNT ID DID NOT CHANGE: the page's divs and their
// order are the page's layout, and a widget does not move the page's
// layout around. the id is the page's, and the widget answers to it.
const SELF_MOUNT_ID = SHIT_1170_MOUNT_ID.SHIT_1170_COMPONENT_TX_FASTFS;
if (typeof document !== "undefined") {
  const el = document.getElementById(SELF_MOUNT_ID);
  if (el !== null) render(<SHIT_1170_COMPONENT_TX_WIDGET_FASTFS_FUN />, el);
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
