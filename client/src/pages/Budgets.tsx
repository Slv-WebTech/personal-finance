import { useEffect, useId, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import AppShell from '../components/layout/AppShell'
import Alert from '../components/ui/Alert'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Modal from '../components/ui/Modal'
import ProgressBar from '../components/ui/ProgressBar'
import Select from '../components/ui/Select'
import type { SelectOption } from '../components/ui/Select'
import Spinner from '../components/ui/Spinner'
import TextField from '../components/ui/TextField'
import { createBudget, deleteBudget, listBudgets, updateBudget } from '../services/budgetService'
import { ApiError } from '../types/api'
import type { Budget, BudgetInput, BudgetUsage } from '../types/budget'
import styles from './Budgets.module.css'

const CURRENT_YEAR = new Date().getFullYear()

const MONTH_OPTIONS: SelectOption[] = Array.from({ length: 12 }, (_, index) => ({
  value: String(index + 1),
  label: new Date(2000, index, 1).toLocaleString(undefined, { month: 'long' }),
}))

const YEAR_OPTIONS: SelectOption[] = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1].map((year) => ({
  value: String(year),
  label: String(year),
}))

interface BudgetFormState {
  category: string
  monthlyLimit: string
  month: number
  year: number
}

function defaultFormState(month: number, year: number): BudgetFormState {
  return {
    category: '',
    monthlyLimit: '',
    month,
    year,
  }
}

function budgetToFormState(budget: Budget): BudgetFormState {
  return {
    category: budget.category,
    // Keep the <input type="number"> value as a string so the field stays controlled
    // from the start instead of switching from uncontrolled to controlled once loaded.
    monthlyLimit: String(budget.monthlyLimit),
    month: budget.month,
    year: budget.year,
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(amount)
}

function formatPeriod(month: number, year: number): string {
  return `${new Date(year, month - 1).toLocaleString(undefined, { month: 'long' })} ${year}`
}

function progressTone(usage: BudgetUsage): 'success' | 'warning' | 'danger' {
  if (usage.isOverBudget) return 'danger'
  if (usage.percentUsed >= 80) return 'warning'
  return 'success'
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 7h16M9 7V4h6v3m-9 0 1 13h10l1-13"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function Budgets() {
  const formId = useId()

  const [month, setMonth] = useState(() => new Date().getMonth() + 1)
  const [year, setYear] = useState(() => new Date().getFullYear())

  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [isModalOpen, setModalOpen] = useState(false)
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)
  const [form, setForm] = useState<BudgetFormState>(() => defaultFormState(month, year))
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const [deleteTarget, setDeleteTarget] = useState<Budget | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  async function loadBudgets(targetMonth: number, targetYear: number) {
    setLoading(true)
    setLoadError(null)
    try {
      const data = await listBudgets({ month: targetMonth, year: targetYear })
      setBudgets(data)
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBudgets(month, year)
  }, [month, year])

  useEffect(() => {
    if (!successMessage) return
    const timer = setTimeout(() => setSuccessMessage(null), 4000)
    return () => clearTimeout(timer)
  }, [successMessage])

  function updateField<K extends keyof BudgetFormState>(key: K, value: BudgetFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function openCreateModal() {
    setEditingBudget(null)
    setForm(defaultFormState(month, year))
    setFormError(null)
    setFieldErrors({})
    setModalOpen(true)
  }

  function openEditModal(budget: Budget) {
    setEditingBudget(budget)
    setForm(budgetToFormState(budget))
    setFormError(null)
    setFieldErrors({})
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return

    setFormError(null)
    setFieldErrors({})
    setSubmitting(true)

    const payload: BudgetInput = {
      category: form.category.trim(),
      monthlyLimit: Number(form.monthlyLimit),
      month: form.month,
      year: form.year,
    }

    try {
      if (editingBudget) {
        await updateBudget(editingBudget.id, payload)
      } else {
        await createBudget(payload)
      }
      await loadBudgets(month, year)
      setModalOpen(false)
      setSuccessMessage(editingBudget ? 'Budget updated.' : 'Budget created.')
    } catch (err) {
      if (err instanceof ApiError) {
        const nextFieldErrors: Record<string, string> = {}
        for (const issue of err.fieldErrors) {
          nextFieldErrors[issue.path] = issue.message
        }
        if (Object.keys(nextFieldErrors).length > 0) {
          setFieldErrors(nextFieldErrors)
        } else {
          setFormError(err.message)
        }
      } else {
        setFormError('Something went wrong. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  function closeDeleteModal() {
    if (deleting) return
    setDeleteTarget(null)
    setDeleteError(null)
  }

  async function confirmDelete() {
    if (!deleteTarget || deleting) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteBudget(deleteTarget.id)
      await loadBudgets(month, year)
      setDeleteTarget(null)
      setSuccessMessage('Budget deleted.')
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AppShell>
      <div className={styles.content}>
        <div className={styles.header}>
          <h1 className={styles.title}>Budgets</h1>
          <Button onClick={openCreateModal}>Add a budget</Button>
        </div>

        <div className={styles.periodBar}>
          <Select
            label="Month"
            className={styles.periodField}
            options={MONTH_OPTIONS}
            value={String(month)}
            onChange={(event: ChangeEvent<HTMLSelectElement>) => setMonth(Number(event.target.value))}
          />
          <Select
            label="Year"
            className={styles.periodField}
            options={YEAR_OPTIONS}
            value={String(year)}
            onChange={(event: ChangeEvent<HTMLSelectElement>) => setYear(Number(event.target.value))}
          />
        </div>

        {successMessage && (
          <Alert variant="success" className={styles.successAlert}>
            {successMessage}
          </Alert>
        )}

        {loading && (
          <div className={styles.loadingWrap}>
            <Spinner size={28} label="Loading budgets…" />
          </div>
        )}

        {!loading && loadError && (
          <Alert variant="error" title="Couldn't load budgets">
            <div className={styles.errorBody}>
              <p>{loadError}</p>
              <Button variant="secondary" size="sm" onClick={() => loadBudgets(month, year)}>
                Retry
              </Button>
            </div>
          </Alert>
        )}

        {!loading && !loadError && budgets.length === 0 && (
          <Card className={styles.emptyCard}>
            <p className={styles.emptyText}>No budgets set for {formatPeriod(month, year)} yet.</p>
            <Button onClick={openCreateModal}>Add a budget</Button>
          </Card>
        )}

        {!loading && !loadError && budgets.length > 0 && (
          <div className={styles.budgetGrid}>
            {budgets.map((budget) => (
              <Card key={budget.id} className={styles.budgetCard}>
                <div className={styles.budgetHeader}>
                  <h2 className={styles.budgetCategory}>{budget.category}</h2>
                  <Badge tone={budget.usage.isOverBudget ? 'warning' : 'success'}>
                    {budget.usage.isOverBudget ? 'Over budget' : `${Math.round(budget.usage.percentUsed)}% used`}
                  </Badge>
                </div>
                <ProgressBar
                  value={budget.usage.percentUsed}
                  tone={progressTone(budget.usage)}
                  label={`${budget.category} budget usage`}
                />
                <p className={styles.budgetAmounts}>
                  {formatCurrency(budget.usage.spent)} of {formatCurrency(budget.usage.limit)} spent
                </p>
                <div className={styles.actions}>
                  <Button variant="ghost" size="sm" onClick={() => openEditModal(budget)}>
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={styles.deleteButton}
                    leftIcon={<TrashIcon />}
                    onClick={() => setDeleteTarget(budget)}
                  >
                    Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingBudget ? 'Edit budget' : 'Add a budget'}
        footer={
          <>
            <Button variant="secondary" onClick={closeModal} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" form={formId} isLoading={submitting}>
              {editingBudget ? 'Save changes' : 'Add budget'}
            </Button>
          </>
        }
      >
        <form id={formId} className={styles.form} onSubmit={handleSubmit}>
          {formError && <Alert variant="error">{formError}</Alert>}
          <TextField
            label="Category"
            name="category"
            required
            value={form.category}
            onChange={(event: ChangeEvent<HTMLInputElement>) => updateField('category', event.target.value)}
            error={fieldErrors.category}
          />
          <TextField
            label="Monthly limit"
            name="monthlyLimit"
            type="number"
            step="0.01"
            required
            value={form.monthlyLimit}
            onChange={(event: ChangeEvent<HTMLInputElement>) => updateField('monthlyLimit', event.target.value)}
            error={fieldErrors.monthlyLimit}
          />
          <Select
            label="Month"
            name="month"
            options={MONTH_OPTIONS}
            value={String(form.month)}
            onChange={(event: ChangeEvent<HTMLSelectElement>) => updateField('month', Number(event.target.value))}
            error={fieldErrors.month}
          />
          <Select
            label="Year"
            name="year"
            options={YEAR_OPTIONS}
            value={String(form.year)}
            onChange={(event: ChangeEvent<HTMLSelectElement>) => updateField('year', Number(event.target.value))}
            error={fieldErrors.year}
          />
        </form>
      </Modal>

      <Modal
        isOpen={deleteTarget !== null}
        onClose={closeDeleteModal}
        title="Delete budget?"
        footer={
          <>
            <Button variant="secondary" onClick={closeDeleteModal} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="danger" isLoading={deleting} onClick={confirmDelete}>
              Delete
            </Button>
          </>
        }
      >
        <div className={styles.deleteBody}>
          {deleteError && <Alert variant="error">{deleteError}</Alert>}
          <Alert variant="warning">
            This can&apos;t be undone.
            {deleteTarget && ` The "${deleteTarget.category}" budget will be permanently removed.`}
          </Alert>
        </div>
      </Modal>
    </AppShell>
  )
}

export default Budgets
