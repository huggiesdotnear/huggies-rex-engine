// ========================================
// --- WHY --- this pins the network to mainnet BEFORE anything reads
// it. near-kit-tool-box/web keeps a separate near connector per
// network and picks between them from the stored network id, so the
// pin has to land before the first near_connect_client() call.
//
// --- WHY --- one network only, so one connector and one wallet
// session. the two connectors share the wallet's storage namespace and
// near-connect's signOut() wipes that whole namespace regardless of
// network, so a toggle could take the other network's session down
// with it.
//
// every app/* page loads this file ahead of import.ts for that reason;
// the pages under app/contract/ and app/token/ do not load it
// themselves, so import.ts pulls it in for them.
import { set_network_mainnet } from "@near-kit-tool-box/web";
// ========================================
if (typeof localStorage !== "undefined") set_network_mainnet();
// ========================================
console.log("=============================");
console.log("👋 hello this app was made \n with ❤️ by sleet.near");
console.log("=============================");
// ========================================
