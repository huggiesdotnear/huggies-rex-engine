// ====================================
use huggies_rex_engine::backend::logic::{
    huggies_host_fun::huggies_host_fun, huggies_port_fun::huggies_port_fun,
};
use huggies_rex_engine::backend::routes::app_router_fun::app_router_fun;
// ====================================
#[tokio::main]
async fn main() {
    let _ = dotenvy::dotenv();

    let host = huggies_host_fun();
    let port = huggies_port_fun();
    let addr = format!("{host}:{port}");

    let listener = match tokio::net::TcpListener::bind(&addr).await {
        Ok(l) => l,
        Err(e) => {
            eprintln!("failed to bind {addr}: {e}");
            std::process::exit(1);
        }
    };

    println!("====================================");
    println!("huggies-rex-engine listening on http://{addr}");
    println!("====================================");

    if let Err(e) = axum::serve(listener, app_router_fun()).await {
        eprintln!("server error: {e}");
        std::process::exit(1);
    }
}
// ====================================
// copyright 2026 by sleet.near
