// HUGGIES_LOCAL_IPS_FUN
// list the machine's real LAN IPv4 addresses, best guess first.
//
// WHY THIS EXISTS: the server binds 0.0.0.0, a wildcard bind address
// and not a URL anyone can open. printing "listening on
// http://0.0.0.0:54733" sends people to an address that is useless in
// a browser. this turns that into actual URLs they can click.
//
// WHY THE LOCALHOST WARNING MATTERS: the wallet flow needs a SECURE
// CONTEXT (https, or http://localhost / 127.0.0.1). a LAN address is
// plain HTTP on a non-local origin, so the browser withholds WebCrypto
// Ed25519 from the wallet's sandbox iframe and sign-in dies with
// "Cannot read properties of undefined (reading 'generateKey')".
// localhost counts as secure even over plain HTTP, so it is the one to
// use for wallet testing.
//
// returns an empty vec when no interface can be read (containers,
// restricted sandboxes), so callers must handle that.
pub fn huggies_local_ips_fun() -> Vec<String> {
    local_ip_address::list_afinet_netifas()
        .into_iter()
        .flatten()
        .filter_map(|(_name, ip)| match ip {
            std::net::IpAddr::V4(ip) => Some(ip.to_string()),
            // IPv6 needs bracket notation in a URL and is usually not
            // what someone wants to paste, so it is left out here.
            std::net::IpAddr::V6(_) => None,
        })
        // loopback is 127.0.0.1, already printed separately as
        // "localhost", so it would only be a duplicate here.
        .filter(|ip| ip != "127.0.0.1")
        .collect()
}
// ====================================
// copyright 2026 by sleet.near
