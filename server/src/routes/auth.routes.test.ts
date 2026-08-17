import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import mongoose from 'mongoose'
import { createApp } from '../app.js'
import { UserModel } from '../models/User.js'

const app = createApp()

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI!)
})

afterAll(async () => {
  await mongoose.connection.dropDatabase()
  await mongoose.disconnect()
})

beforeEach(async () => {
  await UserModel.deleteMany({})
})

describe('POST /api/auth/register', () => {
  it('creates a user and returns a token', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      password: 'password123',
    })

    expect(res.status).toBe(201)
    expect(res.body.token).toBeTypeOf('string')
    expect(res.body.user).toMatchObject({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      role: 'customer',
    })
    expect(res.body.user.passwordHash).toBeUndefined()
  })

  it('rejects a duplicate email', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'A', email: 'dupe@example.com', password: 'password123' })

    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'B', email: 'dupe@example.com', password: 'password123' })

    expect(res.status).toBe(409)
  })

  it('rejects an invalid payload', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: '', email: 'not-an-email', password: '123' })

    expect(res.status).toBe(400)
  })

  it('ignores a client-supplied role and always creates a customer', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Eve',
      email: 'eve@example.com',
      password: 'password123',
      role: 'admin',
    })

    expect(res.status).toBe(201)
    expect(res.body.user.role).toBe('customer')
  })
})

describe('POST /api/auth/login', () => {
  it('accepts correct credentials and rejects incorrect ones', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'Grace Hopper', email: 'grace@example.com', password: 'password123' })

    const good = await request(app)
      .post('/api/auth/login')
      .send({ email: 'grace@example.com', password: 'password123' })
    expect(good.status).toBe(200)
    expect(good.body.token).toBeTypeOf('string')

    const bad = await request(app)
      .post('/api/auth/login')
      .send({ email: 'grace@example.com', password: 'wrong-password' })
    expect(bad.status).toBe(401)
  })
})

describe('GET /api/auth/me', () => {
  it('returns the authenticated user with a valid token, and 401 without one', async () => {
    const register = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Linus Torvalds', email: 'linus@example.com', password: 'password123' })
    const token = register.body.token

    const authed = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`)
    expect(authed.status).toBe(200)
    expect(authed.body.user.email).toBe('linus@example.com')

    const unauthed = await request(app).get('/api/auth/me')
    expect(unauthed.status).toBe(401)
  })
})
