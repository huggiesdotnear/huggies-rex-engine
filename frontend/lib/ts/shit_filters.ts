// ========================================
// the holder-type filters offered on the SHIT page.
// ========================================
import {
  HUGGIES_SHIT_HOLDER_TYPE_REGULAR,
  type HUGGIES_SHIT_HOLDER_ROW_TYPE,
} from "./shit_known_holders";
// ========================================
// one filter: a key, a label, and an icon.
export interface HUGGIES_SHIT_FILTER {
  key: HUGGIES_SHIT_HOLDER_ROW_TYPE | "all";
  label: string;
  icon: string;
}
// ========================================
// the icons the SHIT info app uses for each holder type.
const HUGGIES_SHIT_TYPE_ICONS: Record<HUGGIES_SHIT_HOLDER_ROW_TYPE, string> = {
  dev: "👨‍💻",
  dex: "🔄",
  nft: "🖼️",
  vault: "🏦",
  burn: "🔥",
  regular: "👤",
};
// ========================================
// the filter list, in display order: ALL first, then one per type.
export const HUGGIES_SHIT_FILTERS: ReadonlyArray<HUGGIES_SHIT_FILTER> = [
  { key: "all", label: "ALL", icon: "" },
  { key: "dev", label: "DEV", icon: HUGGIES_SHIT_TYPE_ICONS.dev },
  { key: "dex", label: "DEX", icon: HUGGIES_SHIT_TYPE_ICONS.dex },
  { key: "nft", label: "NFT", icon: HUGGIES_SHIT_TYPE_ICONS.nft },
  { key: "vault", label: "VAULT", icon: HUGGIES_SHIT_TYPE_ICONS.vault },
  { key: "burn", label: "BURN", icon: HUGGIES_SHIT_TYPE_ICONS.burn },
  {
    key: HUGGIES_SHIT_HOLDER_TYPE_REGULAR,
    label: "HOLDERS",
    icon: HUGGIES_SHIT_TYPE_ICONS.regular,
  },
];
// ========================================
// copyright 2026 by sleet.near
// ========================================
