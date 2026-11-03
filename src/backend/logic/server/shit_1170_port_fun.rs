// SHIT_1170_PORT_FUN
// bind port, default 54733.
// ====================================
pub fn shit_1170_port_fun() -> u16 {
    std::env::var("SHIT_1170_PORT")
        .ok()
        .and_then(|v| v.parse::<u16>().ok())
        .unwrap_or(54733)
}
// ====================================
// copyright 2026 by sleet.near
