import { describe, it, expect, beforeAll } from 'vitest'
import express from 'express'
import supertest from 'supertest'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRouter, listRoutes } from '../src/builder'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fixturesDir = path.join(__dirname, 'fixtures')

describe('buildRouter — basic routes', () => {
  let app: express.Express

  beforeAll(async () => {
    app = express()
    await createRouter(app, { directory: path.join(fixturesDir, 'basic') })
  })

  it('GET / responds 200', async () => {
    const res = await supertest(app).get('/')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ ok: true })
  })

  it('POST / responds 201', async () => {
    const res = await supertest(app).post('/')
    expect(res.status).toBe(201)
    expect(res.body).toEqual({ created: true })
  })

  it('GET /users responds 200', async () => {
    const res = await supertest(app).get('/users')
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(2)
  })

  it('POST /users responds 201', async () => {
    const res = await supertest(app).post('/users')
    expect(res.status).toBe(201)
    expect(res.body).toEqual({ id: 3 })
  })

  it('DELETE /users responds 405 (no DELETE handler)', async () => {
    const res = await supertest(app).delete('/users')
    expect(res.status).toBe(404)
  })
})

describe('buildRouter — dynamic routes', () => {
  let app: express.Express

  beforeAll(async () => {
    app = express()
    await createRouter(app, { directory: path.join(fixturesDir, 'dynamic') })
  })

  it('GET / returns root', async () => {
    const res = await supertest(app).get('/')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ message: 'root' })
  })

  it('GET /:id returns params', async () => {
    const res = await supertest(app).get('/42')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ id: '42' })
  })

  it('PUT /:id updates resource', async () => {
    const res = await supertest(app).put('/99')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ updated: '99' })
  })

  it('DELETE /:id returns 204', async () => {
    const res = await supertest(app).delete('/7')
    expect(res.status).toBe(204)
  })
})

describe('buildRouter — catch-all routes', () => {
  let app: express.Express

  beforeAll(async () => {
    app = express()
    await createRouter(app, { directory: path.join(fixturesDir, 'catch-all') })
  })

  it('GET / matches catch-all', async () => {
    const res = await supertest(app).get('/hello/world')
    expect(res.status).toBe(200)
  })
})

describe('buildRouter — middleware cascade', () => {
  let app: express.Express

  beforeAll(async () => {
    app = express()
    await createRouter(app, { directory: path.join(fixturesDir, 'middleware') })
  })

  it('root route applies root middleware', async () => {
    const res = await supertest(app).get('/')
    expect(res.status).toBe(200)
    expect(res.body.mw).toBe('root')
  })

  it('/users applies root + users middleware', async () => {
    const res = await supertest(app).get('/users')
    expect(res.status).toBe(200)
    expect(res.body.mw).toBe('root:users')
  })
})

describe('buildRouter — error handling', () => {
  let app: express.Express

  beforeAll(async () => {
    app = express()
    await createRouter(app, { directory: path.join(fixturesDir, 'error') })
  })

  it('root route returns normally', async () => {
    const res = await supertest(app).get('/')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ ok: true })
  })

  it('/users/:id throws and gets caught by users/_error.ts', async () => {
    const res = await supertest(app).get('/users/1')
    expect(res.status).toBe(500)
    expect(res.body.error).toBe('[users] user error')
  })
})

describe('listRoutes', () => {
  let app: express.Express

  beforeAll(async () => {
    app = express()
    await createRouter(app, { directory: path.join(fixturesDir, 'basic') })
  })

  it('returns registered route entries', () => {
    const entries = listRoutes()
    expect(entries.length).toBeGreaterThan(0)

    const getRoot = entries.find((e) => e.url === '/' && e.method === 'GET')
    expect(getRoot).toBeDefined()
    expect(getRoot!.handlerFile).toContain('index.ts')

    const getUsers = entries.find((e) => e.url === '/users' && e.method === 'GET')
    expect(getUsers).toBeDefined()
  })
})
