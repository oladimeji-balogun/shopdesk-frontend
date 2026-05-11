import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { loginUser } from '../../api/auth'

export default function Login() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const navigate = useNavigate()

    async function handleSubmit(e) {
        e.preventDefault()
        setLoading(true)
        setError("")
        try {
            const response = await loginUser(email, password)
            const { access_token, refresh_token, user_id, role } = response.data
            localStorage.setItem("access-token", access_token)
            localStorage.setItem("refresh-token", refresh_token)
            localStorage.setItem("user_id", user_id)
            localStorage.setItem("role", role)
            navigate(role === "agent" ? "/dashboard" : "/chat")
        } catch {
            setError("Invalid email or password.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
            {/* Logo */}
            <div className="mb-8">
                <span className="text-sm font-semibold text-slate-900">ShopDesk</span>
            </div>

            {/* Card */}
            <div className="w-full max-w-md border border-slate-200 rounded-lg shadow-sm p-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
                    <p className="text-sm text-slate-500 mt-1">Sign in to your account</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-700">Email</label>
                        <input
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-700">Password</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors"
                        />
                    </div>

                    {error && (
                        <p className="text-xs text-red-500">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                    >
                        {loading ? "Signing in..." : "Continue"}
                    </button>
                </form>

                <p className="text-sm text-slate-500 text-center mt-6">
                    Don't have an account?{" "}
                    <Link to="/register" className="text-blue-600 font-medium hover:text-blue-700 transition-colors">
                        Register
                    </Link>
                </p>
            </div>
        </div>
    )
}
