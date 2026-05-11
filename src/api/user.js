import api from "./axiosInstance"

export async function getMe() {
    const response = await api.get("/users/me")
    return response.data
}

export async function updateMe(payload) {
    const response = await api.patch("/users/me", payload)
    return response.data
}

// Admin endpoints
export async function listUsers() {
    const response = await api.get("/users/")
    return response.data
}

export async function updateUserRole(userId, role) {
    const response = await api.patch(`/users/${userId}/role`, { role })
    return response.data
}

export async function deactivateUser(userId) {
    const response = await api.patch(`/users/${userId}/deactivate`)
    return response.data
}

export async function activateUser(userId) {
    const response = await api.patch(`/users/${userId}/activate`)
    return response.data
}
