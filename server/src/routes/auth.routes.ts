import { Router } from 'express'
import { register, login, me } from '../controllers/auth.controller.js'
import { requireAuth } from '../middleware/auth.js'
import { validateBody } from '../middleware/validate.js'
import { registerSchema, loginSchema } from '../utils/validators.js'

const router = Router()

router.post('/register', validateBody(registerSchema), register)
router.post('/login', validateBody(loginSchema), login)
router.get('/me', requireAuth, me)

export default router
