// shit_1170_rex_engine
// ====================================
#![allow(non_camel_case_types)]
#![allow(non_snake_case)]
// ====================================
pub mod backend {
    pub mod logic {
        pub mod db;
        pub mod endpoint_shit_1170_api_keys;
        pub mod endpoint_shit_1170_swap_queue;
        pub mod endpoint_shit_1170_tx_queue;
        pub mod endpoint_trezu;
        pub mod feed_ws;
        pub mod server;
    }
    pub mod routes {
        pub mod api_key_me_route;
        #[cfg(test)]
        pub mod api_key_prefix_test;
        pub mod api_key_rotate_route;
        pub mod api_keys_route;
        pub mod app_router_fun;
        pub mod feed_ws_route;
        #[cfg(test)]
        pub mod feed_ws_route_test;
        pub mod ping_route;
        pub mod swap_queue_accounts_delete_route;
        pub mod swap_queue_accounts_route;
        pub mod swap_queue_one_route;
        pub mod swap_queue_route;
        #[cfg(test)]
        pub mod swap_queue_route_test;
        pub mod swap_queue_sent_route;
        pub mod trezu_treasuries_route;
        pub mod tx_queue_accounts_delete_route;
        pub mod tx_queue_accounts_route;
        pub mod tx_queue_facets_route;
        pub mod tx_queue_one_route;
        pub mod tx_queue_route;
        #[cfg(test)]
        pub mod tx_queue_route_test;
        pub mod tx_queue_sent_route;
        pub mod tx_queue_stats_contracts_route;
        pub mod tx_queue_stats_methods_route;
    }
    pub mod types {
        pub mod api_keys_request;
        pub mod shit_1170_query_list_fun;
        pub mod shit_1170_sql_list_fun;
        pub mod swap_queue_query;
        pub mod swap_queue_request;
        pub mod trezu_treasuries_query;
        pub mod tx_queue_facets_request;
        pub mod tx_queue_query;
        pub mod tx_queue_request;
    }
}
// ====================================
// copyright 2026 by sleet.near
