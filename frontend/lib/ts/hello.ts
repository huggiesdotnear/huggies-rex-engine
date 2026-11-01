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
// every page's import file pulls this in first, so the pin lands before
// anything reads the network — the page's own start or route script
// touches the wallet, and the wallet reads the network.
import { set_network_mainnet } from "@near-kit-tool-box/web";
// ========================================
if (typeof localStorage !== "undefined") set_network_mainnet();
// ========================================
console.log("=============================");
console.log("👋 hello this app was made \n with ❤️ by sleet.near");
console.log("=============================");
// ========================================
