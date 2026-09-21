// Vitest setup for the web app.
//
// Component/route tests (e.g. ProtectedRoute.test.tsx) render with
// @testing-library/react and assert against the DOM using its `screen` queries
// plus Vitest's built-in matchers — no jest-dom needed. The API-client tests
// (src/lib/api.test.ts) stub `globalThis.fetch` per-case, so there is nothing
// global to wire up here beyond this stable entry point.
export {};
