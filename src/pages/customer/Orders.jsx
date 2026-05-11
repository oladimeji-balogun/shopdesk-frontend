import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getMyOrders } from '../../api/orders'

const STATUS_STYLES = {
    pending:   "bg-amber-50 text-amber-600 border border-amber-100",
    shipped:   "bg-blue-50 text-blue-600 border border-blue-100",
    delivered: "bg-emerald-50 text-emerald-600 border border-emerald-100",
    cancelled: "bg-red-50 text-red-500 border border-red-100",
}

export default function Orders() {
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        getMyOrders()
            .then(setOrders)
            .catch(() => {})
            .finally(() => setLoading(false))
    }, [])

    return (
        <div className="min-h-screen bg-white">
            <header className="h-12 px-6 border-b border-slate-200 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-900">My Orders</span>
                <Link
                    to="/chat"
                    className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-700 transition-colors"
                >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Chat
                </Link>
            </header>

            <div className="max-w-3xl mx-auto px-6 py-8">
                {loading ? (
                    <div className="space-y-3">
                        {Array(4).fill(0).map((_, i) => (
                            <div key={i} className="h-20 bg-slate-100 rounded-lg animate-pulse" />
                        ))}
                    </div>
                ) : orders.length === 0 ? (
                    <div className="border border-slate-200 rounded-lg p-12 text-center">
                        <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                        </div>
                        <p className="text-sm font-medium text-slate-400">No orders yet</p>
                        <p className="text-xs text-slate-400 mt-1">Your order history will appear here</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {orders.map(order => (
                            <div key={order.order_id} className="border border-slate-200 rounded-lg p-4">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="font-mono text-xs text-slate-400 mb-1">
                                            #{order.order_id.split("-")[0].toUpperCase()}
                                        </p>
                                        <p className="text-sm font-semibold text-slate-900">
                                            ${order.total_amount.toFixed(2)}
                                        </p>
                                        <p className="text-xs text-slate-400 mt-1">
                                            {new Date(order.created_at).toLocaleDateString(undefined, {
                                                year: "numeric", month: "short", day: "numeric"
                                            })}
                                        </p>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${STATUS_STYLES[order.status] ?? STATUS_STYLES.pending}`}>
                                        {order.status}
                                    </span>
                                </div>
                                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2">
                                    <p className="font-mono text-xs text-slate-400 truncate flex-1">
                                        {order.order_id}
                                    </p>
                                    <button
                                        onClick={() => navigator.clipboard.writeText(order.order_id)}
                                        className="text-xs text-slate-400 hover:text-slate-700 transition-colors shrink-0"
                                        title="Copy order ID"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
