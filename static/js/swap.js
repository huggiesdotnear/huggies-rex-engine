// =====================
// swap.js
// =====================
const tokenIn = document.getElementById('swap-token-in');
const tokenOut = document.getElementById('swap-token-out');
const amountIn = document.getElementById('swap-amount-in');
const amountOutEl = document.getElementById('swap-amount-out');
const list = document.getElementById('swap-token-list');

fetch('/api/tokens').then(r => r.json()).then(tokens => {
    for (const t of tokens) {
        const o = document.createElement('option');
        o.value = t.account_id;
        o.label = `${t.symbol} (${t.account_id})`;
        list.appendChild(o);
    }
});

document.getElementById('swap-quote').addEventListener('click', async () => {
    const params = new URLSearchParams({
        token_in: tokenIn.value.trim(),
        token_out: tokenOut.value.trim(),
        amount_in: amountIn.value.trim(),
    });
    try {
        const quote = await fetch('/api/get_return?' + params).then(r => r.json());
        amountOutEl.textContent = quote.amount_out + ' (source: ' + quote.source + ')';
    } catch (e) {
        amountOutEl.textContent = 'error: ' + e.message;
    }
});
// =====================
// copyright 2026 by sleet.near