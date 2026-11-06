// ========================================
// the code block: a highlighted box of code.
//
// shiki does the highlighting. it is a textmate highlighter, so it
// knows json, bash, text and everything else by its grammar, and it
// writes the colours inline on each token.
//
// --- WHY --- shiki AND NOT A HAND-ROLLED JSON TREE: a json tree
// shows the shape of a value but a reader who wants to copy it, or to
// see the exact bytes, gets a tree instead. a code block is the
// thing every other tool on the internet shows for json, and it can
// be copied with one click.
//
// --- WHY --- THE HIGHIGHLITER IS A SINGLETON: shiki's highlighter
// holds the loaded grammars and themes, and building it costs real
// time. the component builds it once and keeps it.
//
// --- WHY --- THE JS REGEXP ENGINE AND NOT THE WASM ONE: the wasm
// engine is the accurate one, but it ships a 500 KB binary and the
// javascript engine highlights json identically — shiki's own
// compatibility table lists json as a clean match for it. the whole
// bundle for this is about 60 KB gzipped.
//
// --- WHY --- THE THEME IS one-dark-pro: its json keys read red and
// its json strings read green, which is the clearest of the bundled
// dark themes for the json on this page.
//
// --- WHY --- ONLY THE JSON GRAMMAR IS LOADED: the full shiki bundle
// carries every language and every theme — nearly ten megabytes. only
// json is imported, so only json arrives.
//
// --- WHY --- THE HTML IS WRITTEN WITH dangerouslySetInnerHTML: shiki
// returns a string of html with the colours on it. there is no jsx
// for that.
//
// --- WHY --- THE HTML IS ESCAPED FIRST: shiki escapes the code it is
// given, so the string it returns is safe to put in the page. the
// json comes from the chain and from a contract's logs, so it is
// untrusted text.
//
// --- WHY --- THERE IS A PLAIN MODE AND NOT ONLY THE HIGHLIGHTED ONE: a
// hex dump is NOT json. the json grammar reads a hex dump as a string
// literal and escapes the characters in it — the byte `89` comes out
// as `ef bf bd`, which is three bytes where there was one. a hex dump
// must show the bytes exactly, so it is shown as plain text.
//
// this component does NOT fetch. it renders what it is given.
// ========================================
import { createHighlighterCore } from "@shikijs/core";
import type { HighlighterCore } from "@shikijs/core";
import { createJavaScriptRegexEngine } from "@shikijs/engine-javascript";
import json from "@shikijs/langs/json";
import one_dark_pro from "@shikijs/themes/one-dark-pro";
import { useEffect as use_effect, useState as use_state } from "preact/hooks";
// ========================================
// ========================================
// --- HELPERS ----------------------------
// the highlighter, built once and kept.
//
// --- WHY --- THE PROMISE IS KEPT OUTSIDE THE COMPONENT: two code
// blocks on one page would each ask for a highlighter, and the second
// one would wait for the first. one promise, shared.
let highlighter_promise: Promise<HighlighterCore> | null = null;
// ========================================
// ========================================
// --- COMPONENT --------------------------
export function shit_1170_code_block_fun(props: {
  // the code to show.
  code: string;
  // the language to highlight it as. "json" is the only one the app
  // asks for today; the theme is fixed.
  lang?: "json";
  // true when the code is NOT a language and must be shown as it is.
  //
  // --- WHY --- A HEX DUMP IS NOT A LANGUAGE: a hex dump has no syntax
  // to colour, and the json grammar mangles it — it reads the dump as
  // a string literal and escapes the characters in it, so the byte
  // `89` comes out as `ef bf bd`. a hex dump must show the bytes
  // exactly, so it is shown as plain text.
  plain?: boolean;
}): preact.JSX.Element {
  const lang = props.lang ?? "json";
  const [html, set_html] = use_state<string | null>(null);
  const plain = props.plain ?? false;

  use_effect(() => {
    // --- WHY --- THE PLAIN MODE NEVER TOUCHES THE HIGHLIGHTER: there
    // is nothing to highlight, and asking for it would build a
    // highlighter for code that will not use it.
    if (plain) return;
    // the component can unmount before the highlighter is ready (the
    // reader leaves the page), so the result is dropped if it arrives
    // too late.
    let alive = true;
    const build = async () => {
      if (highlighter_promise === null) {
        highlighter_promise = createHighlighterCore({
          themes: [one_dark_pro],
          langs: [json],
          engine: createJavaScriptRegexEngine(),
        });
      }
      const highlighter = await highlighter_promise;
      if (!alive) return;
      set_html(
        highlighter.codeToHtml(props.code, {
          lang,
          theme: "one-dark-pro",
        }),
      );
    };
    void build();
    return () => {
      alive = false;
    };
  }, [props.code, lang, plain]);

  // --- WHY --- THE PLAIN TEXT IS SHOWN FIRST: the highlighter takes a
  // moment to build, and a reader should not see an empty box while it
  // does. the plain text is the code, unhighlighted — it is right, and
  // it is there immediately.
  if (plain || html === null) {
    return (
      <pre class="code-block is-plain">
        <code>{props.code}</code>
      </pre>
    );
  }
  return (
    <div
      class="code-block"
      // eslint-disable-next-line
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
