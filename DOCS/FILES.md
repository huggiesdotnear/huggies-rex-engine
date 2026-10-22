# FILES

some files/folders

- `frontend/` frontend
- `src/` backend
- `DOCKER/` - docker setup: multi-stage `Dockerfile`, `docker-compose.yml`.
  see [`DOCKER/README.md`](../DOCKER/README.md). the frontend bundle is baked
  into the image at `/app/static`; there is no vault or database volume yet.
- `middleman/` - ts library for interacting with api's
  - `middleman/intear/` - typed client for the intear api, called
    directly from the browser. does NOT go through our backend, so
    the backend is never rate limited by intear.
  - `middleman/huggies/` - typed client for our own backend routes
    under `/api/huggies/`. empty until those routes are added.
- `bin/` - ts files that i can run with bun. see [`bin/README.md`](../bin/README.md)
  for the cli usage.

=========================
<br/>
copyright 2026 by sleet.near
