import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import ReactMarkdown from 'react-markdown'
import { sendMessage, createSession, deleteSession, rateSession, getUserSessions, getMessages } from '../../api/chat'
import { logoutUser } from '../../api/auth'

const INTENT_BADGE = {
    rag:        { label: "Knowledge Base", className: "bg-slate-100 text-slate-500 border border-slate-200" },
    tool_call:  { label: "Live Data",      className: "bg-blue-50 text-blue-600 border border-blue-100" },
    escalation: { label: "Escalated",      className: "bg-amber-50 text-amber-600 border border-amber-100" },
}

function formatTime(date) {
    if (!date) return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
export default function Chat() {
    const [sessions, setSessions] = useState([])
    const [messages, setMessages] = useState({})
    const [ratings, setRatings] = useState({})        // { [session_id]: 1-5 }
    const [activeId, setActiveId] = useState(null)
    const [input, setInput] = useState("")
    const [loading, setLoading] = useState(false)
    const [creating, setCreating] = useState(false)
    const [loadingMsgs, setLoadingMsgs] = useState(false)

    const navigate = useNavigate()
    const bottomRef = useRef(null)

    // load existing sessions from DB on mount
    useEffect(() => {
        async function init() {
            try {
                const data = await getUserSessions()
                if (data && data.length > 0) {
                    const mapped = data.map(s => ({
                        id: s.session_id,
                        label: null   // derived from first message once loaded
                    }))
                    setSessions(mapped)
                    setActiveId(mapped[0].id)
                } else {
                    await handleNewChat()
                }
            } catch {
                // 401 handled by interceptor
            }
        }
        init()
    }, [])

    // load messages when active session changes
    useEffect(() => {
        if (!activeId) return
        if (messages[activeId]) return

        async function fetchMessages() {
            setLoadingMsgs(true)
            try {
                const data = await getMessages(activeId)
                const mapped = (data ?? []).map(m => ({
                    role: m.role,
                    content: m.content,
                    intent: m.intent ?? null,
                    timestamp: m.created_at ?? null
                }))
                setMessages(prev => ({ ...prev, [activeId]: mapped }))

                // derive label from first user message
                const firstUserMsg = mapped.find(m => m.role === "user")
                if (firstUserMsg) {
                    setSessions(prev => prev.map(s =>
                        s.id === activeId && !s.label
                            ? { ...s, label: firstUserMsg.content.slice(0, 35) }
                            : s
                    ))
                }
            } catch {
                // interceptor handles 401
            } finally {
                setLoadingMsgs(false)
            }
        }
        fetchMessages()
    }, [activeId])

    // scroll to bottom when messages update
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages, loading, activeId])

    const activeMessages = messages[activeId] ?? []
    const lastIntent = activeMessages.filter(m => m.role === "assistant").at(-1)?.intent ?? null
    const isEscalated = lastIntent === "escalation"

    async function handleNewChat() {
        setCreating(true)
        try {
            const data = await createSession()
            const newSession = {
                id: data.session_id,
                label: null
            }
            setSessions(prev => [newSession, ...prev])
            setMessages(prev => ({ ...prev, [data.session_id]: [] }))
            setActiveId(data.session_id)
        } catch {
            toast.error("Failed to create a new chat.")
        } finally {
            setCreating(false)
        }
    }

    async function handleDeleteSession(e, sessionId) {
        e.stopPropagation()
        try {
            await deleteSession(sessionId)
            toast.success("Conversation deleted.")
        } catch {
            toast.error("Failed to delete conversation.")
        }
        setSessions(prev => prev.filter(s => s.id !== sessionId))
        setMessages(prev => {
            const next = { ...prev }
            delete next[sessionId]
            return next
        })
        if (activeId === sessionId) {
            const remaining = sessions.filter(s => s.id !== sessionId)
            setActiveId(remaining[0]?.id ?? null)
        }
    }

    async function handleSend() {
        if (!input.trim() || !activeId || loading) return

        const text = input.trim()
        const sentAt = new Date().toISOString()
        setInput("")

        // set session label from first message if not yet set
        setSessions(prev => prev.map(s =>
            s.id === activeId && !s.label
                ? { ...s, label: text.slice(0, 35) }
                : s
        ))

        // optimistically add user message
        setMessages(prev => ({
            ...prev,
            [activeId]: [...(prev[activeId] ?? []), { role: "user", content: text, timestamp: sentAt }]
        }))

        setLoading(true)
        try {
            const data = await sendMessage(activeId, text)
            setMessages(prev => ({
                ...prev,
                [activeId]: [...(prev[activeId] ?? []), {
                    role: "assistant",
                    content: data.response,
                    intent: data.intent ?? null,
                    timestamp: new Date().toISOString()
                }]
            }))
        } catch {
            setMessages(prev => ({
                ...prev,
                [activeId]: [...(prev[activeId] ?? []), {
                    role: "assistant",
                    content: "Something went wrong. Please try again.",
                    intent: null,
                    isError: true,
                    timestamp: new Date().toISOString()
                }]
            }))
            toast.error("Failed to send message.")
        } finally {
            setLoading(false)
        }
    }

    function handleKeyDown(e) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    async function handleLogout() {
        try { await logoutUser() } catch {}
        localStorage.clear()
        navigate("/")
    }

    async function handleRate(sessionId, star) {
        try {
            await rateSession(sessionId, star)
            setRatings(prev => ({ ...prev, [sessionId]: star }))
            toast.success("Thanks for your feedback!")
        } catch {
            toast.error("Failed to save rating.")
        }
    }
    return (
        <div className="flex h-screen bg-white text-slate-900 overflow-hidden">

            {/* Sidebar */}
            <aside className="w-56 shrink-0 bg-slate-50 border-r border-slate-200 flex flex-col">
                <div className="px-4 py-4 border-b border-slate-200">
                    <span className="text-sm font-semibold text-slate-900">ShopDesk</span>
                </div>

                <div className="px-3 py-3">
                    <button
                        onClick={handleNewChat}
                        disabled={creating}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        {creating ? "Creating..." : "New chat"}
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-3 space-y-0.5">
                    <p className="text-xs font-medium text-slate-400 px-2 py-1">Conversations</p>
                    {sessions.map(s => (
                        <div
                            key={s.id}
                            onClick={() => setActiveId(s.id)}
                            className={`group w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs cursor-pointer transition-colors ${
                                s.id === activeId
                                    ? "bg-white border border-slate-200 text-slate-900 font-medium"
                                    : "text-slate-500 hover:text-slate-900 hover:bg-white"
                            }`}
                        >
                            <span className="truncate">{s.label ?? "New conversation"}</span>
                            {/* Delete button — visible on hover */}
                            <button
                                onClick={e => handleDeleteSession(e, s.id)}
                                className="ml-1 shrink-0 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all"
                                title="Delete session"
                            >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    ))}
                </div>

                <div className="px-3 py-4 border-t border-slate-200 flex flex-col gap-2">
                    <Link
                        to="/orders"
                        className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-slate-700 transition-colors"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        My Orders
                    </Link>
                    <Link
                        to="/profile"
                        className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-slate-700 transition-colors"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Profile
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-red-500 transition-colors"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main */}
            <main className="flex-1 flex flex-col overflow-hidden">
                <header className="h-12 px-6 border-b border-slate-200 flex items-center shrink-0">
                    <span className="text-sm font-medium text-slate-500">Support Chat</span>
                </header>

                {isEscalated && (
                    <div className="bg-amber-50 border-b border-amber-100 px-6 py-2 flex items-center gap-2">
                        <svg className="w-3.5 h-3.5 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                        </svg>
                        <p className="text-xs text-amber-700 font-medium">Your issue has been escalated to a human agent. We'll be in touch shortly.</p>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
                    {loadingMsgs ? (
                        <div className="space-y-3">
                            {Array(3).fill(0).map((_, i) => (
                                <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}>
                                    <div className="h-10 w-48 bg-slate-100 rounded-lg animate-pulse" />
                                </div>
                            ))}
                        </div>
                    ) : activeMessages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                </svg>
                            </div>
                            <p className="text-sm font-medium text-slate-400">How can we help you today?</p>
                            <p className="text-xs text-slate-400 mt-1">Ask about your orders, returns, or account.</p>
                        </div>
                    ) : (
                        activeMessages.map((m, i) => (
                            <div key={i} className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}>
                                <div className={`max-w-sm px-4 py-2.5 rounded-lg text-sm leading-relaxed ${
                                    m.role === "user"
                                        ? "bg-blue-600 text-white rounded-tr-none"
                                        : m.isError
                                            ? "bg-red-50 text-red-600 border border-red-100 rounded-tl-none"
                                            : "bg-slate-100 text-slate-800 rounded-tl-none"
                                }`}>
                                    {m.role === "assistant" && !m.isError
                                        ? <ReactMarkdown className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0">{m.content}</ReactMarkdown>
                                        : m.content
                                    }
                                </div>
                                <div className={`flex items-center gap-2 mt-1 ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                                    {m.role === "assistant" && m.intent && INTENT_BADGE[m.intent] && (
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${INTENT_BADGE[m.intent].className}`}>
                                            {INTENT_BADGE[m.intent].label}
                                        </span>
                                    )}
                                    <span className="text-xs text-slate-400">{formatTime(m.timestamp)}</span>
                                </div>
                            </div>
                        ))
                    )}

                    {/* Star rating — shown after first assistant response */}
                    {activeMessages.some(m => m.role === "assistant") && (
                        <div className="flex flex-col items-center gap-2 py-4 border-t border-slate-100">
                            <p className="text-xs text-slate-400 font-medium">Rate this conversation</p>
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <button
                                        key={star}
                                        onClick={() => handleRate(activeId, star)}
                                        className={`w-6 h-6 transition-colors ${
                                            (ratings[activeId] ?? 0) >= star
                                                ? "text-amber-400"
                                                : "text-slate-200 hover:text-amber-300"
                                        }`}
                                    >
                                        <svg fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                        </svg>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {loading && (
                        <div className="flex items-start">
                            <div className="bg-slate-100 rounded-lg rounded-tl-none px-4 py-3 flex gap-1">
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0ms]" />
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:150ms]" />
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:300ms]" />
                            </div>
                        </div>
                    )}
                    <div ref={bottomRef} />
                </div>

                <div className="px-6 py-4 border-t border-slate-200">
                    <div className="flex items-end gap-3">
                        <textarea
                            rows={1}
                            placeholder="Ask about your orders, returns, or account..."
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors"
                        />
                        <button
                            onClick={handleSend}
                            disabled={loading || !input.trim()}
                            className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                            </svg>
                        </button>
                    </div>
                </div>
            </main>
        </div>
    )
}
