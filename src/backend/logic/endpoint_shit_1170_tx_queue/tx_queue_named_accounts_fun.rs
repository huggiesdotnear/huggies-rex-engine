// ========================================
// TX_QUEUE_NAMED_ACCOUNTS_FUN
// the NAMING RULE: the accounts an agent is allowed to name on a queue.
//
// --- WHY --- this is its own file: the naming rule is a check over a
// LIST, and it is the rule that stops one agent spamming another
// agent's users. the rule lives in one place so it cannot be written two
// ways.
//
// --- WHY --- the rule is what it is: the WHO list is what puts a tx in
// somebody's feed. if an agent could name any account id it liked, agent
// A could fill agent B's users' feeds with txs they never asked for —
// and the ui filters by account, so those users would keep seeing them.
// so the agent's WHO list is its OWN users, and only its own users.
//
// --- WHY --- the check is "does `api_keys` have a row for that account":
// the api_keys table IS the record of the keys that were issued, and an
// agent holds the key it was given. so a row in it is the agent saying
// "this account is mine".
//
// --- WHY --- the SIGNING rule is still open: the queue is an open offer.
// a user who sees a tx may send it, and their account joins the WHO list.
// that is a user acting for themselves with their own key — no agent is
// putting it in front of them, they found it and chose it.
use sqlx::SqlitePool;
// ========================================
// --- NAMED ACCOUNTS --------------------
// the accounts from `wanted` that the agent holds an api key for.
//
// --- WHY --- it returns the ALLOWED ones and not a yes or a no: the
// caller has to be able to say WHICH account was refused, so the answer
// has to name the accounts.
//
// --- WHY --- the caller compares the LENGTHS: a result shorter than
// `wanted` means at least one account was refused, and the route refuses
// the WHOLE request. naming one account you may not name would still
// put a tx in somebody's feed.
//
// --- WHY --- the result keeps the ORDER of `wanted`: the caller echoes
// the list it was given, and the order of the WHO list is the order the
// agent wrote it in.
//
// --- WHY --- a duplicate in `wanted` is allowed and appears twice: the
// agent wrote it twice, and the row it makes is the same row. the
// primary key says so.
pub async fn tx_queue_named_accounts_fun(
    pool: &SqlitePool,
    agent_account_id: &str,
    wanted: &[String],
) -> Result<Vec<String>, sqlx::Error> {
    let mut allowed: Vec<String> = Vec::new();

    for account_id in wanted {
        // --- WHY --- the agent's OWN account is always allowed: the agent
        // holds its own key by definition — it is the account the key
        // belongs to.
        if account_id == agent_account_id {
            allowed.push(account_id.clone());
            continue;
        }

        let found: (i64,) = sqlx::query_as(
            "SELECT EXISTS(
               SELECT 1 FROM api_keys
                WHERE account_id = ?1)",
        )
        .bind(account_id)
        .fetch_one(pool)
        .await?;

        if found.0 != 0 {
            allowed.push(account_id.clone());
        }
    }

    Ok(allowed)
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
