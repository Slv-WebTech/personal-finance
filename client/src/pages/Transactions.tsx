import { useEffect, useId, useMemo, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import AppShell from '../components/layout/AppShell'
import Alert from '../components/ui/Alert'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Modal from '../components/ui/Modal'
import Select from '../components/ui/Select'
import Spinner from '../components/ui/Spinner'
import Table from '../components/ui/Table'
import TextField from '../components/ui/TextField'
import { listAccounts } from '../services/accountService'
import {
  createTransaction,
  deleteTransaction,
  listTransactions,
  updateTransaction,
} from '../services/transactionService'
import { ApiError } from '../types/api'
import type { Account } from '../types/account'
import type { Transaction, TransactionInput, TransactionType } from '../types/transaction'
import styles from './Transactions.module.css'

const TYPE_OPTIONS: Array<{ value: TransactionType; label: string }> = [
  { value: 'income', label: 'Income' },
  { value: 'expense', label: 'Expense' },
  { value: 'transfer', label: 'Transfer' },
  { value: 'investment', label: 'Investment' },
]

const TYPE_TONE: Record<TransactionType, 'success' | 'warning'> = {
  income: 'success',
  expense: 'warning',
  transfer: 'warning',
  investment: 'warning',
}

const ALL_ACCOUNTS_VALUE = ''
const ALL_TYPES_VALUE = ''

interface TransactionFormState {
  accountId: string
  toAccountId: string
  type: TransactionType
  amount: string
  category: string
  date: string
  paymentMethod: string
  notes: string
}

function defaultFormState(accounts: Account[]): TransactionFormState {
  return {
    accountId: accounts[0]?.id ?? '',
    toAccountId: '',
    type: 'expense',
    amount: '',
    category: '',
    date: '',
    paymentMethod: '',
    notes: '',
  }
}

function transactionToFormState(transaction: Transaction): TransactionFormState {
  return {
    accountId: transaction.accountId,
    toAccountId: transaction.toAccountId ?? '',
    type: transaction.type,
    // Keep the <input type="number"> value as a string so the field stays controlled
    // from the start instead of switching from uncontrolled to controlled once loaded.
    amount: String(transaction.amount),
    category: transaction.category,
    // Native <input type="date"> needs a plain yyyy-MM-dd value, not a full ISO datetime.
    date: transaction.date.slice(0, 10),
    paymentMethod: transaction.paymentMethod ?? '',
    notes: transaction.notes ?? '',
  }
}

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount)
  } catch {
    return `${amount.toFixed(2)} ${currency}`
  }
}

function formatSignedAmount(transaction: Transaction, currency: string): string {
  const sign = transaction.type === 'income' ? '+' : '−'
  return `${sign}${formatCurrency(Math.abs(transaction.amount), currency)}`
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

function Transactions() {
  const formId = useId()
  const navigate = useNavigate()

  const [accounts, setAccounts] = useState<Account[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [accountFilter, setAccountFilter] = useState(ALL_ACCOUNTS_VALUE)
  const [typeFilter, setTypeFilter] = useState(ALL_TYPES_VALUE)

  const [isModalOpen, setModalOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [form, setForm] = useState<TransactionFormState>(() => defaultFormState([]))
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  async function loadData() {
    setLoading(true)
    setLoadError(null)
    try {
      const [accountsData, transactionsData] = await Promise.all([listAccounts(), listTransactions()])
      setAccounts(accountsData)
      setTransactions(transactionsData)
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function refreshTransactions() {
    try {
      const data = await listTransactions()
      setTransactions(data)
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (!successMessage) return
    const timer = setTimeout(() => setSuccessMessage(null), 4000)
    return () => clearTimeout(timer)
  }, [successMessage])

  const accountMap = useMemo(() => new Map(accounts.map((account) => [account.id, account])), [accounts])

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      if (accountFilter && transaction.accountId !== accountFilter) return false
      if (typeFilter && transaction.type !== typeFilter) return false
      return true
    })
  }, [transactions, accountFilter, typeFilter])

  const accountFilterOptions = useMemo(
    () => [
      { value: ALL_ACCOUNTS_VALUE, label: 'All accounts' },
      ...accounts.map((account) => ({ value: account.id, label: account.name })),
    ],
    [accounts],
  )

  const typeFilterOptions = useMemo(
    () => [{ value: ALL_TYPES_VALUE, label: 'All types' }, ...TYPE_OPTIONS],
    [],
  )

  const hasActiveFilters = accountFilter !== ALL_ACCOUNTS_VALUE || typeFilter !== ALL_TYPES_VALUE

  function clearFilters() {
    setAccountFilter(ALL_ACCOUNTS_VALUE)
    setTypeFilter(ALL_TYPES_VALUE)
  }

  function updateField<K extends keyof TransactionFormState>(key: K, value: TransactionFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function openCreateModal() {
    setEditingTransaction(null)
    setForm(defaultFormState(accounts))
    setFormError(null)
    setFieldErrors({})
    setModalOpen(true)
  }

  function openEditModal(transaction: Transaction) {
    setEditingTransaction(transaction)
    setForm(transactionToFormState(transaction))
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

    const payload: TransactionInput = {
      accountId: form.accountId,
      toAccountId: form.type === 'transfer' ? form.toAccountId || null : null,
      amount: Number(form.amount),
      type: form.type,
      category: form.category.trim(),
      date: form.date,
      paymentMethod: form.paymentMethod.trim() || undefined,
      notes: form.notes.trim() || undefined,
    }

    try {
      if (editingTransaction) {
        await updateTransaction(editingTransaction.id, payload)
      } else {
        await createTransaction(payload)
      }
      await refreshTransactions()
      setModalOpen(false)
      setSuccessMessage(editingTransaction ? 'Transaction updated.' : 'Transaction created.')
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
      await deleteTransaction(deleteTarget.id)
      await refreshTransactions()
      setDeleteTarget(null)
      setSuccessMessage('Transaction deleted.')
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  const hasAccounts = accounts.length > 0
  const hasTransactions = transactions.length > 0

  return (
    <AppShell>
      <div className={styles.content}>
        <div className={styles.header}>
          <h1 className={styles.title}>Transactions</h1>
          {!loading && !loadError && hasAccounts && (
            <Button onClick={openCreateModal}>Add transaction</Button>
          )}
        </div>

        {successMessage && (
          <Alert variant="success" className={styles.successAlert}>
            {successMessage}
          </Alert>
        )}

        {loading && (
          <div className={styles.loadingWrap}>
            <Spinner size={28} label="Loading transactions…" />
          </div>
        )}

        {!loading && loadError && (
          <Alert variant="error" title="Couldn't load transactions">
            <div className={styles.errorBody}>
              <p>{loadError}</p>
              <Button variant="secondary" size="sm" onClick={loadData}>
                Retry
              </Button>
            </div>
          </Alert>
        )}

        {!loading && !loadError && !hasAccounts && (
          <Card className={styles.emptyCard}>
            <p className={styles.emptyText}>
              You need an account before you can record transactions.
            </p>
            <Button onClick={() => navigate('/accounts')}>Go to accounts</Button>
          </Card>
        )}

        {!loading && !loadError && hasAccounts && !hasTransactions && (
          <Card className={styles.emptyCard}>
            <p className={styles.emptyText}>You haven&apos;t recorded any transactions yet.</p>
            <Button onClick={openCreateModal}>Add your first transaction</Button>
          </Card>
        )}

        {!loading && !loadError && hasAccounts && hasTransactions && (
          <>
            <div className={styles.filterBar}>
              <Select
                label="Account"
                className={styles.filterField}
                options={accountFilterOptions}
                value={accountFilter}
                onChange={(event: ChangeEvent<HTMLSelectElement>) => setAccountFilter(event.target.value)}
              />
              <Select
                label="Type"
                className={styles.filterField}
                options={typeFilterOptions}
                value={typeFilter}
                onChange={(event: ChangeEvent<HTMLSelectElement>) => setTypeFilter(event.target.value)}
              />
            </div>

            {filteredTransactions.length === 0 ? (
              <Card padding="sm" className={styles.noMatchCard}>
                <p className={styles.noMatchText}>No transactions match these filters.</p>
                {hasActiveFilters && (
                  <Button variant="secondary" size="sm" onClick={clearFilters}>
                    Clear filters
                  </Button>
                )}
              </Card>
            ) : (
              <Table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Account</th>
                    <th>Category</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>
                      <span className={styles.srOnly}>Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((transaction) => {
                    const account = accountMap.get(transaction.accountId)
                    const currency = account?.currency ?? 'USD'
                    return (
                      <tr key={transaction.id}>
                        <td data-label="Date">{new Date(transaction.date).toLocaleDateString()}</td>
                        <td data-label="Account">{account?.name ?? 'Unknown account'}</td>
                        <td data-label="Category">{transaction.category}</td>
                        <td data-label="Type">
                          <Badge tone={TYPE_TONE[transaction.type]}>{titleCase(transaction.type)}</Badge>
                        </td>
                        <td
                          data-label="Amount"
                          className={transaction.type === 'income' ? styles.amountIncome : styles.amountOutflow}
                        >
                          {formatSignedAmount(transaction, currency)}
                        </td>
                        <td data-label="Actions">
                          <div className={styles.actions}>
                            <Button variant="ghost" size="sm" onClick={() => openEditModal(transaction)}>
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={styles.deleteButton}
                              leftIcon={<TrashIcon />}
                              onClick={() => setDeleteTarget(transaction)}
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </Table>
            )}
          </>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingTransaction ? 'Edit transaction' : 'Add transaction'}
        footer={
          <>
            <Button variant="secondary" onClick={closeModal} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" form={formId} isLoading={submitting}>
              {editingTransaction ? 'Save changes' : 'Add transaction'}
            </Button>
          </>
        }
      >
        <form id={formId} className={styles.form} onSubmit={handleSubmit}>
          {formError && <Alert variant="error">{formError}</Alert>}
          <Select
            label="Account"
            name="accountId"
            required
            options={accounts.map((account) => ({ value: account.id, label: account.name }))}
            value={form.accountId}
            onChange={(event: ChangeEvent<HTMLSelectElement>) => updateField('accountId', event.target.value)}
            error={fieldErrors.accountId}
          />
          <Select
            label="Type"
            name="type"
            options={TYPE_OPTIONS}
            value={form.type}
            onChange={(event: ChangeEvent<HTMLSelectElement>) =>
              updateField('type', event.target.value as TransactionType)
            }
            error={fieldErrors.type}
          />
          {form.type === 'transfer' && (
            <Select
              label="Destination account (optional)"
              name="toAccountId"
              options={[
                { value: '', label: 'None (money leaves tracking)' },
                ...accounts
                  .filter((account) => account.id !== form.accountId)
                  .map((account) => ({ value: account.id, label: account.name })),
              ]}
              value={form.toAccountId}
              onChange={(event: ChangeEvent<HTMLSelectElement>) => updateField('toAccountId', event.target.value)}
              error={fieldErrors.toAccountId}
            />
          )}
          <TextField
            label="Amount"
            name="amount"
            type="number"
            step="0.01"
            required
            value={form.amount}
            onChange={(event: ChangeEvent<HTMLInputElement>) => updateField('amount', event.target.value)}
            error={fieldErrors.amount}
          />
          <TextField
            label="Category"
            name="category"
            required
            value={form.category}
            onChange={(event: ChangeEvent<HTMLInputElement>) => updateField('category', event.target.value)}
            error={fieldErrors.category}
          />
          <TextField
            label="Date"
            name="date"
            type="date"
            required
            value={form.date}
            onChange={(event: ChangeEvent<HTMLInputElement>) => updateField('date', event.target.value)}
            error={fieldErrors.date}
          />
          <TextField
            label="Payment method"
            name="paymentMethod"
            value={form.paymentMethod}
            onChange={(event: ChangeEvent<HTMLInputElement>) => updateField('paymentMethod', event.target.value)}
            error={fieldErrors.paymentMethod}
          />
          <TextField
            label="Notes"
            name="notes"
            value={form.notes}
            onChange={(event: ChangeEvent<HTMLInputElement>) => updateField('notes', event.target.value)}
            error={fieldErrors.notes}
          />
        </form>
      </Modal>

      <Modal
        isOpen={deleteTarget !== null}
        onClose={closeDeleteModal}
        title="Delete transaction?"
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
          <Alert variant="warning">This can&apos;t be undone.</Alert>
        </div>
      </Modal>
    </AppShell>
  )
}

export default Transactions
