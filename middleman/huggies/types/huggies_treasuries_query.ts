// ========================================
// HUGGIES_TREASURIES_QUERY
// the params our /api/huggies/treasuries route takes: the account to
// look up and whether hidden treasuries come back too.
// ========================================

export interface HUGGIES_TREASURIES_QUERY {
  accountId: string;
  includeHidden?: boolean;
}
// ========================================
// copyright 2026 by sleet.near
