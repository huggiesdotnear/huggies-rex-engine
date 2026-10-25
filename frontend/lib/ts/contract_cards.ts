// ========================================
// shared discover-card definitions for supported smart contracts.
// ========================================
export interface HUGGIES_CONTRACT_CARD {
  key: string;
  title: string;
  contract_id: string;
  route: string;
}
// ========================================
// list contract links for discover surfaces.
export function list_contract_cards_fun(): HUGGIES_CONTRACT_CARD[] {
  return [
    {
      key: "rhea-amm",
      title: "Rhea AMM",
      contract_id: "v2.ref-finance.near",
      route: "./contract.html?id=rhea-amm",
    },
    {
      key: "rhea-dcl-v2",
      title: "Rhea DCL v2",
      contract_id: "dclv2.ref-labs.near",
      route: "./contract.html?id=rhea-dcl-v2",
    },
    {
      key: "intear-dex",
      title: "INTEAR DEX engine",
      contract_id: "dex.intear.near",
      route: "./contract.html?id=intear-dex",
    },
    {
      key: "sputnik-dao",
      title: "Sputnik DAO",
      contract_id: "huggies.sputnik-dao.near",
      route: "./contract.html?id=sputnik-dao",
    },
    {
      key: "pumpopoly",
      title: "Pumpopoly",
      contract_id: "world.pumpopoly.near",
      route: "./contract.html?id=pumpopoly",
    },
  ];
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
