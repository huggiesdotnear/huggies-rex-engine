# FILES

some files/folders

- `frontend/` frontend
  - `frontend/lib/css/` - stylesheets
    - `frontend/lib/css/import.css` - the app-wide base. every page
      links this. it pulls in the files in `base/`.
    - `frontend/lib/css/import-<page>.css` - one per page, holding only
      import statements. a page links this after the base. a page with
      nothing of its own gets no such file.
    - `frontend/lib/css/base/` - the app-wide rules: colours, fonts,
      body, links, buttons, the main column, the nav and the auth
      button.
    - `frontend/lib/css/pages/` - the rules a page owns.
    - `frontend/lib/css/shared/` - the rules a shared component owns.
    - `frontend/lib/css/legacy/` - deprecated files, waiting for their
      page to migrate into `pages/`.
- `src/` backend
- `DOCKER/` - docker setup: multi-stage `Dockerfile`, `docker-compose.yml`.
  see [`DOCKER/README.md`](../DOCKER/README.md). the frontend bundle is baked
  into the image at `/app/static`; there is no vault or database volume yet.
- `middleman/` - ts library for interacting with api's
  - `middleman/intear/` - typed client for the intear api, called
    directly from the browser. does NOT go through our backend, so
    the backend is never rate limited by intear.
  - `middleman/huggies/` - typed client for our own backend routes.
    holds the trezu proxy client, named after the api it fronts
    (`api_trezu_*`), not after us.
- `bin/` - ts files that i can run with bun. see [`bin/README.md`](../bin/README.md)
  for the cli usage.

=========================
<br/>
copyright 2026 by sleet.near
