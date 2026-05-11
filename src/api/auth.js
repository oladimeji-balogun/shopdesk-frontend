import api from "./axiosInstance"
import axios from "axios"

// login/register don't need the interceptor's auth header, but 401 redirect is fine
export async function loginUser(email, password) {
    return api.post("/auth/login", { email, password })
}

export async function registerUser(name, email, phone, password) {
    return api.post("/auth/register", { name, email, phone, password })
}

export async function logoutUser() {
    return api.post("/auth/logout")
}

export async function refreshToken(token) {
    return api.post("/auth/refresh", { content: token })
}
