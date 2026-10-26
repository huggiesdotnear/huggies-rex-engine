// ========================================
// the holder-type filters offered on the SHIT page.
// ========================================
import {
  HUGGIES_SHIT_HOLDER_TYPE_REGULAR,
  type HUGGIES_SHIT_HOLDER_ROW_TYPE,
} from "./tokens_page_shit_1170_known_holders";
// ========================================
// one filter: a key, a label, an icon, and the tooltip that explains
// what the type is.
export interface HUGGIES_SHIT_FILTER {
  key: HUGGIES_SHIT_HOLDER_ROW_TYPE | "all";
  label: string;
  icon: string;
  // what the tab's tooltip says when the reader hovers it.
  description: string;
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
// what each holder type means — the legend the old SHIT info page put
// under its holder list, moved onto the tabs themselves.
const HUGGIES_SHIT_TYPE_DESCRIPTIONS: Record<
  HUGGIES_SHIT_HOLDER_ROW_TYPE,
  string
> = {
  dev: 'all my "dev" accounts, shown for full transparency',
  dex: "dex accounts",
  nft: "these near accounts are/were available as NFTs",
  vault: "huggies holding accounts",
  burn: "burned tokens",
  regular: "regular holders",
};
// ========================================
// the filter list, in display order: ALL first, then one per type.
export const HUGGIES_SHIT_FILTERS: ReadonlyArray<HUGGIES_SHIT_FILTER> = [
  {
    key: "all",
    label: "ALL",
    icon: "",
    description: "every holder",
  },
  {
    key: "dev",
    label: "DEV",
    icon: HUGGIES_SHIT_TYPE_ICONS.dev,
    description: HUGGIES_SHIT_TYPE_DESCRIPTIONS.dev,
  },
  {
    key: "dex",
    label: "DEX",
    icon: HUGGIES_SHIT_TYPE_ICONS.dex,
    description: HUGGIES_SHIT_TYPE_DESCRIPTIONS.dex,
  },
  {
    key: "nft",
    label: "NFT",
    icon: HUGGIES_SHIT_TYPE_ICONS.nft,
    description: HUGGIES_SHIT_TYPE_DESCRIPTIONS.nft,
  },
  {
    key: "vault",
    label: "VAULT",
    icon: HUGGIES_SHIT_TYPE_ICONS.vault,
    description: HUGGIES_SHIT_TYPE_DESCRIPTIONS.vault,
  },
  {
    key: "burn",
    label: "BURN",
    icon: HUGGIES_SHIT_TYPE_ICONS.burn,
    description: HUGGIES_SHIT_TYPE_DESCRIPTIONS.burn,
  },
  {
    key: HUGGIES_SHIT_HOLDER_TYPE_REGULAR,
    label: "HOLDERS",
    icon: HUGGIES_SHIT_TYPE_ICONS.regular,
    description: HUGGIES_SHIT_TYPE_DESCRIPTIONS.regular,
  },
];
// ========================================
// copyright 2026 by sleet.near
// ========================================
