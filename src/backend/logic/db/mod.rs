// ========================================
// DB
// everything that touches the sqlite database.
//
// --- WHY --- these live together: the pool, the schema that creates
// the tables and the path the db file sits at are three halves of one
// thing — the storage. a change to any of them is a change to how the
// app stores its data, so they belong in one folder.
// ========================================
pub mod db_open_fun;
pub mod db_schema;
pub mod vault_db_path_fun;
// ========================================
// copyright 2026 by sleet.near
// ========================================
