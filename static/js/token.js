// =====================
// token.js
// =====================
fetch(`/api/token/${encodeURIComponent(TOKEN_ID)}`).then(r => r.json()).then(t => {
    document.getElementById('token-symbol').textContent = t.symbol;
    document.getElementById('token-account').textContent = t.account_id;
    document.getElementById('token-decimals').textContent = t.decimals;
    document.getElementById('token-price').textContent = t.price_usd ?? '—';
}).catch(e => {
    document.getElementById('token-symbol').textContent = 'error: ' + e.message;
});

fetch(`/api/token/${encodeURIComponent(TOKEN_ID)}/pools`).then(r => r.json()).then(pools => {
    const body = document.getElementById('token-pools-body');
    for (const p of pools) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><a href="/pool/${p.pool_id}">${p.pool_id}</a></td>
            <td>${p.pool_kind}</td>
            <td>${p.token_account_ids.map(t => `<a href="/token/${t}">${t}</a>`).join(' / ')}</td>
            <td>${p.total_fee}</td>`;
        body.appendChild(tr);
    }
});
// =====================
// copyright 2026 by sleet.near