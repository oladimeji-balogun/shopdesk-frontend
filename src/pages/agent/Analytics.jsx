import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getAnalyticsSummary } from '../../api/analytics'

function StatCard({ label, value, sub }) {
    return (
        <div className="border border-slate-200 rounded-lg p-5">
            <p className="text-xs font-medium text-slate-400 mb-1">{label}</p>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
        </div>
    )
}

function IntentBar({ label, value, total, color }) {
    const pct = total > 0 ? Math.round((value / total) * 100) : 0
    return (
        <div>
            <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-slate-600">{label}</span>
                <span className="text-xs text-slate-400">{value} ({pct}%)</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
            </div>
        </div>
    )
}

function TicketRow({ label, value, color }) {
    return (
        <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
            <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${color}`} />
                <span className="text-sm text-slate-700">{label}</span>
            </div>
            <span className="text-sm font-semibold text-slate-900">{value}</span>
        </div>
    )
}

export default function Analytics() {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        getAnalyticsSummary()
            .then(setData)
            .catch(() => setError("Failed to load analytics."))
            .finally(() => setLoading(false))
    }, [])

    const totalIntents = data
        ? data.intent_breakdown.rag + data.intent_breakdown.tool_call + data.intent_breakdown.escalation
        : 0

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="h-12 px-6 border-b border-slate-200 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-900">Analytics</span>
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

            <div className="max-w-4xl mx-auto px-6 py-8">
                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {Array(6).fill(0).map((_, i) => (
                            <div key={i} className="h-24 bg-slate-100 rounded-lg animate-pulse" />
                        ))}
                    </div>
                ) : error ? (
                    <p className="text-sm text-red-500">{error}</p>
                ) : (
                    <div className="space-y-8">
                        {/* Top stats */}
                        <div>
                            <h2 className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-4">Overview</h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <StatCard label="Total Sessions" value={data.total_sessions} />
                                <StatCard label="Total Messages" value={data.total_messages} />
                                <StatCard label="Total Customers" value={data.total_customers} />
                                <StatCard
                                    label="Escalation Rate"
                                    value={`${(data.escalation_rate * 100).toFixed(1)}%`}
                                    sub="of sessions escalated"
                                />
                                <StatCard
                                    label="Avg Messages / Session"
                                    value={data.avg_messages_per_session}
                                    sub="per conversation"
                                />
                            </div>
                        </div>

                        {/* Intent breakdown */}
                        <div>
                            <h2 className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-4">Intent Distribution</h2>
                            <div className="border border-slate-200 rounded-lg p-5 space-y-4">
                                <IntentBar
                                    label="Knowledge Base (RAG)"
                                    value={data.intent_breakdown.rag}
                                    total={totalIntents}
                                    color="bg-slate-400"
                                />
                                <IntentBar
                                    label="Live Data (Tool Call)"
                                    value={data.intent_breakdown.tool_call}
                                    total={totalIntents}
                                    color="bg-blue-500"
                                />
                                <IntentBar
                                    label="Escalated"
                                    value={data.intent_breakdown.escalation}
                                    total={totalIntents}
                                    color="bg-amber-400"
                                />
                            </div>
                        </div>

                        {/* Ticket breakdown */}
                        <div>
                            <h2 className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-4">Ticket Status</h2>
                            <div className="border border-slate-200 rounded-lg p-5">
                                <TicketRow label="Open" value={data.ticket_breakdown.open} color="bg-amber-400" />
                                <TicketRow label="In Progress" value={data.ticket_breakdown.in_progress} color="bg-blue-500" />
                                <TicketRow label="Resolved" value={data.ticket_breakdown.resolved} color="bg-emerald-500" />
                                <TicketRow label="Closed" value={data.ticket_breakdown.closed} color="bg-slate-300" />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
