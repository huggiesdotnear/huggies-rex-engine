// ========================================
// the json viewer: a collapsible tree of a json value.
//
// the fastnear explorer shows json with @uiw/react-json-view. that
// library DOES work under preact/compat — it was tried and it renders
// and collapses — but it costs an app-wide alias of react to
// preact/compat in the build, adds about eleven kilobytes of gzip to
// every page's bundle, and its `latest` is an alpha with no upstream
// preact testing. so the tree is built here instead: it is a small
// thing, it carries the app's own look, and it costs nothing.
//
// --- WHY --- a collapsible tree and not a pretty-printed blob: a
// transaction's arguments and a receipt's failure can be deeply nested
// json, and a blob of it is unreadable. the tree shows the shape.
//
// --- WHY --- THE COLLAPSE STATE IS PER-NODE AND NOT ONE GLOBAL FLAG: a
// reader wants the top of the tree open and the deep leaves closed.
//
// --- WHY --- THE BRANCH IS ITS OWN COMPONENT AND NOT A PLAIN FUNCTION:
// a branch owns a piece of state — whether it is open — and a piece of
// state needs a component of its own to hold it. a plain function
// would put every branch's state in the reader above it.
//
// --- WHY --- IT IS A PAGE COMPONENT AND NOT A SHARED ONE: it is used
// by the transaction page's receipts component and by its arguments
// viewer, and by nothing else, so it carries the transaction page's
// prefix.
//
// --- WHY --- THE RULES NEST UNDER THE CLASS AND NOT A MOUNT ID: two
// components of the page use it, and it has no mount id of its own, so
// the class on its root is what the rules reach through.
//
// this component does NOT fetch. it renders what it is given.
import { useState as use_state } from "preact/hooks";
// ========================================
// ========================================
// --- TYPES ------------------------------
// a node of the tree.
interface HUGGIES_JSON_NODE {
  // the label of the node — the key in the parent object, or the index
  // in the parent array.
  label: string;
  // the value itself.
  value: unknown;
}
// ========================================
// ========================================
// --- HELPERS ----------------------------
// how a value should be written on one line.
//
// --- WHY --- a string is quoted and a number is not: the difference
// between the string "1" and the number 1 is the whole point of a json
// viewer.
function value_text_fun(value: unknown): string {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return "";
}
// ========================================
// ========================================
// --- IS BRANCH -------------------------
// a value with children — an object or an array.
function is_branch_fun(value: unknown): boolean {
  return typeof value === "object" && value !== null;
}
// ========================================
// ========================================
// --- CHILDREN -------------------------
// the children of a branch, each with its label.
function children_fun(value: unknown): HUGGIES_JSON_NODE[] {
  if (Array.isArray(value)) {
    return value.map((item, index) => ({
      label: String(index),
      value: item,
    }));
  }
  if (typeof value === "object" && value !== null) {
    return Object.entries(value).map(([key, item]) => ({
      label: key,
      value: item,
    }));
  }
  return [];
}
// ========================================
// ========================================
// --- CONFIG -----------------------------
// how long a value may be before it is cut short.
//
// --- WHY 200: a long enough value shows its shape and a short one is
// shown whole. a receipt's log can carry a megabyte of text, and one
// unbroken line of it makes the page unusable.
const HUGGIES_JSON_LONG_VALUE_CHARS = 200;
// ========================================
// ========================================
// --- TYPE LABEL ------------------------
// what kind of value a leaf holds.
//
// --- WHY --- THE KIND IS SHOWN: the difference between the string "1"
// and the number 1 is the whole point of a json viewer, and a colour
// alone does not say which is which.
function type_label_fun(value: unknown): string {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (Array.isArray(value)) return "array";
  if (typeof value === "object") return "object";
  if (typeof value === "string") return "string";
  if (typeof value === "number") return "number";
  if (typeof value === "boolean") return "boolean";
  return "";
}
// ========================================
// ========================================
// --- COPY ------------------------------
// put a value on the clipboard.
//
// --- WHY --- IT NEVER THROWS: the clipboard is not always there — the
// browser may refuse it, or the page may not be secure — and a failed
// copy is not worth an error the reader has to see.
async function copy_text_fun(text: string): Promise<void> {
  try {
    if (typeof navigator === "undefined") return;
    if (navigator.clipboard === undefined) return;
    await navigator.clipboard.writeText(text);
  } catch (err) {
    console.warn("[json_viewer] copy failed", err);
  }
}
// ========================================
// ========================================
// --- LEAF -----------------------------
// a leaf: its label, its value and what kind of value it is.
//
// --- WHY --- IT IS A COMPONENT AND NOT A PLAIN FUNCTION: a component
// is the only thing that can hold a piece of state, and a leaf has
// state — a long value is cut short until the reader asks for the rest,
// and the copy button says whether the copy worked. the name follows
// the repo's rule for a component function: SCREAMING_SNAKE with the
// `_FUN` ending.
function JSON_VIEWER_LEAF_FUN(props: {
  node: HUGGIES_JSON_NODE;
}): preact.JSX.Element {
  const value = props.node.value;
  const text = value_text_fun(value);
  const is_string = typeof value === "string";
  // --- WHY --- THE TYPE IS SHOWN: the difference between the string
  // "1" and the number 1 is the whole point of a json viewer, and a
  // colour alone does not say which is which.
  const type_name = type_label_fun(value);
  // --- WHY --- A LONG VALUE IS CUT SHORT: a receipt's log can carry a
  // megabyte of text, and one unbroken line of it makes the page
  // unusable. the reader asks for the rest.
  const is_long = text.length > HUGGIES_JSON_LONG_VALUE_CHARS;
  const [is_full, set_is_full] = use_state(false);
  const [is_copied, set_is_copied] = use_state(false);
  const shown = is_long && !is_full ? `${text.slice(0, HUGGIES_JSON_LONG_VALUE_CHARS)}...` : text;

  return (
    <div class="json-leaf">
      <span class="json-label">{props.node.label}</span>
      <span class={is_string ? "json-value is-string" : "json-value"}>
        {shown}
      </span>
      <span class="json-type">{type_name}</span>
      {is_long && (
        <button
          type="button"
          class="json-more"
          onClick={() => set_is_full(!is_full)}
        >
          {is_full ? "LESS" : "MORE"}
        </button>
      )}
      <button
        type="button"
        class="json-copy"
        title="COPY"
        aria-label={`copy ${props.node.label}`}
        onClick={() => {
          void copy_text_fun(text);
          set_is_copied(true);
        }}
      >
        {is_copied ? "COPIED" : "COPY"}
      </button>
    </div>
  );
}
// ========================================
// ========================================
// --- BRANCH ---------------------------
// a branch: its label, the count of its children, and the children
// themselves when the branch is open.
//
// --- WHY --- the branch opens at the top two levels: a reader wants to
// see the shape of the json at a glance, and the deep leaves are noise
// until they are asked for.
//
// --- WHY --- IT IS A COMPONENT AND NOT A PLAIN FUNCTION: the open and
// closed state is a piece of state, and a plain function would put
// every branch's state in the same place — so opening one branch would
// open them all.
function JSON_VIEWER_BRANCH_FUN(props: {
  node: HUGGIES_JSON_NODE;
  depth: number;
}): preact.JSX.Element {
  const [is_open, set_is_open] = use_state(props.depth < 2);
  const children = children_fun(props.node.value);
  // --- WHY --- A BRANCH WITH NO CHILDREN SAYS SO: an empty object as a
  // branch would render as a toggle with nothing under it, and the
  // reader would think it had failed to open.
  if (children.length === 0) {
    return (
      <div class="json-branch">
        <div class="json-toggle is-empty">
          <span class="json-caret">-</span>
          <span class="json-label">{props.node.label}</span>
          <span class="json-value is-empty">
            {Array.isArray(props.node.value) ? "[]" : "{}"}
          </span>
        </div>
      </div>
    );
  }
  return (
    <div class="json-branch">
      <button
        type="button"
        class="json-toggle"
        onClick={() => set_is_open(!is_open)}
        aria-expanded={is_open}
      >
        <span class="json-caret">{is_open ? "-" : "+"}</span>
        <span class="json-label">{props.node.label}</span>
        <span class="json-count">{children.length}</span>
      </button>
      {is_open && (
        <div class="json-children">
          {children.map((child, index) => (
            <JSON_VIEWER_NODE_FUN
              key={`${child.label}-${index}`}
              node={child}
              depth={props.depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
// ========================================
// ========================================
// --- NODE -----------------------------
// one node of the tree: a branch or a leaf.
function JSON_VIEWER_NODE_FUN(props: {
  node: HUGGIES_JSON_NODE;
  depth: number;
}): preact.JSX.Element {
  if (is_branch_fun(props.node.value)) {
    return <JSON_VIEWER_BRANCH_FUN node={props.node} depth={props.depth} />;
  }
  return <JSON_VIEWER_LEAF_FUN node={props.node} />;
}
// ========================================
// ========================================
// --- VIEWER ---------------------------
// the viewer: the whole tree of a json value.
export function huggies_json_viewer_fun(props: {
  value: unknown;
}): preact.JSX.Element {
  const children = children_fun(props.value);
  // a json value that is not an object or an array has no tree to
  // show — it is one value, so it is shown as one line.
  if (!is_branch_fun(props.value)) {
    return (
      <div class="json-viewer">
        <div class="json-leaf">
          <span
            class={
              typeof props.value === "string"
                ? "json-value is-string"
                : "json-value"
            }
          >
            {value_text_fun(props.value)}
          </span>
          <span class="json-type">{type_label_fun(props.value)}</span>
        </div>
      </div>
    );
  }
  // --- WHY --- AN EMPTY OBJECT SAYS SO: `{}` has no children, so the
  // tree would render as an empty box and the reader would think it
  // had failed. an empty object says it is empty.
  if (children.length === 0) {
    return (
      <div class="json-viewer">
        <div class="json-leaf">
          <span class="json-value is-empty">
            {Array.isArray(props.value) ? "[]" : "{}"}
          </span>
          <span class="json-type">
            {Array.isArray(props.value) ? "array" : "object"}
          </span>
        </div>
      </div>
    );
  }
  return (
    <div class="json-viewer">
      {children.map((child, index) => (
        <JSON_VIEWER_NODE_FUN
          key={`${child.label}-${index}`}
          node={child}
          depth={0}
        />
      ))}
    </div>
  );
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
