# fs-router-express

**File-based routing for Express.js** — drop files in a `routes` folder, get API endpoints automatically. Zero configuration, zero dependencies.

```ts
import express from 'express'
import { createRouter } from 'fs-router-express'

const app = express()
await createRouter(app) // scans ./routes
app.listen(3000)
```

---

## Features

- **Zero config** — routes work immediately when you create a file
- **Dynamic params** — `[id].ts` → `/:id`
- **Catch-all routes** — `[...slug].ts` → `/:slug(*)`
- **HTTP method exports** — `export const GET`, `POST`, `PUT`, `DELETE` in route files
- **Middleware cascade** — `_middleware.ts` applies hierarchically (parent → child)
- **Error boundaries** — `_error.ts` catches errors per directory scope
- **Route config** — `_config.ts` to restrict methods per directory
- **Route listing** — `listRoutes()` for debugging
- **TypeScript first** — full type inference with strict types
- **0 runtime dependencies** — lightweight and secure
- **Express 4 & 5** — compatible with both major versions

---

## Installation

```sh
npm install fs-router-express
```

`express` must be installed as a peer dependency:

```sh
npm install express
```

---

## Quick Start

**1. Create a `routes` folder with an index file:**

```
routes/
└── index.ts
```

```ts
// routes/index.ts
export const GET = (req, res) => {
  res.json({ message: 'Hello, world!' })
}
```

**2. Wire it up in your app:**

```ts
// app.ts
import express from 'express'
import { createRouter } from 'fs-router-express'

const app = express()
await createRouter(app)

app.listen(3000)
```

**3. Start the server:**

```sh
npx tsx app.ts
```

Visit `http://localhost:3000` → `{ "message": "Hello, world!" }`

---

## Directory Conventions

```
routes/
├── index.ts                        → GET /
├── users/
│   ├── index.ts                    → GET /users, POST /users
│   ├── _middleware.ts              → applies to /users/*
│   ├── [id].ts                     → GET /users/:id, PUT /users/:id
│   └── posts/
│       └── index.ts                → GET /users/:id/posts
├── products/
│   ├── _config.ts                  → restricts methods for /products/*
│   └── [slug]/
│       └── comments.ts             → GET /products/:slug/comments
├── blog/
│   └── [...slug].ts                → GET /blog/* (catch-all)
└── _error.ts                       → global error handler
```

| Convention | File pattern | Purpose |
|---|---|---|
| **Route** | `index.ts` | Maps to parent directory path (`/users` → `GET /users`) |
| **Route** | `name.ts` | Maps to `/name` (`users.ts` → `GET /users`) |
| **Dynamic** | `[param].ts` | Maps to `/:param` (`[id].ts` → `/:id`) |
| **Catch-all** | `[...slug].ts` | Maps to `/:slug(*)` (matches 0+ segments) |
| **Middleware** | `_middleware.ts` | Runs before all routes in that directory and subdirectories |
| **Error handler** | `_error.ts` | Catches errors thrown by routes in that directory |
| **Config** | `_config.ts` | Per-directory configuration (e.g., method restriction) |

---

## Route Files

### HTTP Method Exports

Export named functions matching HTTP methods:

```ts
// routes/users/[id].ts
import type { Request, Response } from 'express'

export const GET = (req: Request, res: Response) => {
  res.json({ id: req.params.id })
}

export const PUT = (req: Request, res: Response) => {
  res.json({ updated: req.params.id })
}

export const DELETE = (req: Request, res: Response) => {
  res.status(204).send()
}
```

Supported exports: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`, `HEAD`.

### Default Export

A `default` export is registered with `router.all()`, responding to any HTTP method:

```ts
// routes/health.ts
export default (req, res) => {
  res.json({ status: 'ok' })
}
```

You can also export an array of middleware + handler:

```ts
export default [authMiddleware, (req, res) => { /* ... */ }]
```

Or an object with method keys:

```ts
export default {
  get(req, res) { /* ... */ },
  post(req, res) { /* ... */ },
}
```

---

## Dynamic Routes

Use `[param]` in filenames to capture URL segments:

```
routes/
├── users/
│   └── [id].ts           → GET /users/:id
└── products/
    └── [slug]/
        └── index.ts      → GET /products/:slug
```

```ts
// routes/users/[id].ts
export const GET = (req, res) => {
  // req.params.id → '42' for GET /users/42
  res.json({ id: req.params.id })
}
```

---

## Catch-All Routes

Use `[...slug]` to match multiple URL segments:

```
routes/
└── blog/
    └── [...slug].ts       → GET /blog/2024/12/post-title
```

```ts
// routes/blog/[...slug].ts
export const GET = (req, res) => {
  // req.params[0] → '2024/12/post-title'
  res.json({ path: req.params[0] })
}
```

Catch-all routes have the lowest priority — static and dynamic routes are matched first.

---

## Middleware Cascade

Place `_middleware.ts` files to apply middleware hierarchically:

```
routes/
├── _middleware.ts                ← runs BEFORE every route
├── index.ts                      → GET /
├── users/
│   ├── _middleware.ts            ← runs BEFORE /users/* routes only
│   ├── index.ts                  → GET /users (gets root + users middleware)
│   └── [id].ts                   → GET /users/:id (gets root + users middleware)
└── products/
    └── index.ts                  → GET /products (gets root middleware only)
```

**Execution order:** root middleware → parent middleware → ... → route handler

```ts
// routes/_middleware.ts
export default (req, res, next) => {
  req.startTime = Date.now()
  next()
}

// routes/users/_middleware.ts
import { authenticate } from '../lib/auth'
export default [authenticate, logger]
```

Middleware files can export:
- A single function `(req, res, next) => void`
- An array of middleware functions (executed in order)

---

## Error Handling

Place `_error.ts` files to catch errors within a directory scope:

```
routes/
├── _error.ts                     ← catches errors from ALL routes
├── users/
│   ├── _error.ts                 ← catches errors from /users/* first
│   └── [id].ts
└── products/
    └── index.ts
```

**Error propagation:** Deepest error handler catches first, then falls through to parent.

```ts
// routes/users/_error.ts
export default (err, req, res, next) => {
  console.error(`[users] ${err.message}`)
  res.status(500).json({ error: `[users] ${err.message}` })
}
```

Error handlers receive the standard Express error middleware signature: `(err, req, res, next)`.

If no `_error.ts` catches the error, Express's default error handler returns a 500 response.

---

## Configuration (`_config.ts`)

Place `_config.ts` files to configure behavior for an entire directory subtree:

```
routes/
├── _config.ts                    ← restricts ALL routes to GET only
└── users/
    ├── _config.ts                ← overrides parent for /users/* (GET + POST)
    └── index.ts
```

```ts
// routes/_config.ts
export const config = {
  methods: ['GET'],  // only GET is allowed for all routes
}

// routes/users/_config.ts
export const config = {
  methods: ['GET', 'POST'],  // overrides parent for /users subtree
}
```

**Resolution rules:**
- Root `_config.ts` applies to all routes
- Child `_config.ts` overrides parent for matching subtree
- Unrelated routes inherit the nearest ancestor config

---

## Route Listing

Debug your registered routes at runtime:

```ts
import { listRoutes } from 'fs-router-express'

console.table(listRoutes())
// [
//   { method: 'GET',  url: '/',           handlerFile: '/.../routes/index.ts' },
//   { method: 'GET',  url: '/users',      handlerFile: '/.../routes/users/index.ts' },
//   { method: 'POST', url: '/users',      handlerFile: '/.../routes/users/index.ts' },
//   { method: 'GET',  url: '/users/:id',  handlerFile: '/.../routes/users/[id].ts' },
// ]
```

---

## API Reference

### `createRouter(app, options?)`

Attaches routes to an Express application. The primary entry point.

```ts
import express from 'express'
import { createRouter } from 'fs-router-express'

const app = express()
await createRouter(app)
await createRouter(app, { directory: './api' })
```

### `router(options?)`

Returns a configured Express Router without attaching it to an app.

```ts
import express from 'express'
import { router } from 'fs-router-express'

const app = express()
app.use('/api', await router({ directory: './routes' }))
```

### `buildRouter(options?)`

Low-level function — same as `router()` but returns the raw `Router` instance.

### `listRoutes()`

Returns an array of `RouteEntry` objects showing all registered routes.

```ts
type RouteEntry = {
  method: string      // 'GET', 'POST', 'ALL', etc.
  url: string         // '/users/:id'
  handlerFile: string // absolute path to the route file
}
```

### Options

```ts
type Options = {
  directory?: string          // path to routes folder (default: './routes')
  extensions?: string[]       // file extensions to scan (default: ['.ts', '.js', '.mjs'])
  additionalMethods?: string[] // extra HTTP methods to support (e.g. ['WS'])
}
```

---

## Supported File Extensions

| Extension | Support |
|---|---|
| `.ts` | TypeScript (requires tsx/ts-node at runtime) |
| `.js` | JavaScript ESM (requires `"type": "module"` in package.json) |
| `.mjs` | Explicit ES module JavaScript |

Files ending in `.d.ts` are automatically ignored.

---

## Priority & Route Matching

Routes are sorted by priority at startup:

| Type | Example | Priority |
|---|---|---|
| Static | `/users` | Lowest (matched first) |
| Dynamic | `/users/:id` | Medium |
| Catch-all | `/:slug(*)` | Highest (matched last) |

Within the same type, deeper paths have higher priority (more specific routes match first).

---

## Package Size

| Format | Size |
|---|---|
| ESM | ~11 KB |
| CJS | ~14 KB |
| Dependencies | **0** |

---

## Examples

### Complete REST API

```
routes/
├── index.ts              → GET /
├── users/
│   ├── index.ts          → GET /users, POST /users
│   └── [id].ts           → GET /users/:id, PUT /users/:id, DELETE /users/:id
└── products/
    ├── _middleware.ts     → auth middleware
    ├── index.ts          → GET /products, POST /products
    └── [id].ts           → GET /products/:id
```

```ts
// routes/users/index.ts
export const GET = async (req, res) => {
  const users = await db.findMany('users')
  res.json(users)
}

export const POST = async (req, res) => {
  const user = await db.create('users', req.body)
  res.status(201).json(user)
}
```

```ts
// routes/users/[id].ts
export const GET = async (req, res) => {
  const user = await db.findOne('users', req.params.id)
  if (!user) return res.status(404).json({ error: 'Not found' })
  res.json(user)
}

export const PUT = async (req, res) => {
  const user = await db.update('users', req.params.id, req.body)
  res.json(user)
}

export const DELETE = async (req, res) => {
  await db.delete('users', req.params.id)
  res.status(204).send()
}
```

---

## FAQ

### Do I need to restart the server when I add a new route?

Yes. Routes are scanned once at startup. Hot-reload is not currently supported — use `nodemon` or `tsx watch` during development.

### Can I use this with Express 5?

Yes. `fs-router-express` supports Express 4.x and 5.x.

### Can I nest routes arbitrarily deep?

Yes. There's no limit on directory nesting — each level becomes a URL segment.

### What happens if two files map to the same route?

Static files take priority over dynamic files. If two static files map to the same route (e.g., `users.ts` and `users/index.ts`), the behavior depends on Express's route ordering.

### How do I add global middleware (CORS, body parsing, etc.)?

Add those to your Express app as usual — they run before the file-based router:

```ts
const app = express()
app.use(cors())
app.use(express.json())
await createRouter(app)
```

---

## License

MIT
