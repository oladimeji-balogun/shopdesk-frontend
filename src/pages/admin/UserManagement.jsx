import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { listUsers, updateUserRole, deactivateUser, activateUser } from '../../api/user'

const ROLE_BADGE = {
    customer:  "bg-slate-100 text-slate-600 border border-slate-200",
    agent:     "bg-blue-50 text-blue-600 border border-blue-100",
    admin:     "bg-purple-50 text-purple-600 border border-purple-100",
}

const ROLES = ["customer", "agent", "admin"]

export default function UserManagement() {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [updating, setUpdating] = useState(null)

    useEffect(() => {
        listUsers()
            .then(setUsers)
            .catch(() => toast.error("Failed to load users."))
            .finally(() => setLoading(false))
    }, [])

    async function handleRoleChange(userId, newRole) {
        setUpdating(userId)
        try {
            const updated = await updateUserRole(userId, newRole)
            setUsers(prev => prev.map(u => u.user_id === userId ? updated : u))
            toast.success(`Role updated to ${newRole}.`)
        } catch {
            toast.error("Failed to update role.")
        } finally {
            setUpdating(null)
        }
    }

    async function handleToggleActive(user) {
        setUpdating(user.user_id)
        try {
            const updated = user.is_active
                ? await deactivateUser(user.user_id)
                : await activateUser(user.user_id)
            setUsers(prev => prev.map(u => u.user_id === user.user_id ? updated : u))
            toast.success(`User ${updated.is_active ? "activated" : "deactivated"}.`)
        } catch {
            toast.error("Failed to update user status.")
        } finally {
            setUpdating(null)
        }
    }

    const filtered = users.filter(u =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="min-h-screen bg-white">
            <header className="h-12 px-6 border-b border-slate-200 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-900">User Management</span>
                <Link
                    to="/dashboard"
                    className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-700 transition-colors"
                >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Queue
                </Link>
            </header>

            <div className="max-w-5xl mx-auto px-6 py-8">
                <div className="mb-4 flex items-center justify-between">
                    <p className="text-xs text-slate-400">{users.length} users total</p>
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 w-64 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors"
                    />
                </div>

                {loading ? (
                    <div className="space-y-2">
                        {Array(5).fill(0).map((_, i) => (
                            <div key={i} className="h-14 bg-slate-100 rounded-lg animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50">
                                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Name</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Email</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Role</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Status</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(u => (
                                    <tr key={u.user_id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <p className="text-sm font-medium text-slate-900">{u.name}</p>
                                            <p className="font-mono text-xs text-slate-400">{u.user_id.split("-")[0]}</p>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-slate-600">{u.email}</td>
                                        <td className="px-4 py-3">
                                            <select
                                                value={u.role}
                                                onChange={e => handleRoleChange(u.user_id, e.target.value)}
                                                disabled={updating === u.user_id}
                                                className={`px-2 py-0.5 rounded text-xs font-medium border cursor-pointer focus:outline-none ${ROLE_BADGE[u.role] ?? ROLE_BADGE.customer}`}
                                            >
                                                {ROLES.map(r => (
                                                    <option key={r} value={r}>{r}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium border ${
                                                u.is_active
                                                    ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                                    : "bg-red-50 text-red-500 border-red-100"
                                            }`}>
                                                {u.is_active ? "Active" : "Inactive"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => handleToggleActive(u)}
                                                disabled={updating === u.user_id}
                                                className="text-xs font-medium text-slate-400 hover:text-slate-700 transition-colors disabled:opacity-50"
                                            >
                                                {u.is_active ? "Deactivate" : "Activate"}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filtered.length === 0 && (
                            <div className="py-12 text-center">
                                <p className="text-sm text-slate-400">No users match your search.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
