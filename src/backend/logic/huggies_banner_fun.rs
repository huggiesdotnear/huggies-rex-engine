// HUGGIES_BANNER_FUN
// print the startup banner: where the app can actually be opened.
//
// the bind host is usually 0.0.0.0, a wildcard that is not a usable
// URL, so it is not printed as a link. instead localhost is listed
// first (it is the one that works for wallet sign-in, see below) and
// then every real LAN address.
//
// the localhost note is not cosmetic: the wallet sandbox needs a SECURE
// CONTEXT for WebCrypto Ed25519, which plain HTTP provides only on
// localhost/127.0.0.1. opening a LAN address in a browser instead
// fails sign-in with
// "Cannot read properties of undefined (reading 'generateKey')".
use super::huggies_local_ips_fun::huggies_local_ips_fun;
pub fn huggies_banner_fun(host: &str, port: u16) {
    let ips = huggies_local_ips_fun();

    println!("====================================");
    if host == "0.0.0.0" || host == "::" {
        println!("huggies-rex-engine bound to {host}:{port}");
        println!();
        println!("open in a browser:");
        // localhost first: it is a secure context, so wallet sign-in works.
        println!("  http://localhost:{port}   <- use this for wallet login");
        for ip in &ips {
            // pad the address itself, not the formatted string, so the
            // trailing comment lines up regardless of ip length.
            println!(
                "  http://{ip}:{port}{} <- LAN, wallet login will NOT work here",
                " ".repeat(8usize.saturating_sub(ip.len()))
            );
        }
        println!();
        println!("wallet login needs a secure context. browsers only treat");
        println!("https, http://localhost and http://127.0.0.1 as secure, so the");
        println!("LAN addresses above cannot sign in (the wallet sandbox loses");
        println!("WebCrypto Ed25519 and fails with \"reading 'generateKey'\").");
    } else {
        // an explicit host was configured, so it is the only address.
        println!("huggies-rex-engine listening on http://{host}:{port}");
        if host != "localhost" && host != "127.0.0.1" {
            println!();
            println!("note: wallet login needs a secure context (https, or");
            println!("localhost). this address is plain http, so sign-in will fail.");
        }
    }
    if ips.is_empty() {
        println!();
        println!("(no LAN addresses detected — use the localhost link above)");
    }
    println!("====================================");
}
// ====================================
// copyright 2026 by sleet.near