// huggies_rex_engine
// ====================================
#![allow(non_camel_case_types)]
#![allow(non_snake_case)]
// ====================================
pub mod backend {
    pub mod logic {
        pub mod huggies_banner_fun;
        pub mod huggies_host_fun;
        pub mod huggies_local_ips_fun;
        pub mod huggies_port_fun;
        pub mod huggies_trezu_account_id_fun;
        pub mod huggies_trezu_base_url_fun;
        pub mod huggies_trezu_client_fun;
        pub mod huggies_trezu_error_fun;
        pub mod huggies_trezu_include_hidden_fun;
        pub mod huggies_trezu_treasuries_path_fun;
    }
    pub mod routes {
        pub mod app_router_fun;
        pub mod huggies_trezu_treasuries_route;
        pub mod ping_route;
    }
    pub mod types {
        pub mod huggies_trezu_treasuries_query;
    }
}
// ====================================
// copyright 2026 by sleet.near
