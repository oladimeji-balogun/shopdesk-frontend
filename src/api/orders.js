import api from "./axiosInstance"

export async function getMyOrders() {
    const response = await api.get("/orders/me")
    return response.data
}
