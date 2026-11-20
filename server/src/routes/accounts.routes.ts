import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { validateBody } from '../middleware/validate.js'
import { createAccountSchema, updateAccountSchema } from '../utils/validators.js'
import { list, create, getOne, update, remove } from '../controllers/accounts.controller.js'

const router = Router()

router.use(requireAuth) // every account route requires authentication — no public account routes exist

router.get('/', list)
router.post('/', validateBody(createAccountSchema), create)
router.get('/:id', getOne)
router.put('/:id', validateBody(updateAccountSchema), update)
router.delete('/:id', remove)

export default router
