// ========================================
// SHIT_1170_SQL_LIST_FUN
// the builder for the feed's list statements: a sql string with
// NUMBERED placeholders and the values that go with them.
//
// --- WHY --- THIS EXISTS: the feed's list statements are BUILT, because
// the account list and the contract list have a length that is only
// known at runtime. a built statement has to be built two ways at once —
// the sql and the values — and the two have to line up exactly.
//
// --- WHY --- THE PLACEHOLDERS ARE NUMBERED (`?1`, `?2`) AND NOT PLAIN
// (`?`): a plain `?` is numbered by sqlite itself, in the order it
// appears, and that order is decided by sqlite and not by us. a
// numbered `?N` says which value goes where, and the number is the
// index into the value list. so the sql and the list are written
// together and the number IS the position — there is no second thing
// to keep in step.
//
// --- WHY --- THE VALUES ARE A LIST AND NOT A CHAIN OF `.bind()` CALLS:
// a statement that binds an id in one place and a number in another
// cannot be built out of one chain, because the chain's types have to
// match. the values go into a list and the builder binds them one by
// one, in the order the numbers say.
//
// --- WHY --- THE VALUES CARRY THEIR OWN TYPE: a number bound as text is
// compared as text by sqlite, and `created_at < '123'` sorts wrongly.
// so the value says whether it is text or a number, and the bind keeps
// that.
use sqlx::Sqlite;
// ========================================
// --- TYPES ------------------------------
// one value a statement binds.
#[derive(Debug, Clone)]
pub enum SqliteBind {
    // text.
    Text(String),
    // a whole number.
    Int(i64),
}

// a statement being built: the sql and the values.
#[derive(Debug, Clone)]
pub struct SqliteListBuilder {
    // the sql so far.
    sql: String,
    // the values, in the order their numbers say.
    values: Vec<SqliteBind>,
}
// ========================================
// --- BUILD -----------------------------
// a builder for one statement.
impl SqliteListBuilder {
    // a builder that starts with the given sql.
    pub fn new_fun(sql: &str) -> Self {
        SqliteListBuilder {
            sql: sql.to_string(),
            values: Vec::new(),
        }
    }

    // write LITERAL sql onto the statement.
    //
    // --- WHY --- IT IS LITERAL AND NOT BOUND: the sql this builder
    // writes is written by us and not by a caller, so it holds no
    // untrusted text. every value a caller sent goes in through
    // `push_bind`.
    pub fn push_text_fun(&mut self, text: &str) {
        self.sql.push_str(text);
    }

    // bind one value and put its placeholder in the sql.
    //
    // --- WHY --- THE PLACEHOLDER IS THE POSITION: the number is the
    // index into the value list, and the value list is in the order the
    // values were bound. so the two cannot drift apart.
    pub fn push_bind_fun(&mut self, value: SqliteBind) {
        self.values.push(value);
        self.sql.push_str(&format!("?{}", self.values.len()));
    }

    // bind a list of text values into an `IN (...)` and put the
    // placeholders in.
    //
    // --- WHY --- THE LIST IS EMPTY-SAFE: an empty `IN ()` is a syntax
    // error in sqlite, so the caller must not write the `IN` at all when
    // the list is empty. this returns false and writes nothing when the
    // list is empty, and the caller skips the clause.
    pub fn push_in_fun(&mut self, ids: &[String]) -> bool {
        if ids.is_empty() {
            return false;
        }
        self.sql.push_str("IN (");
        for (index, id) in ids.iter().enumerate() {
            if index > 0 {
                self.sql.push_str(", ");
            }
            self.push_bind_fun(SqliteBind::Text(id.clone()));
        }
        self.sql.push(')');
        true
    }

    // the statement, ready to run.
    pub fn build_fun(&self) -> SqliteListStatement {
        SqliteListStatement {
            sql: self.sql.clone(),
            values: self.values.clone(),
        }
    }
}
// ========================================
// --- STATEMENT -------------------------
// a built statement: the sql and the values.
pub struct SqliteListStatement {
    // the sql.
    sql: String,
    // the values, in the order their numbers say.
    values: Vec<SqliteBind>,
}

impl SqliteListStatement {
    // the sql.
    pub fn sql_fun(&self) -> &str {
        &self.sql
    }

    // the values.
    pub fn values_fun(&self) -> &[SqliteBind] {
        &self.values
    }

    // bind every value onto a statement.
    //
    // --- WHY --- THE BIND IS BY POSITION AND NOT BY NUMBER: the
    // placeholders are numbered and the values are in the same order,
    // and sqlite reads them left to right. the two line up because they
    // were written together.
    pub fn bind_all_fun<'q>(self) -> sqlx::query::Query<'q, Sqlite, sqlx::sqlite::SqliteArguments> {
        let mut statement = sqlx::query(sqlx::AssertSqlSafe(self.sql.as_str()));
        for value in &self.values {
            statement = match value {
                SqliteBind::Text(text) => statement.bind(text.as_str()),
                SqliteBind::Int(number) => statement.bind(*number),
            };
        }
        statement
    }
}
// ========================================
// copyright 2026 by sleet.near
// ========================================
