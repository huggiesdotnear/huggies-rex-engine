// =====================
// trader.js
// =====================
fetch(`/api/trader/${encodeURIComponent(TRADER_ID)}`).then(r => r.json()).then(v => {
    document.getElementById('trader-account').textContent = v.account_id;
    document.getElementById('trader-near').textContent = v.near_balance_yocto;
    const body = document.getElementById('trader-deposits-body');
    for (const d of v.deposits) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><a href="/pool/${d.pool_id}">${d.pool_id}</a></td>
            <td><a href="/token/${encodeURIComponent(d.token_id)}">${d.token_id}</a></td>
            <td>${d.shares}</td>`;
        body.appendChild(tr);
    }
}).catch(e => {
    document.getElementById('trader-account').textContent = 'error: ' + e.message;
});
// =====================
// copyright 2026 by sleet.near