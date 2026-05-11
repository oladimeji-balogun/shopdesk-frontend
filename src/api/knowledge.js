import api from "./axiosInstance"

export async function listDocuments() {
    const response = await api.get("/knowledge-base/documents")
    return response.data
}

export async function ingestDocument(filename) {
    const response = await api.post(`/knowledge-base/ingest?filename=${encodeURIComponent(filename)}`)
    return response.data
}

export async function uploadDocument(file) {
    const form = new FormData()
    form.append("file", file)
    const response = await api.post("/knowledge-base/upload", form, {
        headers: { "Content-Type": "multipart/form-data" }
    })
    return response.data
}
