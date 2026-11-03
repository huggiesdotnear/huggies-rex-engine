// ====================================
use huggies_rex_engine::backend::logic::{
    db::db_open_fun, huggies_banner_fun::huggies_banner_fun, huggies_host_fun::huggies_host_fun,
    huggies_port_fun::huggies_port_fun, session_secret_fun::session_secret_fun,
    vault_db_path_fun::vault_db_path_fun,
};
use huggies_rex_engine::backend::routes::app_router_fun::app_router_fun;
// ====================================
#[tokio::main]
async fn main() {
    let _ = dotenvy::dotenv();

    let host = huggies_host_fun();
    let port = huggies_port_fun();
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

    // the session secret is read at startup, so a missing one stops the
    // app before the first sign-in instead of failing the request.
    match session_secret_fun() {
        Ok(_) => {}
        Err(err) => {
            eprintln!("{err}");
            eprintln!("set HUGGIES_SESSION_SECRET in the environment (or the .env file).");
            std::process::exit(1);
        }
    }

    let listener = match tokio::net::TcpListener::bind(&addr).await {
        Ok(l) => l,
        Err(e) => {
            eprintln!("failed to bind {addr}: {e}");
            std::process::exit(1);
        }
    };

    huggies_banner_fun(&host, port);

    if let Err(e) = axum::serve(listener, app_router_fun(pool)).await {
        eprintln!("server error: {e}");
        std::process::exit(1);
    }
}
// ====================================
// copyright 2026 by sleet.near
