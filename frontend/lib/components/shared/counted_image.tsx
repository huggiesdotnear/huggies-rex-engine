// ========================================
// the counted image: an <img> that tells the loading bar it is loading.
//
// --- WHY THIS EXISTS: the token icons are NOT fetched with fetch. they
// are <img> tags pointing at the api's content-addressed icon urls, and
// the browser loads them on its own. so the loading bar — which counts
// the global fetch — never saw them. on a discover page that is up to
// three hundred icons the reader waits for, and the bar sat at 100%
// while they were still arriving.
//
// --- WHY IT IS A COMPONENT AND NOT A PATCH ON THE DOM: the browser's
// image loading cannot be observed from javascript without replacing
// the element, and replacing every <img> would break the lazy loading
// the long lists rely on. this component renders the <img> itself, so
// it knows when the browser starts and stops loading it.
//
// --- WHY THE COUNT IS THE BAR'S OWN BUSINESS: the component reports to
// the loading bar, and the bar decides what that means for the page.
// the component knows nothing about the bar's rules.
import { useEffect as use_effect, useRef as use_ref } from "preact/hooks";
import { HUGGIES_LOADING_BAR } from "../../ts/loading_bar";
// ========================================
// ========================================
// --- PROPS ------------------------------
export interface HUGGIES_COUNTED_IMAGE_PROPS {
  // the image url.
  src: string;
  // the class on the <img>.
  class?: string;
  // the alt text. the icons are decorative, so it is usually empty.
  alt?: string;
  // the rendered width, in pixels.
  width?: number;
  // the rendered height, in pixels.
  height?: number;
  // the browser's own lazy loading. off by default so the image starts
  // as soon as it is on screen.
  loading?: "eager" | "lazy";
  // the title, for the token's symbol on the shared balance row.
  title?: string;
}
// ========================================
// ========================================
// --- COMPONENT --------------------------
function HUGGIES_COUNTED_IMAGE_FUN(
  props: HUGGIES_COUNTED_IMAGE_PROPS,
): preact.JSX.Element {
  // the ref holds the <img> so the effect can read its state.
  const image_ref = use_ref<HTMLImageElement | null>(null);

  use_effect(() => {
    const image = image_ref.current;
    if (image === null) return;

    // --- WHY THE IMAGE MAY ALREADY BE LOADED: the effect runs after
    // the browser has had a chance to fetch the src, and a cached icon
    // can be complete before the effect runs. counting it then would
    // leave the bar waiting for an image that already finished.
    if (image.complete) {
      HUGGIES_LOADING_BAR.image_finished();
      return;
    }

    HUGGIES_LOADING_BAR.image_started();
    const on_load = (): void => {
      HUGGIES_LOADING_BAR.image_finished();
    };
    // --- WHY BOTH EVENTS COUNT IT: "load" fires on success and "error"
    // fires when the url is broken. a broken icon must not hold the
    // bar open forever, so both close the count.
    image.addEventListener("load", on_load);
    image.addEventListener("error", on_load);
    return () => {
      image.removeEventListener("load", on_load);
      image.removeEventListener("error", on_load);
    };
  }, [props.src]);

  return (
    <img
      ref={image_ref}
      class={props.class}
      src={props.src}
      alt={props.alt ?? ""}
      width={props.width}
      height={props.height}
      loading={props.loading ?? "eager"}
      title={props.title}
    />
  );
}
// ========================================
// --- PUBLIC ---------------------------
// the counted image, exported as a component so it can be used in jsx.
// the name is capitalised because jsx treats a lowercase name as a
// plain html tag and not as a component.
export function HUGGIES_COUNTED_IMAGE(
  props: HUGGIES_COUNTED_IMAGE_PROPS,
): preact.JSX.Element {
  return <HUGGIES_COUNTED_IMAGE_FUN {...props} />;
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
