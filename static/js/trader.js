// =====================
// trader.js
// =====================
const NEAR_DECIMALS = 24;
const tokenMeta = new Map();
const poolMeta = new Map();

function fmtAmount(raw, decimals) {
    if (raw == null) return '—';
    if (!decimals || decimals === 0) return raw;
    try {
        const big = BigInt(raw);
        const denom = 10n ** BigInt(decimals);
        const whole = big / denom;
        const frac = big % denom;
        if (frac === 0n) return whole.toString();
        const fracStr = frac.toString().padStart(decimals, '0').replace(/0+$/, '');
        return fracStr ? `${whole}.${fracStr}` : whole.toString();
    } catch (e) {
        return raw;
    }
}

async function loadMeta() {
    const [tokens, pools] = await Promise.all([
        fetch('/api/tokens').then(r => r.json()).catch(() => []),
        fetch('/api/pools').then(r => r.json()).catch(() => []),
    ]);
    for (const t of tokens) tokenMeta.set(t.account_id, t);
    for (const p of pools) poolMeta.set(String(p.pool_id), p);
}

function shortAccount(acc) {
    if (!acc) return '';
    if (acc.length <= 18) return acc;
    return acc.slice(0, 9) + '…' + acc.slice(-6);
}

(async function () {
    await loadMeta();
    fetch(`/api/trader/${encodeURIComponent(TRADER_ID)}`)
        .then(r => r.json())
        .then(v => {
            document.getElementById('trader-account').textContent = v.account_id;
            document.getElementById('trader-near').textContent =
                `${fmtAmount(v.near_balance_yocto, NEAR_DECIMALS)} NEAR`;
            const body = document.getElementById('trader-deposits-body');
            document.getElementById('trader-deposits-count').textContent = v.deposits.length;
            for (const d of v.deposits) {
                // The values are NEP-141 token balances — use the
                // decimals the server sent (from the price-indexer).
                const human = fmtAmount(d.shares.raw, d.shares.decimals);
                const grouped = d.shares.raw.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                const sym = d.shares.symbol || shortAccount(d.token_id);
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${d.pool_id > 0 ? `<a href="/pool/${d.pool_id}">#${d.pool_id}</a>` : '—'}</td>
                    <td><a href="/token/${encodeURIComponent(d.token_id)}">${shortAccount(d.token_id)}</a></td>
                    <td><strong>${human}</strong> <span style="color:var(--huggies-rex-color-00c6d7)">${sym}</span>
                        <br><small style="color:var(--huggies-rex-color-474747)">raw: ${grouped}${d.shares.decimals == null ? '' : ` &middot; ${d.shares.decimals} decimals`}</small></td>`;
                body.appendChild(tr);
            }
            if (v.deposits.length === 0) {
                const tr = document.createElement('tr');
                tr.innerHTML = `<td colspan="3"><em>no rhea LP deposits found for this account.</em></td>`;
                body.appendChild(tr);
            }
        })
        .catch(e => {
            document.getElementById('trader-account').textContent = 'error: ' + e.message;
        });
})();
// =====================
// copyright 2026 by sleet.near