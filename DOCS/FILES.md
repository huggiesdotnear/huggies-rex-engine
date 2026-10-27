# FILES

some files/folders

- `frontend/` frontend
  - `frontend/lib/css/` - stylesheets
    - `frontend/lib/css/import.css` - the app-wide base. every page
      links this. it holds the colours, fonts, body, links, buttons,
      main column, nav and auth button.
    - `frontend/lib/css/pages/` - one file per page. a page links its
      own file after the base.
    - `frontend/lib/css/shared/` - one file per shared component. a
      rule lives with the page that owns the component, so two files
      never style the same classes.
    - the older top-level css files are deprecated and move into
      `pages/` as their pages are migrated.
- `src/` backend
- `DOCKER/` - docker setup: multi-stage `Dockerfile`, `docker-compose.yml`.
  see [`DOCKER/README.md`](../DOCKER/README.md). the frontend bundle is baked
  into the image at `/app/static`; there is no vault or database volume yet.
- `middleman/` - ts library for interacting with api's
  - `middleman/intear/` - typed client for the intear api, called
    directly from the browser. does NOT go through our backend, so
    the backend is never rate limited by intear.
  - `middleman/huggies/` - typed client for our own backend routes.
    empty until those routes are added.
- `bin/` - ts files that i can run with bun. see [`bin/README.md`](../bin/README.md)
  for the cli usage.

=========================
<br/>
copyright 2026 by sleet.near
