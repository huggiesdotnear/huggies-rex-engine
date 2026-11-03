// ========================================
// the holder-type filters offered on the SHIT page.
// ========================================
import {
  SHIT_1170_SHIT_HOLDER_TYPE_REGULAR,
  type SHIT_1170_SHIT_HOLDER_ROW_TYPE,
} from "./token_page_shit_1170_known_holders";
import type { SHIT_1170_SHIT_ACTIVE_FILTER } from "./token_page_shit_1170_state";
// ========================================
// one filter: a key, a label, an icon, and the tooltip that explains
// what the type is.
export interface SHIT_1170_SHIT_FILTER {
  // the key is the ACTIVE FILTER it applies — one type, so a tab key
  // can be handed to the store without a cast.
  key: SHIT_1170_SHIT_ACTIVE_FILTER;
  label: string;
  icon: string;
  description: string;
}
// ========================================
// the icons the SHIT info app uses for each holder type.
const SHIT_1170_SHIT_TYPE_ICONS: Record<
  SHIT_1170_SHIT_HOLDER_ROW_TYPE,
  string
> = {
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
const SHIT_1170_SHIT_TYPE_DESCRIPTIONS: Record<
  SHIT_1170_SHIT_HOLDER_ROW_TYPE,
  string
> = {
  dev: 'all my "dev" accounts, shown for full transparency',
  dex: "dex accounts",
  nft: "these near accounts are/were available as NFTs",
  vault: "shit-1170 holding accounts",
  burn: "burned tokens",
  regular: "regular holders",
};
// ========================================
// the filter list, in display order: ALL first, then one per type.
export const SHIT_1170_SHIT_FILTERS: ReadonlyArray<SHIT_1170_SHIT_FILTER> = [
  {
    key: "all",
    label: "ALL",
    icon: "",
    description: "every holder",
  },
  {
    key: "dev",
    label: "DEV",
    icon: SHIT_1170_SHIT_TYPE_ICONS.dev,
    description: SHIT_1170_SHIT_TYPE_DESCRIPTIONS.dev,
  },
  {
    key: "dex",
    label: "DEX",
    icon: SHIT_1170_SHIT_TYPE_ICONS.dex,
    description: SHIT_1170_SHIT_TYPE_DESCRIPTIONS.dex,
  },
  {
    key: "nft",
    label: "NFT",
    icon: SHIT_1170_SHIT_TYPE_ICONS.nft,
    description: SHIT_1170_SHIT_TYPE_DESCRIPTIONS.nft,
  },
  {
    key: "vault",
    label: "VAULT",
    icon: SHIT_1170_SHIT_TYPE_ICONS.vault,
    description: SHIT_1170_SHIT_TYPE_DESCRIPTIONS.vault,
  },
  {
    key: "burn",
    label: "BURN",
    icon: SHIT_1170_SHIT_TYPE_ICONS.burn,
    description: SHIT_1170_SHIT_TYPE_DESCRIPTIONS.burn,
  },
  {
    key: SHIT_1170_SHIT_HOLDER_TYPE_REGULAR,
    label: "HOLDERS",
    icon: SHIT_1170_SHIT_TYPE_ICONS.regular,
    description: SHIT_1170_SHIT_TYPE_DESCRIPTIONS.regular,
  },
];
// ========================================
// copyright 2026 by sleet.near
// ========================================
