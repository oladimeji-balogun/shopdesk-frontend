import { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import ReactMarkdown from 'react-markdown'
import { getTickets, updateTicket, getSessionMessages, replyToTicket, assignTicket, getAgents } from '../../api/queue'
import { logoutUser } from '../../api/auth'

const STATUS_BADGE = {
    open:        { label: "Open",        className: "bg-amber-50 text-amber-600 border border-amber-100" },
    in_progress: { label: "In Progress", className: "bg-blue-50 text-blue-600 border border-blue-100" },
    resolved:    { label: "Resolved",    className: "bg-emerald-50 text-emerald-600 border border-emerald-100" },
    closed:      { label: "Closed",      className: "bg-slate-100 text-slate-500 border border-slate-200" },
}

const STATUS_TABS = [
    { key: "open",        label: "Open" },
    { key: "in_progress", label: "In Progress" },
    { key: "resolved",    label: "Resolved" },
    { key: "closed",      label: "Closed" },
]

function StatusBadge({ status }) {
    const cfg = STATUS_BADGE[status] ?? STATUS_BADGE.closed
    return (
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${cfg.className}`}>
            {cfg.label}
        </span>
    )
}

function timeAgo(dateStr) {
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
    if (diff < 60) return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return new Date(dateStr).toLocaleDateString()
}

export default function Dashboard() {
    const [tickets, setTickets] = useState([])
    const [selected, setSelected] = useState(null)
    const [transcript, setTranscript] = useState([])
    const [loadingTranscript, setLoadingTranscript] = useState(false)
    const [activeTab, setActiveTab] = useState("open")
    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState(false)
    const [search, setSearch] = useState("")
    const [lastRefresh, setLastRefresh] = useState(null)
    const [detailTab, setDetailTab] = useState("details")
    const [replyText, setReplyText] = useState("")
    const [replying, setReplying] = useState(false)
    const [agents, setAgents] = useState([])
    const [assigning, setAssigning] = useState(false)

    const navigate = useNavigate()

    const fetchTickets = useCallback(async (silent = false) => {
        if (!silent) setLoading(true)
        try {
            const data = await getTickets(activeTab)
            setTickets(data ?? [])
            setLastRefresh(new Date())
            if (selected) {
                const updated = (data ?? []).find(t => t.ticket_id === selected.ticket_id)
                if (updated) setSelected(updated)
            }
        } catch {
            // interceptor handles 401
        } finally {
            setLoading(false)
        }
    }, [activeTab, selected])

    useEffect(() => {
        setSelected(null)
        fetchTickets()
    }, [activeTab])

    useEffect(() => {
        const interval = setInterval(() => fetchTickets(true), 30000)
        return () => clearInterval(interval)
    }, [fetchTickets])

    // load agents for assignment dropdown
    useEffect(() => {
        getAgents().then(setAgents).catch(() => {})
    }, [])

    // load transcript when a ticket is selected
    useEffect(() => {
        if (!selected?.session_id) return
        setTranscript([])
        setLoadingTranscript(true)
        getSessionMessages(selected.session_id)
            .then(data => setTranscript(data ?? []))
            .catch(() => {})
            .finally(() => setLoadingTranscript(false))
    }, [selected?.ticket_id])

    async function handleUpdateStatus(ticketId, newStatus) {
        setUpdating(true)
        try {
            await updateTicket(ticketId, newStatus)
            setTickets(prev => prev.map(t =>
                t.ticket_id === ticketId ? { ...t, status: newStatus } : t
            ))
            if (selected?.ticket_id === ticketId) {
                setSelected(prev => ({ ...prev, status: newStatus }))
            }
            toast.success(`Ticket marked as ${newStatus.replace("_", " ")}.`)
        } catch {
            toast.error("Failed to update ticket.")
        } finally {
            setUpdating(false)
        }
    }

    async function handleLogout() {
        try { await logoutUser() } catch {}
        localStorage.clear()
        navigate("/")
    }

    async function handleReply() {
        if (!replyText.trim() || !selected) return
        setReplying(true)
        try {
            const msg = await replyToTicket(selected.ticket_id, replyText.trim())
            setTranscript(prev => [...prev, msg])
            setReplyText("")
            toast.success("Reply sent.")
        } catch {
            toast.error("Failed to send reply.")
        } finally {
            setReplying(false)
        }
    }

    async function handleAssign(agentId) {
        if (!selected || !agentId) return
        setAssigning(true)
        try {
            await assignTicket(selected.ticket_id, agentId)
            setSelected(prev => ({ ...prev, assigned_to: agentId }))
            const agent = agents.find(a => a.user_id === agentId)
            toast.success(`Assigned to ${agent?.name ?? "agent"}.`)
        } catch {
            toast.error("Failed to assign ticket.")
        } finally {
            setAssigning(false)
        }
    }

    const filtered = tickets.filter(t =>
        t.reason.toLowerCase().includes(search.toLowerCase()) ||
        t.ticket_id.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="flex h-screen bg-white text-slate-900 overflow-hidden">

            {/* Sidebar */}
            <aside className="w-80 shrink-0 bg-slate-50 border-r border-slate-200 flex flex-col">
                <div className="px-4 py-4 border-b border-slate-200">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold text-slate-900">Support Queue</span>
                        <button
                            onClick={() => fetchTickets()}
                            className="text-xs font-medium text-slate-400 hover:text-slate-700 transition-colors flex items-center gap-1"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Refresh
                        </button>
                    </div>

                    {/* Status filter tabs */}
                    <div className="flex gap-1 mb-3">
                        {STATUS_TABS.map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex-1 py-1 text-xs font-medium rounded transition-colors ${
                                    activeTab === tab.key
                                        ? "bg-white border border-slate-200 text-slate-900 shadow-sm"
                                        : "text-slate-400 hover:text-slate-600"
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <input
                        type="text"
                        placeholder="Search tickets..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors"
                    />
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                    {loading ? (
                        Array(4).fill(0).map((_, i) => (
                            <div key={i} className="h-20 bg-slate-200 rounded-lg animate-pulse" />
                        ))
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <p className="text-sm font-medium text-slate-400">No tickets</p>
                            <p className="text-xs text-slate-400 mt-1">Nothing in this queue</p>
                        </div>
                    ) : (
                        filtered.map(t => (
                            <button
                                key={t.ticket_id}
                                onClick={() => { setSelected(t); setDetailTab("details") }}
                                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                                    selected?.ticket_id === t.ticket_id
                                        ? "bg-white border-blue-600"
                                        : "bg-white border-slate-200 hover:border-slate-300"
                                }`}
                            >
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="font-mono text-xs text-slate-400">#{t.ticket_id.split("-")[0]}</span>
                                    <StatusBadge status={t.status} />
                                </div>
                                <p className="text-xs text-slate-700 line-clamp-2 leading-relaxed">{t.reason}</p>
                                <p className="text-xs text-slate-400 mt-1.5">{timeAgo(t.created_at)}</p>
                            </button>
                        ))
                    )}
                </div>

                <div className="px-4 py-4 border-t border-slate-200 flex items-center justify-between">
                    {lastRefresh && (
                        <span className="text-xs text-slate-400">Updated {timeAgo(lastRefresh)}</span>
                    )}
                    <div className="flex items-center gap-3 ml-auto">
                        <Link to="/analytics" className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-700 transition-colors">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            Analytics
                        </Link>
                        <Link to="/knowledge-base" className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-700 transition-colors">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                            Knowledge Base
                        </Link>
                        {localStorage.getItem("role") === "admin" && (
                            <Link to="/admin/users" className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-700 transition-colors">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                                Users
                            </Link>
                        )}
                        <Link to="/profile" className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-700 transition-colors">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Profile
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-red-500 transition-colors"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Logout
                        </button>
                    </div>
                </div>
            </aside>

            {/* Detail panel */}
            <main className="flex-1 flex flex-col overflow-hidden">
                <header className="h-12 px-6 border-b border-slate-200 flex items-center shrink-0">
                    <span className="text-sm font-medium text-slate-500">
                        {selected ? `Ticket #${selected.ticket_id.split("-")[0]}` : "Ticket Details"}
                    </span>
                </header>

                {selected ? (
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {/* Actions bar */}
                        <div className="px-6 py-3 border-b border-slate-200 flex items-center gap-3">
                            <StatusBadge status={selected.status} />
                            <div className="flex gap-2 ml-auto">
                                {selected.status === "open" && (
                                    <button onClick={() => handleUpdateStatus(selected.ticket_id, "in_progress")} disabled={updating}
                                        className="bg-blue-600 text-white text-xs font-medium px-4 py-1.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
                                        Claim
                                    </button>
                                )}
                                {selected.status === "in_progress" && (
                                    <button onClick={() => handleUpdateStatus(selected.ticket_id, "resolved")} disabled={updating}
                                        className="bg-emerald-600 text-white text-xs font-medium px-4 py-1.5 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50">
                                        Resolve
                                    </button>
                                )}
                                {selected.status !== "closed" && (
                                    <button onClick={() => handleUpdateStatus(selected.ticket_id, "closed")} disabled={updating}
                                        className="bg-white border border-slate-200 text-slate-700 text-xs font-medium px-4 py-1.5 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50">
                                        Close
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Detail / Transcript tabs */}
                        <div className="px-6 border-b border-slate-200 flex gap-4">
                            {["details", "transcript"].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setDetailTab(tab)}
                                    className={`py-3 text-xs font-medium capitalize border-b-2 transition-colors ${
                                        detailTab === tab
                                            ? "border-blue-600 text-blue-600"
                                            : "border-transparent text-slate-400 hover:text-slate-700"
                                    }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {detailTab === "details" ? (
                                <div className="p-6 max-w-2xl space-y-4">
                                    <div>
                                        <p className="text-xs font-medium text-slate-400 mb-2">Reason</p>
                                        <p className="text-sm text-slate-800 leading-relaxed border-l-2 border-slate-200 pl-4">
                                            {selected.reason}
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="border border-slate-200 rounded-lg p-3">
                                            <p className="text-xs font-medium text-slate-400 mb-1">Customer ID</p>
                                            <p className="font-mono text-xs text-slate-600 truncate">{selected.user_id}</p>
                                        </div>
                                        <div className="border border-slate-200 rounded-lg p-3">
                                            <p className="text-xs font-medium text-slate-400 mb-1">Created</p>
                                            <p className="text-xs text-slate-600">{new Date(selected.created_at).toLocaleString()}</p>
                                        </div>
                                        <div className="border border-slate-200 rounded-lg p-3 col-span-2">
                                            <p className="text-xs font-medium text-slate-400 mb-1">Session ID</p>
                                            <p className="font-mono text-xs text-slate-600 truncate">{selected.session_id}</p>
                                        </div>
                                        {/* Assignment */}
                                        <div className="border border-slate-200 rounded-lg p-3 col-span-2">
                                            <p className="text-xs font-medium text-slate-400 mb-2">Assigned to</p>
                                            <select
                                                value={selected.assigned_to ?? ""}
                                                onChange={e => handleAssign(e.target.value)}
                                                disabled={assigning || agents.length === 0}
                                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors disabled:opacity-50"
                                            >
                                                <option value="">Unassigned</option>
                                                {agents.map(a => (
                                                    <option key={a.user_id} value={a.user_id}>
                                                        {a.name} ({a.role})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col overflow-hidden">
                                    <div className="flex-1 overflow-y-auto p-6 space-y-3 max-w-2xl">
                                    {loadingTranscript ? (
                                        Array(4).fill(0).map((_, i) => (
                                            <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}>
                                                <div className="h-10 w-48 bg-slate-100 rounded-lg animate-pulse" />
                                            </div>
                                        ))
                                    ) : transcript.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-16 text-center">
                                            <p className="text-sm font-medium text-slate-400">No messages in this session</p>
                                        </div>
                                    ) : (
                                        transcript.map((m, i) => (
                                            <div key={i} className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}>
                                                <div className={`max-w-sm px-3 py-2 rounded-lg text-xs leading-relaxed ${
                                                    m.role === "user"
                                                        ? "bg-blue-600 text-white rounded-tr-none"
                                                        : "bg-slate-100 text-slate-800 rounded-tl-none"
                                                }`}>
                                                    {m.role === "assistant"
                                                        ? <ReactMarkdown className="prose prose-xs max-w-none prose-p:my-0.5">{m.content}</ReactMarkdown>
                                                        : m.content
                                                    }
                                                </div>
                                                <span className="text-xs text-slate-400 mt-0.5">
                                                    {m.role === "user" ? "Customer" : "Agent"} · {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                                </span>
                                            </div>
                                        ))
                                    )}
                                    </div>

                                    {/* Agent reply input */}
                                    <div className="px-6 py-3 border-t border-slate-200 max-w-2xl">
                                        <div className="flex items-end gap-2">
                                            <textarea
                                                rows={2}
                                                placeholder="Type a reply to the customer..."
                                                value={replyText}
                                                onChange={e => setReplyText(e.target.value)}
                                                onKeyDown={e => {
                                                    if (e.key === "Enter" && !e.shiftKey) {
                                                        e.preventDefault()
                                                        handleReply()
                                                    }
                                                }}
                                                className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors"
                                            />
                                            <button
                                                onClick={handleReply}
                                                disabled={replying || !replyText.trim()}
                                                className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <p className="text-sm font-medium text-slate-400">Select a ticket to view details</p>
                    </div>
                )}
            </main>
        </div>
    )
}
