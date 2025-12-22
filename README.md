# Nuxt Minimal Starter

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.
"# iot-core-frontend" 

## Telemetry integration

The dashboard's `SingleMetricChart` now issues API calls whenever the selected metric or timeframe changes. Configure the backend URL in `config/api.ts` via the new `apiConfig.sensorData` entry (defaults to `http://127.0.0.1:3000/api`). The component expects the endpoint to accept `device_id`, `start`, `end`, and `interval` query parameters, returning an array of history points that include timestamps and numeric readings.
