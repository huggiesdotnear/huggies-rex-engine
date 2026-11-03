// huggies_rex_engine
// ====================================
#![allow(non_camel_case_types)]
#![allow(non_snake_case)]
// ====================================
pub mod backend {
    pub mod logic {
        pub mod db;
        pub mod endpoint_huggies_sessions;
        pub mod endpoint_trezu;
        pub mod server;
    }
    pub mod routes {
        pub mod app_router_fun;
        pub mod ping_route;
        #[cfg(test)]
        pub mod session_key_prefix_test;
        pub mod session_me_route;
        pub mod session_rotate_route;
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
