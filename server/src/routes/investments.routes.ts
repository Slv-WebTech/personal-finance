import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { validateBody } from '../middleware/validate.js'
import { createInvestmentSchema, updateInvestmentSchema } from '../utils/validators.js'
import { list, create, getOne, update, remove } from '../controllers/investments.controller.js'

const router = Router()

router.use(requireAuth)

router.get('/', list)
router.post('/', validateBody(createInvestmentSchema), create)
router.get('/:id', getOne)
router.put('/:id', validateBody(updateInvestmentSchema), update)
router.delete('/:id', remove)

export default router
