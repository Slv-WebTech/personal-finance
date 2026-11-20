import { describe, expect, it, vi } from 'vitest'
import express from 'express'
import request from 'supertest'
import { errorHandler } from './errorHandler.js'

function appThatThrows(err: unknown) {
  const app = express()
  app.get('/boom', () => {
    throw err
  })
  app.use(errorHandler)
  return app
}

describe('errorHandler', () => {
  it('does not leak internal error messages on 500', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const res = await request(appThatThrows(new Error('secret db detail'))).get('/boom')
    expect(res.status).toBe(500)
    expect(JSON.stringify(res.body)).not.toContain('secret db detail')
  })

  it('maps malformed JSON bodies to 400', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const app = express()
    app.use(express.json())
    app.post('/x', (_req, res) => {
      res.sendStatus(200)
    })
    app.use(errorHandler)
    const res = await request(app).post('/x').set('Content-Type', 'application/json').send('{bad')
    expect(res.status).toBe(400)
  })
})
