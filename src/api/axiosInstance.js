import axios from "axios"

const api = axios.create({
    baseURL: "http://localhost:8000"
})

// attach access token to every request
api.interceptors.request.use(config => {
    const token = localStorage.getItem("access-token")
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
})

let isRefreshing = false
let failedQueue = []

function processQueue(error, token = null) {
    failedQueue.forEach(({ resolve, reject }) => {
        if (error) reject(error)
        else resolve(token)
    })
    failedQueue = []
}

api.interceptors.response.use(
    response => response,
    async error => {
        const original = error.config

        // only attempt refresh on 401, and not on auth endpoints themselves
        if (
            error.response?.status === 401 &&
            !original._retry &&
            !original.url?.includes("/auth/")
        ) {
            const refreshToken = localStorage.getItem("refresh-token")
            if (!refreshToken) {
                localStorage.clear()
                window.location.href = "/"
                return Promise.reject(error)
            }

            if (isRefreshing) {
                // queue this request until refresh completes
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject })
                }).then(token => {
                    original.headers.Authorization = `Bearer ${token}`
                    return api(original)
                })
            }

            original._retry = true
            isRefreshing = true

            try {
                const response = await axios.post("http://localhost:8000/auth/refresh", {
                    content: refreshToken
                })
                const { access_token, refresh_token } = response.data
                localStorage.setItem("access-token", access_token)
                localStorage.setItem("refresh-token", refresh_token)

                api.defaults.headers.common.Authorization = `Bearer ${access_token}`
                original.headers.Authorization = `Bearer ${access_token}`

                processQueue(null, access_token)
                return api(original)
            } catch (refreshError) {
                processQueue(refreshError, null)
                localStorage.clear()
                window.location.href = "/"
                return Promise.reject(refreshError)
            } finally {
                isRefreshing = false
            }
        }

        return Promise.reject(error)
    }
)

export default api
