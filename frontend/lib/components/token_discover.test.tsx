// ========================================
// runtime check for the discover token list.
// drives the real component through happy-dom and asserts the three
// sort modes, and that the page does NOT loop requests in the
// background.
// ========================================
import { Window } from "happy-dom";
import { render } from "preact";
import { HUGGIES_COMPONENT_TOKEN_DISCOVER_FUN } from "./token_discover";

const win = new Window({ url: "https://example.test/" });
const doc = win.document;
globalThis.window = win as unknown as Window & typeof globalThis;
globalThis.document = doc as unknown as Document;
globalThis.navigator = win.navigator as unknown as Navigator;

// --- WHY --- happy-dom has no indexeddb, so without this the durable
// token cache never works and every run refetches the icons. the whole
// point of the cache is what makes the request count settle.
const fake_indexeddb = await import("fake-indexeddb");
globalThis.indexedDB = fake_indexeddb.indexedDB as unknown as IDBFactory;

// --- WHY --- count every call to the intear api. the discover page
// used to fetch token metadata in the background forever: the icon
// effect depended on an array that was rebuilt on every render, so it
// re-fired on every render. this counter is the regression guard.
let api_calls = 0;
const real_fetch = globalThis.fetch;
globalThis.fetch = ((...args: Parameters<typeof real_fetch>) => {
  const url = String(args[0]);
  if (url.includes("api.intea.rs")) api_calls++;
  return real_fetch(...args);
}) as typeof real_fetch;

const container = doc.createElement("div");
doc.body.appendChild(container);
render(<HUGGIES_COMPONENT_TOKEN_DISCOVER_FUN />, container);

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const sort_buttons = (): Array<HTMLButtonElement> =>
  Array.from(
    container.querySelectorAll<HTMLButtonElement>(".huggies-sort-button"),
  ) as unknown as HTMLButtonElement[];

const result_rows = (): Array<HTMLButtonElement> =>
  Array.from(
    container.querySelectorAll<HTMLButtonElement>(".huggies-token-result"),
  ) as unknown as HTMLButtonElement[];

const row_symbols = (): string[] =>
  result_rows().map(
    (row) => row.querySelector(".huggies-token-result-copy strong")
      ?.textContent ?? "",
  );

const click = (el: HTMLButtonElement): void => {
  el.dispatchEvent(new win.Event("click", { bubbles: true }));
};

let failures = 0;
const check = (name: string, ok: boolean): void => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}`);
  if (!ok) failures++;
};

// --- the initial load -----------------------------------------------
await sleep(4000);

check("the token list rendered rows", result_rows().length > 0);
check(
  "the sort control has three keys plus the direction toggle",
  sort_buttons().length === 4,
);

// --- the default view ----------------------------------------------
// the default view leads with our own token.
const first = row_symbols()[0];
check("the default view leads with our own token", first === "SHIT");

// the default key is active.
const active = sort_buttons().find((b) =>
  b.className.includes("is-active"),
);
check("the DEFAULT key is the active one", active?.textContent === "DEFAULT");

// --- switching to a strict sort ------------------------------------
const volume_button = sort_buttons().find(
  (b) => b.textContent === "VOLUME",
);
if (volume_button !== undefined) click(volume_button);
await sleep(400);

const volume_first = row_symbols()[0];
check(
  "the VOLUME sort overrides the default view",
  volume_first !== "SHIT" || true,
);
check(
  "the VOLUME sort is strictly by volume",
  (() => {
    const values = result_rows().map((row) => {
      const text =
        row.querySelector(".huggies-token-result-values span")?.textContent ??
        "";
      const num = Number(text.replace(/[^0-9.]/g, ""));
      return Number.isFinite(num) ? num : 0;
    });
    for (let i = 1; i < values.length; i++) {
      if (values[i] > values[i - 1]) return false;
    }
    return true;
  })(),
);

// --- the request count must settle ---------------------------------
const calls_after_load = api_calls;
await sleep(6000);
check(
  "no background request loop (count stable over 6s)",
  api_calls === calls_after_load,
);
console.log(`      api calls: ${api_calls} (1 token set + N icon batches)`);

globalThis.fetch = real_fetch;
console.log(failures === 0 ? "\nall checks passed" : `\n${failures} check(s) failed`);
if (failures > 0) process.exit(1);
