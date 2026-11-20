import type { Request, Response } from 'express'
import { UserModel } from '../models/User.js'
import { hashPassword, comparePassword } from '../utils/password.js'
import { signToken } from '../utils/jwt.js'

function toPublicUser(user: { _id: unknown; name: string; email: string; role: string }) {
  return { id: String(user._id), name: user.name, email: user.email, role: user.role }
}

// Compared against when the email is unknown so a login for a missing user costs
// the same bcrypt work as a real one (prevents user enumeration by response time).
const DUMMY_HASH = '$2b$10$p1rbW2XUTE6E7lMPHUr4QuP9V1TZZEOrvCE8aIko0fb86Qb7nyNqm'

export async function register(req: Request, res: Response) {
  const { name, email, password } = req.body as { name: string; email: string; password: string }

  const existing = await UserModel.findOne({ email })
  if (existing) {
    res.status(409).json({ error: { message: 'Email is already registered' } })
    return
  }

  const passwordHash = await hashPassword(password)
  const user = await UserModel.create({ name, email, passwordHash, role: 'customer' })

  const token = signToken({ sub: String(user._id), role: user.role })
  res.status(201).json({ token, user: toPublicUser(user) })
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body as { email: string; password: string }

  const user = await UserModel.findOne({ email })
  const passwordOk = await comparePassword(password, user?.passwordHash ?? DUMMY_HASH)
  if (!user || !passwordOk) {
    res.status(401).json({ error: { message: 'Invalid email or password' } })
    return
  }

  const token = signToken({ sub: String(user._id), role: user.role })
  res.json({ token, user: toPublicUser(user) })
}

export async function me(req: Request, res: Response) {
  const user = await UserModel.findById(req.auth!.sub)
  if (!user) {
    res.status(404).json({ error: { message: 'User not found' } })
    return
  }

  res.json({ user: toPublicUser(user) })
}
