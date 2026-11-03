// huggies_rex_engine
// ====================================
#![allow(non_camel_case_types)]
#![allow(non_snake_case)]
// ====================================
pub mod backend {
    pub mod logic {
        pub mod db;
        pub mod db_migrations;
        pub mod huggies_banner_fun;
        pub mod huggies_host_fun;
        pub mod huggies_local_ips_fun;
        pub mod huggies_port_fun;
        pub mod nep413_verify_fun;
        #[cfg(test)]
        pub mod nep413_verify_fun_test;
        pub mod session_key_fun;
        pub mod session_secret_fun;
        pub mod sessions_store;
        #[cfg(test)]
        pub mod sessions_store_test;
        pub mod trezu_account_id_fun;
        pub mod trezu_base_url_fun;
        pub mod trezu_client_fun;
        pub mod trezu_error_fun;
        pub mod trezu_include_hidden_fun;
        pub mod trezu_treasuries_path_fun;
        pub mod vault_db_path_fun;
    }
    pub mod routes {
        pub mod app_router_fun;
        pub mod ping_route;
        pub mod session_me_route;
        pub mod sessions_route;
        pub mod trezu_treasuries_route;
    }
    pub mod types {
        pub mod sessions_request;
        pub mod trezu_treasuries_query;
    }
}
// ====================================
// copyright 2026 by sleet.near
