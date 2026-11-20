import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { validateBody } from '../middleware/validate.js'
import { createBudgetSchema, updateBudgetSchema } from '../utils/validators.js'
import { list, create, getOne, update, remove } from '../controllers/budgets.controller.js'

const router = Router()

router.use(requireAuth)

router.get('/', list)
router.post('/', validateBody(createBudgetSchema), create)
router.get('/:id', getOne)
router.put('/:id', validateBody(updateBudgetSchema), update)
router.delete('/:id', remove)

export default router
