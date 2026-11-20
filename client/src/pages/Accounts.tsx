import { useEffect, useId, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
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
import { createAccount, deleteAccount, listAccounts, updateAccount } from '../services/accountService'
import { ApiError } from '../types/api'
import type { Account, AccountInput, AccountStatus, AccountType } from '../types/account'
import styles from './Accounts.module.css'

const TYPE_OPTIONS: Array<{ value: AccountType; label: string }> = [
  { value: 'checking', label: 'Checking' },
  { value: 'savings', label: 'Savings' },
  { value: 'credit', label: 'Credit' },
  { value: 'investment', label: 'Investment' },
]

const STATUS_OPTIONS: Array<{ value: AccountStatus; label: string }> = [
  { value: 'active', label: 'Active' },
  { value: 'frozen', label: 'Frozen' },
  { value: 'closed', label: 'Closed' },
]

const STATUS_TONE: Record<AccountStatus, 'success' | 'warning' | 'neutral'> = {
  active: 'success',
  frozen: 'warning',
  closed: 'neutral',
}

interface AccountFormState {
  name: string
  type: AccountType
  balance: string
  currency: string
  status: AccountStatus
}

const DEFAULT_FORM: AccountFormState = {
  name: '',
  type: 'checking',
  balance: '',
  currency: '',
  status: 'active',
}

function accountToFormState(account: Account): AccountFormState {
  return {
    name: account.name,
    type: account.type,
    // The <input type="number"> value is always a string; keep form state as a string
    // too so the field stays controlled from the start instead of switching from
    // uncontrolled (undefined) to controlled once an account is loaded.
    balance: String(account.balance),
    currency: account.currency,
    status: account.status,
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

function Accounts() {
  const formId = useId()

  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [isModalOpen, setModalOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [form, setForm] = useState<AccountFormState>(DEFAULT_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  async function loadAccounts() {
    setLoading(true)
    setLoadError(null)
    try {
      const data = await listAccounts()
      setAccounts(data)
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAccounts()
  }, [])

  useEffect(() => {
    if (!successMessage) return
    const timer = setTimeout(() => setSuccessMessage(null), 4000)
    return () => clearTimeout(timer)
  }, [successMessage])

  function updateField<K extends keyof AccountFormState>(key: K, value: AccountFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function openCreateModal() {
    setEditingAccount(null)
    setForm(DEFAULT_FORM)
    setFormError(null)
    setFieldErrors({})
    setModalOpen(true)
  }

  function openEditModal(account: Account) {
    setEditingAccount(account)
    setForm(accountToFormState(account))
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

    const payload: AccountInput = {
      name: form.name.trim(),
      type: form.type,
      ...(editingAccount ? {} : { balance: Number(form.balance) }),
      currency: form.currency.trim().toUpperCase(),
      status: form.status,
    }

    try {
      if (editingAccount) {
        await updateAccount(editingAccount.id, payload)
      } else {
        await createAccount(payload)
      }
      await loadAccounts()
      setModalOpen(false)
      setSuccessMessage(editingAccount ? 'Account updated.' : 'Account created.')
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
      await deleteAccount(deleteTarget.id)
      await loadAccounts()
      setDeleteTarget(null)
      setSuccessMessage('Account deleted.')
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
          <h1 className={styles.title}>Accounts</h1>
          <Button onClick={openCreateModal}>Add account</Button>
        </div>

        {successMessage && (
          <Alert variant="success" className={styles.successAlert}>
            {successMessage}
          </Alert>
        )}

        {loading && (
          <div className={styles.loadingWrap}>
            <Spinner size={28} label="Loading accounts…" />
          </div>
        )}

        {!loading && loadError && (
          <Alert variant="error" title="Couldn't load accounts">
            <div className={styles.errorBody}>
              <p>{loadError}</p>
              <Button variant="secondary" size="sm" onClick={loadAccounts}>
                Retry
              </Button>
            </div>
          </Alert>
        )}

        {!loading && !loadError && accounts.length === 0 && (
          <Card className={styles.emptyCard}>
            <p className={styles.emptyText}>You haven&apos;t added any accounts yet.</p>
            <Button onClick={openCreateModal}>Add your first account</Button>
          </Card>
        )}

        {!loading && !loadError && accounts.length > 0 && (
          <Table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Balance</th>
                <th>Status</th>
                <th>
                  <span className={styles.srOnly}>Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => (
                <tr key={account.id}>
                  <td data-label="Name">{account.name}</td>
                  <td data-label="Type">{titleCase(account.type)}</td>
                  <td data-label="Balance">{formatCurrency(account.balance, account.currency)}</td>
                  <td data-label="Status">
                    <Badge tone={STATUS_TONE[account.status]}>{titleCase(account.status)}</Badge>
                  </td>
                  <td data-label="Actions">
                    <div className={styles.actions}>
                      <Button variant="ghost" size="sm" onClick={() => openEditModal(account)}>
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={styles.deleteButton}
                        leftIcon={<TrashIcon />}
                        onClick={() => setDeleteTarget(account)}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingAccount ? 'Edit account' : 'Add account'}
        footer={
          <>
            <Button variant="secondary" onClick={closeModal} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" form={formId} isLoading={submitting}>
              {editingAccount ? 'Save changes' : 'Add account'}
            </Button>
          </>
        }
      >
        <form id={formId} className={styles.form} onSubmit={handleSubmit}>
          {formError && <Alert variant="error">{formError}</Alert>}
          <TextField
            label="Name"
            name="name"
            required
            value={form.name}
            onChange={(event: ChangeEvent<HTMLInputElement>) => updateField('name', event.target.value)}
            error={fieldErrors.name}
          />
          <Select
            label="Type"
            name="type"
            options={TYPE_OPTIONS}
            value={form.type}
            onChange={(event: ChangeEvent<HTMLSelectElement>) =>
              updateField('type', event.target.value as AccountType)
            }
            error={fieldErrors.type}
          />
          {!editingAccount && (
            <TextField
              label="Opening balance"
              name="balance"
              type="number"
              step="0.01"
              required
              value={form.balance}
              onChange={(event: ChangeEvent<HTMLInputElement>) => updateField('balance', event.target.value)}
              error={fieldErrors.balance}
            />
          )}
          <TextField
            label="Currency"
            name="currency"
            required
            maxLength={3}
            value={form.currency}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              updateField('currency', event.target.value.toUpperCase())
            }
            error={fieldErrors.currency}
            hint={fieldErrors.currency ? undefined : '3-letter code, e.g. USD'}
          />
          <Select
            label="Status"
            name="status"
            options={STATUS_OPTIONS}
            value={form.status}
            onChange={(event: ChangeEvent<HTMLSelectElement>) =>
              updateField('status', event.target.value as AccountStatus)
            }
            error={fieldErrors.status}
          />
        </form>
      </Modal>

      <Modal
        isOpen={deleteTarget !== null}
        onClose={closeDeleteModal}
        title="Delete account?"
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

export default Accounts
