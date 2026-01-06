# IoT Core Frontend

This Nuxt 3 project hosts the dashboard and device control experience for the IoT Core platform. It ships with a component-driven layout, reusable composables, and configuration helpers so you can connect live device telemetry via REST APIs.

## Getting started

### Prerequisites

- Node.js 18+ (LTS)
- Yarn/npm 9+ (or your package manager of choice)
- Backend services running on their configured ports (`apiConfig` in `frontend/config/api.ts`)

### Install

```bash
yarn install
```

You can also use `npm install` if you prefer.

### Run

- Development: `yarn dev`
- Production build: `yarn build`
- Preview build: `yarn preview`

These commands delegate to the Nuxt CLI and run inside `frontend/`. The dev server defaults to `http://localhost:3000`.

## Directory structure

- `app/`: Nuxt app config and layouts.
  - `components/`: Reusable UI pieces grouped by feature, including `devices-control` sections and charts.
- `composables/`: Vue composables that keep logic portable (charts, filters, helpers).
  - `assets/`: Static styles, fonts, or images used across the app.
  - `config/`: Centralized configuration (e.g., `api.ts` defines external service endpoints).
  - `pages/`: Nuxt pages that render the high-level views.
  - `middleware/`, `plugins/`, `stores/`: Standard Nuxt runtime hooks and Pinia stores (if applicable).
  - `types/`: Shared TypeScript definitions for devices, dashboards, etc.

## API configuration

Edit `frontend/config/api.ts` to point the frontend at your backend endpoints; e.g., `apiConfig.server` drives the chart API calls and device exports. Keep the `auth` and `controlModule` entries aligned with the Laravel or Node services in the repo.

## Notes

- Device views now rely solely on REST/HTTP responses for telemetry and filters.
- Run `yarn lint` or `yarn test` if you introduce new features or want to validate formatting.
