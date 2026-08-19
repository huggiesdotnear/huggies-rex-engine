// =====================
// trader.js
// =====================
const NEAR_DECIMALS = 24;
const tokenMeta = new Map();

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

function shortAccount(acc) {
    if (!acc) return '';
    if (acc.length <= 18) return acc;
    return acc.slice(0, 9) + '…' + acc.slice(-6);
}

async function loadMeta() {
    const tokens = await fetch('/api/tokens').then(r => r.json()).catch(() => []);
    for (const t of tokens) tokenMeta.set(t.account_id, t);
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
            if (v.deposits.length === 0) {
                const tr = document.createElement('tr');
                tr.innerHTML = `<td colspan="2"><em>no rhea deposits for this account.</em></td>`;
                body.appendChild(tr);
                return;
            }
            for (const d of v.deposits) {
                // rhea's get_deposits returns NEP-141 token balances (the
                // user's escrow balance in each NEP-141 token, summed
                // across every pool that contains it). use the token's
                // actual decimals for display + the token's USD price.
                const meta = tokenMeta.get(d.token_id);
                const dec = d.shares.decimals;
                const human = fmtAmount(d.shares.raw, dec);
                const sym = d.shares.symbol || shortAccount(d.token_id);
                const grouped = d.shares.raw.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                let usdLine = '';
                if (meta && meta.price_usd) {
                    const usd = Number(human) * meta.price_usd;
                    usdLine = usd > 0.01
                        ? `<br><small style="color:var(--huggies-rex-color-00c6d7)">≈ $${usd.toLocaleString('en-US', { maximumFractionDigits: 2 })} USD</small>`
                        : `<br><small style="color:var(--huggies-rex-color-00c6d7)">≈ $${usd.toExponential(2)} USD</small>`;
                }
                const decLabel = dec != null ? ` &middot; ${dec} dec` : '';
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><a href="/token/${encodeURIComponent(d.token_id)}">${sym}</a>
                        <br><small style="color:var(--huggies-rex-color-474747)">${shortAccount(d.token_id)}</small></td>
                    <td><strong>${human}</strong> <span style="color:var(--huggies-rex-color-00c6d7)">${sym}</span>${usdLine}
                        <br><small style="color:var(--huggies-rex-color-474747)">raw: ${grouped}${decLabel}</small></td>
                `;
                body.appendChild(tr);
            }
        })
        .catch(e => {
            document.getElementById('trader-account').textContent = 'error: ' + e.message;
        });
})();
// =====================
// copyright 2026 by sleet.near