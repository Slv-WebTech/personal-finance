import { z } from 'zod'

// Registration never accepts a client-supplied `role` — every new account is
// a `customer`. Advisor/admin provisioning is an open product question
// (see PROJECT_PLAN.md) and must not be reachable through the public endpoint.
export const registerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})
