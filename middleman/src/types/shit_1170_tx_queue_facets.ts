// ========================================
// SHIT_1170_TX_QUEUE_FACETS
// the shapes of the facets route, under /api/shit-1170/tx-queue/facets.
//
// the facets are the CONTRACTS and the ACCOUNTS that have queued work.
// the feed's filter bar builds its buttons from them, and it cannot
// show a button for something that is not there.
//
// --- WHY --- the fields are camelCase: they mirror the browser's own
// session object (`accountId`) and the rest of the tx queue shapes, so
// nothing is renamed on the way.
//
// --- WHY --- the counts are NUMBERS and not strings: a count is a
// number on the wire and a string would make every reader parse it
// again.
// ========================================

// one contract in the facet list.
export interface SHIT_1170_TX_QUEUE_FACET_CONTRACT {
  // the contract.
  contractId: string;
  // how many queued transactions call it.
  count: number;
}

// one account in the facet list.
export interface SHIT_1170_TX_QUEUE_FACET_ACCOUNT {
  // the account.
  accountId: string;
  // how many queued batches it is on.
  count: number;
}

// the answer of the facets route.
//
// --- WHY --- the two lists are SEPARATE and not one list of a kind:
// a contract and an account are different things, and blending them
// into one array would make the reader guess what each row is.
export interface SHIT_1170_TX_QUEUE_FACETS {
  // the contracts that have queued transactions.
  contracts: SHIT_1170_TX_QUEUE_FACET_CONTRACT[];
  // the accounts that have queued transactions.
  accounts: SHIT_1170_TX_QUEUE_FACET_ACCOUNT[];
}
// ========================================
// copyright 2026 by sleet.near
