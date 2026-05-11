import api from "./axiosInstance"

export async function getTickets(status = null) {
    const url = status ? `/queue/?status=${status}` : "/queue/"
    const response = await api.get(url)
    return response.data
}

export async function updateTicket(ticket_id, status) {
    const response = await api.patch(`/queue/${ticket_id}`, { status })
    return response.data
}

export async function getSessionMessages(session_id) {
    const response = await api.get(`/sessions/${session_id}/messages`)
    return response.data
}

export async function replyToTicket(ticket_id, content) {
    const response = await api.post(`/queue/${ticket_id}/reply`, { content })
    return response.data
}

export async function assignTicket(ticket_id, agent_id) {
    const response = await api.patch(`/queue/${ticket_id}/assign`, { agent_id })
    return response.data
}

export async function getAgents() {
    // reuse the users list — filter client-side for agent/admin roles
    const response = await api.get("/users/")
    return response.data.filter(u => u.role === "agent" || u.role === "admin")
}
