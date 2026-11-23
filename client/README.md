# Purrfect Stack React client

All application screens are React components: public homepage and availability,
registration/login/logout, profile editing, booking dashboard, creation, editing
and cancellation. React owns application state and rendering; no HTML-string
injection or legacy DOM event handlers are used. Vite bundles React and Bootstrap.

## Run

With Node.js 22.12+ or a current supported version:

```sh
cd client
npm ci
npm run dev
```

## Build and deploy

```sh
npm run build
npm run preview
```

Deploy `client/dist` as a static site after building. This commit does not change
the Express server's routes or its existing Render deployment.
The API defaults to the Render URL in the repository README. Set `VITE_API_URL`
at build time, or use Connection settings in the footer for a local API.
JWTs are session-scoped. Switching API origins logs the user out.

Only existing endpoints are used. Booking cancellation calls the backend's
DELETE endpoint, which changes status to cancelled rather than deleting data.
No history, payments, or cat catalog endpoint is implemented or assumed.

External libraries: React/ReactDOM (Meta, react.dev), Vite (vite.dev), Bootstrap
(getbootstrap.com). Images: Unsplash. Team details follow the supplied slides.

Verification: production build succeeded and dependency audit reported no known
vulnerabilities at migration time. Live authenticated API and browser visual
checks are not covered by the build verification.
