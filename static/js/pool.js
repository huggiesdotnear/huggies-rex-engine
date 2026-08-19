// =====================
// pool.js
// =====================
fetch(`/api/pool/${POOL_ID}`).then(r => r.json()).then(p => {
    document.getElementById('pool-kind').textContent = p.pool_kind;
    document.getElementById('pool-tokens').innerHTML =
        p.token_account_ids.map(t => `<a href="/token/${t}">${t}</a>`).join(' / ');
    document.getElementById('pool-amounts').textContent = p.amounts.join(' / ');
    document.getElementById('pool-fee').textContent = p.total_fee;
    document.getElementById('pool-shares').textContent = p.shares_total_supply;
}).catch(e => {
    document.getElementById('pool-kind').textContent = 'error: ' + e.message;
});
// =====================
// copyright 2026 by sleet.near