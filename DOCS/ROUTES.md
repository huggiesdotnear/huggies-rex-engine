# ROUTES

routes and pages

- `/` - serve the static folder

### `/api/huggies/` - huggies specifics

user info and session managmnets

- `/api/huggies/?????` - replace this with acctual bullet points of routes

### `/api/near/` near blockchain interaction

- 👀 `/api/near/contract/{contract_id}/{method}`
- 👀 `/api/near/token/`

### intear

the intear api is NOT proxied through our backend. `middleman/intear/`
calls `https://api.intea.rs` directly from the browser, so there are
no `/api/intear/*` routes here and our backend is never rate limited
by intear.

=====================
<br/>
copyright 2026 by sleet.near
