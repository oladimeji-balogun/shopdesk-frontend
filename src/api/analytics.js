import api from "./axiosInstance"

export async function getAnalyticsSummary() {
    const response = await api.get("/analytics/summary")
    return response.data
}
