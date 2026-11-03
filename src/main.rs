// ====================================
use shit_1170::backend::logic::{
    db::{db_open_fun::db_open_fun, vault_db_path_fun::vault_db_path_fun},
    server::{
        shit_1170_banner_fun::shit_1170_banner_fun, shit_1170_host_fun::shit_1170_host_fun,
        shit_1170_port_fun::shit_1170_port_fun,
    },
};
use shit_1170::backend::routes::app_router_fun::app_router_fun;
// ====================================
#[tokio::main]
async fn main() {
    let _ = dotenvy::dotenv();

    let host = shit_1170_host_fun();
    let port = shit_1170_port_fun();
    let addr = format!("{host}:{port}");

    // the db is opened BEFORE the listener binds, so a broken db stops
    // the app at startup instead of failing the first request that needs
    // it. the migrations run here too, so the schema is current before
    // anything can read it.
    let db_path = vault_db_path_fun();
    let pool = match db_open_fun(&db_path).await {
        Ok(pool) => pool,
        Err(err) => {
            eprintln!("failed to open the db at {}: {err}", db_path.display());
            std::process::exit(1);
        }
    };
    println!("db ready at {}", db_path.display());

    let listener = match tokio::net::TcpListener::bind(&addr).await {
        Ok(l) => l,
        Err(e) => {
            eprintln!("failed to bind {addr}: {e}");
            std::process::exit(1);
        }
    };

    shit_1170_banner_fun(&host, port);

    if let Err(e) = axum::serve(listener, app_router_fun(pool)).await {
        eprintln!("server error: {e}");
        std::process::exit(1);
    }
}
// ====================================
// copyright 2026 by sleet.near
