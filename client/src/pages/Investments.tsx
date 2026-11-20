import { useEffect, useId, useMemo, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import AppShell from '../components/layout/AppShell'
import Alert from '../components/ui/Alert'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Modal from '../components/ui/Modal'
import ProgressBar from '../components/ui/ProgressBar'
import Select from '../components/ui/Select'
import Spinner from '../components/ui/Spinner'
import TextField from '../components/ui/TextField'
import {
  createInvestment,
  deleteInvestment,
  listInvestments,
  updateInvestment,
} from '../services/investmentService'
import { ApiError } from '../types/api'
import type { Investment, InvestmentInput, InvestmentType } from '../types/investment'
import { cx } from '../utils/cx'
import styles from './Investments.module.css'

const TYPE_OPTIONS: Array<{ value: InvestmentType; label: string }> = [
  { value: 'stock', label: 'Stock' },
  { value: 'mutual_fund', label: 'Mutual fund' },
  { value: 'fixed_deposit', label: 'Fixed deposit' },
  { value: 'crypto', label: 'Crypto' },
  { value: 'gold', label: 'Gold' },
]

interface InvestmentFormState {
  type: InvestmentType
  name: string
  quantity: string
  purchasePrice: string
  currentValue: string
}

const DEFAULT_FORM: InvestmentFormState = {
  type: 'stock',
  name: '',
  quantity: '',
  purchasePrice: '',
  currentValue: '',
}

function investmentToFormState(investment: Investment): InvestmentFormState {
  return {
    type: investment.type,
    name: investment.name,
    // Keep the <input type="number"> value as a string so the field stays controlled
    // from the start instead of switching from uncontrolled to controlled once loaded.
    quantity: String(investment.quantity),
    purchasePrice: String(investment.purchasePrice),
    currentValue: String(investment.currentValue),
  }
}

function typeLabel(type: InvestmentType): string {
  const spaced = type.replace('_', ' ')
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(amount)
}

function formatSignedCurrency(amount: number): string {
  const sign = amount < 0 ? '−' : '+'
  return `${sign}${formatCurrency(Math.abs(amount))}`
}

function formatSignedPercent(percent: number): string {
  const sign = percent < 0 ? '−' : '+'
  return `${sign}${Math.abs(percent).toFixed(1)}%`
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

function Investments() {
  const formId = useId()

  const [investments, setInvestments] = useState<Investment[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [isModalOpen, setModalOpen] = useState(false)
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null)
  const [form, setForm] = useState<InvestmentFormState>(DEFAULT_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const [deleteTarget, setDeleteTarget] = useState<Investment | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  async function loadInvestments() {
    setLoading(true)
    setLoadError(null)
    try {
      const data = await listInvestments()
      setInvestments(data)
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInvestments()
  }, [])

  useEffect(() => {
    if (!successMessage) return
    const timer = setTimeout(() => setSuccessMessage(null), 4000)
    return () => clearTimeout(timer)
  }, [successMessage])

  const totals = useMemo(() => {
    return investments.reduce(
      (acc, investment) => ({
        value: acc.value + investment.value,
        profitLoss: acc.profitLoss + investment.profitLoss,
      }),
      { value: 0, profitLoss: 0 },
    )
  }, [investments])

  function updateField<K extends keyof InvestmentFormState>(key: K, value: InvestmentFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function openCreateModal() {
    setEditingInvestment(null)
    setForm(DEFAULT_FORM)
    setFormError(null)
    setFieldErrors({})
    setModalOpen(true)
  }

  function openEditModal(investment: Investment) {
    setEditingInvestment(investment)
    setForm(investmentToFormState(investment))
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

    const payload: InvestmentInput = {
      type: form.type,
      name: form.name.trim(),
      quantity: Number(form.quantity),
      purchasePrice: Number(form.purchasePrice),
      currentValue: Number(form.currentValue),
    }

    try {
      if (editingInvestment) {
        await updateInvestment(editingInvestment.id, payload)
      } else {
        await createInvestment(payload)
      }
      await loadInvestments()
      setModalOpen(false)
      setSuccessMessage(editingInvestment ? 'Investment updated.' : 'Investment created.')
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
      await deleteInvestment(deleteTarget.id)
      await loadInvestments()
      setDeleteTarget(null)
      setSuccessMessage('Investment deleted.')
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
          <h1 className={styles.title}>Investments</h1>
          {!loading && !loadError && investments.length > 0 && (
            <Button onClick={openCreateModal}>Add investment</Button>
          )}
        </div>

        {successMessage && (
          <Alert variant="success" className={styles.successAlert}>
            {successMessage}
          </Alert>
        )}

        {loading && (
          <div className={styles.loadingWrap}>
            <Spinner size={28} label="Loading investments…" />
          </div>
        )}

        {!loading && loadError && (
          <Alert variant="error" title="Couldn't load investments">
            <div className={styles.errorBody}>
              <p>{loadError}</p>
              <Button variant="secondary" size="sm" onClick={loadInvestments}>
                Retry
              </Button>
            </div>
          </Alert>
        )}

        {!loading && !loadError && investments.length === 0 && (
          <Card className={styles.emptyCard}>
            <p className={styles.emptyText}>You haven&apos;t added any investments yet.</p>
            <Button onClick={openCreateModal}>Add your first investment</Button>
          </Card>
        )}

        {!loading && !loadError && investments.length > 0 && (
          <>
            <Card className={styles.summaryCard}>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Total portfolio value</span>
                <span className={styles.summaryValue}>{formatCurrency(totals.value)}</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Total profit/loss</span>
                <span
                  className={cx(
                    styles.summaryValue,
                    totals.profitLoss < 0 ? styles.amountNegative : styles.amountPositive,
                  )}
                >
                  {formatSignedCurrency(totals.profitLoss)}
                </span>
              </div>
            </Card>

            <div className={styles.investmentGrid}>
              {investments.map((investment) => {
                const percentOfPortfolio = investment.percentOfPortfolio ?? 0
                return (
                  <Card key={investment.id} className={styles.investmentCard}>
                    <div className={styles.cardHeader}>
                      <h2 className={styles.investmentName}>{investment.name}</h2>
                      <Badge tone="accent">{typeLabel(investment.type)}</Badge>
                    </div>
                    <p className={styles.detailLine}>
                      {investment.quantity} units @ {formatCurrency(investment.purchasePrice)} →{' '}
                      {formatCurrency(investment.currentValue)}
                    </p>
                    <p className={styles.valueLine}>{formatCurrency(investment.value)}</p>
                    <p
                      className={cx(
                        styles.profitLossLine,
                        investment.profitLoss < 0 ? styles.amountNegative : styles.amountPositive,
                      )}
                    >
                      {formatSignedCurrency(investment.profitLoss)} (
                      {formatSignedPercent(investment.profitLossPercent)})
                    </p>
                    <ProgressBar
                      value={percentOfPortfolio}
                      tone="accent"
                      label={`${investment.name} — ${Math.round(percentOfPortfolio)}% of portfolio`}
                    />
                    <div className={styles.actions}>
                      <Button variant="ghost" size="sm" onClick={() => openEditModal(investment)}>
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={styles.deleteButton}
                        leftIcon={<TrashIcon />}
                        onClick={() => setDeleteTarget(investment)}
                      >
                        Delete
                      </Button>
                    </div>
                  </Card>
                )
              })}
            </div>
          </>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingInvestment ? 'Edit investment' : 'Add investment'}
        footer={
          <>
            <Button variant="secondary" onClick={closeModal} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" form={formId} isLoading={submitting}>
              {editingInvestment ? 'Save changes' : 'Add investment'}
            </Button>
          </>
        }
      >
        <form id={formId} className={styles.form} onSubmit={handleSubmit}>
          {formError && <Alert variant="error">{formError}</Alert>}
          <Select
            label="Type"
            name="type"
            options={TYPE_OPTIONS}
            value={form.type}
            onChange={(event: ChangeEvent<HTMLSelectElement>) =>
              updateField('type', event.target.value as InvestmentType)
            }
            error={fieldErrors.type}
          />
          <TextField
            label="Name"
            name="name"
            required
            value={form.name}
            onChange={(event: ChangeEvent<HTMLInputElement>) => updateField('name', event.target.value)}
            error={fieldErrors.name}
          />
          <TextField
            label="Quantity"
            name="quantity"
            type="number"
            step="any"
            required
            value={form.quantity}
            onChange={(event: ChangeEvent<HTMLInputElement>) => updateField('quantity', event.target.value)}
            error={fieldErrors.quantity}
          />
          <TextField
            label="Purchase price per unit"
            name="purchasePrice"
            type="number"
            step="0.01"
            required
            value={form.purchasePrice}
            onChange={(event: ChangeEvent<HTMLInputElement>) => updateField('purchasePrice', event.target.value)}
            error={fieldErrors.purchasePrice}
          />
          <TextField
            label="Current value per unit"
            name="currentValue"
            type="number"
            step="0.01"
            required
            value={form.currentValue}
            onChange={(event: ChangeEvent<HTMLInputElement>) => updateField('currentValue', event.target.value)}
            error={fieldErrors.currentValue}
          />
        </form>
      </Modal>

      <Modal
        isOpen={deleteTarget !== null}
        onClose={closeDeleteModal}
        title="Delete investment?"
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
            {deleteTarget && ` "${deleteTarget.name}" will be permanently removed.`}
          </Alert>
        </div>
      </Modal>
    </AppShell>
  )
}

export default Investments
