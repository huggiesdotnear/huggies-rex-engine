// ========================================
// the queue page's shapes: the batch it shows and the state it holds.
//
// --- WHY THE PAGE'S TYPES LIVE HERE: the store, the loader, the url
// and the components all speak about the same batch, and one file
// holds the shape of it so none of them imports another.
import type { SHIT_1170_TX_QUEUE } from "@huggies/shit-1170-rex-engine-middleman";
// ========================================
// ========================================
// --- TYPES ------------------------------
// the whole state of the queue page.
export interface SHIT_1170_APP_PAGE_QUEUE_STATE {
  // the batch on screen, or null while it is loading.
  queue: SHIT_1170_TX_QUEUE | null;
  // true while a load is running.
  loading: boolean;
  // the message for the reader, when something failed.
  error: string | null;
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
