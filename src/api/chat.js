import api from "./axiosInstance"

const chatBaseUrl = "/chat"
const sessionBaseUrl = "/sessions"

export async function getMessages(session_id) {
    const response = await api.get(`${sessionBaseUrl}/${session_id}/messages`)
    return response.data
}

export async function getUserSessions() {
    const response = await api.get(sessionBaseUrl)
    return response.data
}

export async function createSession() {
    const response = await api.post(sessionBaseUrl, {})
    return response.data
}

export async function endSession(session_id) {
    const response = await api.patch(`${sessionBaseUrl}/${session_id}/end`)
    return response.data
}

export async function deleteSession(session_id) {
    await api.delete(`${sessionBaseUrl}/${session_id}`)
}

export async function rateSession(session_id, rating) {
    const response = await api.post(`${sessionBaseUrl}/${session_id}/rate`, { rating })
    return response.data
}

export async function sendMessage(session_id, message) {
    const response = await api.post(`${chatBaseUrl}/${session_id}`, { content: message })
    return response.data
}
