import { useCallback, useEffect, useState } from 'react'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { RoleBadge } from '../../components/RoleBadge'
import {
  createAdminUser,
  deleteAdminUser,
  fetchAdminUsers,
  updateAdminUser,
} from '../../services/api/admin'
import type { PaginatedUsers } from '../../types/admin'
import { ADMIN_ROLES } from '../../types/admin'
import type { AuthUser, UserRole } from '../../types/auth'
import { getApiErrorMessage, getApiFieldErrors } from '../../utils/apiErrors'
import { getUserRoles } from '../../utils/authUser'

type FormMode = 'create' | 'edit' | null

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  password: '',
  password_confirmation: '',
  role: 'client' as UserRole,
  email_verified: true,
}

export function AdminUsersPage() {
  const [result, setResult] = useState<PaginatedUsers | null>(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formMode, setFormMode] = useState<FormMode>(null)
  const [editingUser, setEditingUser] = useState<AuthUser | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [busy, setBusy] = useState(false)
  const [userToDelete, setUserToDelete] = useState<AuthUser | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchAdminUsers({
        page,
        search: search || undefined,
        role: roleFilter || undefined,
      })
      setResult(data)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Impossible de charger les utilisateurs.'))
    } finally {
      setLoading(false)
    }
  }, [page, roleFilter, search])

  useEffect(() => {
    void load()
  }, [load])

  function openCreate() {
    setFormMode('create')
    setEditingUser(null)
    setForm(emptyForm)
    setFormError(null)
    setFieldErrors({})
  }

  function openEdit(user: AuthUser) {
    setFormMode('edit')
    setEditingUser(user)
    setForm({
      name: user.name,
      email: user.email,
      phone: user.phone ?? '',
      password: '',
      password_confirmation: '',
      role: (getUserRoles(user)[0] ?? 'client') as UserRole,
      email_verified: Boolean(user.email_verified_at),
    })
    setFormError(null)
    setFieldErrors({})
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setFormError(null)
    setFieldErrors({})

    try {
      if (formMode === 'create') {
        await createAdminUser(form)
      } else if (editingUser) {
        const payload: Record<string, unknown> = {
          name: form.name,
          email: form.email,
          phone: form.phone || null,
          role: form.role,
          email_verified: form.email_verified,
        }
        if (form.password) {
          payload.password = form.password
          payload.password_confirmation = form.password_confirmation
        }
        await updateAdminUser(editingUser.id, payload)
      }
      setFormMode(null)
      await load()
    } catch (err) {
      setFormError(getApiErrorMessage(err, 'Enregistrement impossible.'))
      setFieldErrors(getApiFieldErrors(err))
    } finally {
      setBusy(false)
    }
  }

  async function confirmDelete() {
    if (!userToDelete) return
    setBusy(true)
    try {
      await deleteAdminUser(userToDelete.id)
      setUserToDelete(null)
      await load()
    } catch (err) {
      setError(getApiErrorMessage(err, 'Suppression impossible.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Utilisateurs</h1>
          <p className="mt-1 text-sm text-slate-600">Gestion des comptes et des rôles.</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
        >
          Nouvel utilisateur
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          type="search"
          placeholder="Rechercher nom ou e-mail…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value)
            setPage(1)
          }}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">Tous les rôles</option>
          {ADMIN_ROLES.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="text-red-600">{error}</p>}
      {loading && <p className="text-slate-500">Chargement…</p>}

      {result && (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Utilisateur</th>
                <th className="px-4 py-3">Rôles</th>
                <th className="px-4 py-3">E-mail vérifié</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {result.data.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium">{user.name}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {getUserRoles(user).map((role) => (
                        <RoleBadge key={role} role={role as UserRole} />
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">{user.email_verified_at ? 'Oui' : 'Non'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => openEdit(user)}
                        className="text-emerald-700 hover:underline disabled:opacity-50"
                      >
                        Modifier
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setUserToDelete(user)}
                        className="text-red-600 hover:underline disabled:opacity-50"
                      >
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {result && result.meta.last_page > 1 && (
        <div className="flex justify-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-md border px-3 py-1 text-sm disabled:opacity-40"
          >
            Précédent
          </button>
          <span className="py-1 text-sm">
            Page {result.meta.current_page} / {result.meta.last_page}
          </span>
          <button
            type="button"
            disabled={page >= result.meta.last_page}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-md border px-3 py-1 text-sm disabled:opacity-40"
          >
            Suivant
          </button>
        </div>
      )}

      <ConfirmDialog
        open={userToDelete !== null}
        title="Supprimer l'utilisateur"
        message={
          userToDelete ? (
            <>
              Voulez-vous supprimer définitivement{' '}
              <span className="font-semibold text-slate-900">{userToDelete.name}</span>{' '}
              <span className="text-slate-500">({userToDelete.email})</span> ? Cette action est
              irréversible.
            </>
          ) : null
        }
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        variant="danger"
        busy={busy}
        busyLabel="Suppression…"
        onConfirm={() => void confirmDelete()}
        onCancel={() => {
          if (!busy) setUserToDelete(null)
        }}
      />

      {formMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={handleSubmit}
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-6 shadow-xl"
          >
            <h2 className="text-lg font-semibold">
              {formMode === 'create' ? 'Créer un utilisateur' : 'Modifier l\'utilisateur'}
            </h2>
            {formError && <p className="mt-2 text-sm text-red-600">{formError}</p>}

            <div className="mt-4 space-y-3">
              <input
                required
                placeholder="Nom"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
              <input
                required
                type="email"
                placeholder="E-mail"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
              <input
                placeholder="Téléphone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
                className="w-full rounded-md border px-3 py-2 text-sm"
              >
                {ADMIN_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.email_verified}
                  onChange={(e) => setForm({ ...form, email_verified: e.target.checked })}
                />
                E-mail vérifié
              </label>
              <input
                type="password"
                placeholder={formMode === 'edit' ? 'Nouveau mot de passe (optionnel)' : 'Mot de passe'}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full rounded-md border px-3 py-2 text-sm"
                required={formMode === 'create'}
              />
              <input
                type="password"
                placeholder="Confirmer le mot de passe"
                value={form.password_confirmation}
                onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })}
                className="w-full rounded-md border px-3 py-2 text-sm"
                required={formMode === 'create' || form.password.length > 0}
              />
              {fieldErrors.email?.[0] && (
                <p className="text-xs text-red-600">{fieldErrors.email[0]}</p>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setFormMode(null)}
                className="rounded-md border px-4 py-2 text-sm"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={busy}
                className="rounded-md bg-emerald-700 px-4 py-2 text-sm text-white disabled:opacity-50"
              >
                {busy ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
