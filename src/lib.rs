// shit_1170_rex_engine
// ====================================
#![allow(non_camel_case_types)]
#![allow(non_snake_case)]
// ====================================
pub mod backend {
    pub mod logic {
        pub mod db;
        pub mod endpoint_shit_1170_api_keys;
        pub mod endpoint_trezu;
        pub mod server;
    }
    pub mod routes {
        pub mod api_key_me_route;
        #[cfg(test)]
        pub mod api_key_prefix_test;
        pub mod api_key_rotate_route;
        pub mod api_keys_route;
        pub mod app_router_fun;
        pub mod ping_route;
        pub mod trezu_treasuries_route;
    }
    pub mod types {
        pub mod api_keys_request;
        pub mod trezu_treasuries_query;
    }
}
// ====================================
// copyright 2026 by sleet.near
