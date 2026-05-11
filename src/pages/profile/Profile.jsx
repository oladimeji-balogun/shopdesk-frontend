import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { getMe, updateMe } from '../../api/user'
import { logoutUser } from '../../api/auth'

export default function Profile() {
    const [user, setUser] = useState(null)
    const [name, setName] = useState("")
    const [phone, setPhone] = useState("")
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const navigate = useNavigate()
    const role = localStorage.getItem("role")

    useEffect(() => {
        getMe()
            .then(data => {
                setUser(data)
                setName(data.name)
                setPhone(data.phone)
            })
            .catch(() => {})
            .finally(() => setLoading(false))
    }, [])

    async function handleSave(e) {
        e.preventDefault()
        setSaving(true)
        try {
            const updated = await updateMe({ name, phone })
            setUser(updated)
            toast.success("Profile updated.")
        } catch {
            toast.error("Failed to update profile.")
        } finally {
            setSaving(false)
        }
    }

    async function handleLogout() {
        try { await logoutUser() } catch {}
        localStorage.clear()
        navigate("/")
    }

    const backPath = role === "agent" ? "/dashboard" : "/chat"

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
            <div className="w-full max-w-md">
                {/* Back link */}
                <Link to={backPath} className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-700 transition-colors mb-6">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                    Back
                </Link>

                <div className="border border-slate-200 rounded-lg shadow-sm p-8">
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
                        <p className="text-sm text-slate-500 mt-1">Manage your account details</p>
                    </div>

                    {loading ? (
                        <div className="space-y-3">
                            {Array(3).fill(0).map((_, i) => (
                                <div key={i} className="h-10 bg-slate-100 rounded-lg animate-pulse" />
                            ))}
                        </div>
                    ) : (
                        <form onSubmit={handleSave} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-700">Full name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    required
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-700">Email</label>
                                <input
                                    type="email"
                                    value={user?.email ?? ""}
                                    disabled
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-400 bg-slate-50 cursor-not-allowed"
                                />
                                <p className="text-xs text-slate-400">Email cannot be changed</p>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-700">Phone number</label>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={e => setPhone(e.target.value)}
                                    required
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-700">Role</label>
                                <div className="px-3 py-2 border border-slate-200 rounded-lg bg-slate-50">
                                    <span className="text-sm text-slate-500 capitalize">{user?.role}</span>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? "Saving..." : "Save changes"}
                            </button>
                        </form>
                    )}

                    <div className="mt-6 pt-6 border-t border-slate-200">
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-red-500 transition-colors"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Sign out
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
