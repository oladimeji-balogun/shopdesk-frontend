import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { listDocuments, ingestDocument, uploadDocument } from '../../api/knowledge'

function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function KnowledgeBase() {
    const [docs, setDocs] = useState([])
    const [loading, setLoading] = useState(true)
    const [ingesting, setIngesting] = useState(null)   // filename being ingested
    const [uploading, setUploading] = useState(false)
    const fileRef = useRef(null)

    useEffect(() => {
        listDocuments()
            .then(setDocs)
            .catch(() => toast.error("Failed to load documents."))
            .finally(() => setLoading(false))
    }, [])

    async function handleIngest(filename) {
        setIngesting(filename)
        try {
            const result = await ingestDocument(filename)
            toast.success(`${result.chunks_uploaded} chunks ingested from ${filename}.`)
        } catch {
            toast.error(`Failed to ingest ${filename}.`)
        } finally {
            setIngesting(null)
        }
    }

    async function handleUpload(e) {
        const file = e.target.files?.[0]
        if (!file) return
        setUploading(true)
        try {
            const result = await uploadDocument(file)
            toast.success(`${result.filename} uploaded — ${result.chunks_uploaded} chunks ingested.`)
            // refresh list
            const updated = await listDocuments()
            setDocs(updated)
        } catch {
            toast.error("Upload failed.")
        } finally {
            setUploading(false)
            if (fileRef.current) fileRef.current.value = ""
        }
    }

    return (
        <div className="min-h-screen bg-white">
            <header className="h-12 px-6 border-b border-slate-200 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-900">Knowledge Base</span>
                <Link
                    to="/dashboard"
                    className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-700 transition-colors"
                >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Queue
                </Link>
            </header>

            <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
                {/* Upload */}
                <div>
                    <h2 className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-4">Upload Document</h2>
                    <div
                        onClick={() => fileRef.current?.click()}
                        className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                    >
                        <svg className="w-6 h-6 text-slate-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="text-sm font-medium text-slate-600">
                            {uploading ? "Uploading..." : "Click to upload a .md or .txt file"}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">File will be chunked and ingested into Pinecone immediately</p>
                        <input
                            ref={fileRef}
                            type="file"
                            accept=".md,.txt"
                            className="hidden"
                            onChange={handleUpload}
                            disabled={uploading}
                        />
                    </div>
                </div>

                {/* Document list */}
                <div>
                    <h2 className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-4">Documents</h2>
                    {loading ? (
                        <div className="space-y-2">
                            {Array(2).fill(0).map((_, i) => (
                                <div key={i} className="h-16 bg-slate-100 rounded-lg animate-pulse" />
                            ))}
                        </div>
                    ) : docs.length === 0 ? (
                        <div className="border border-slate-200 rounded-lg p-8 text-center">
                            <p className="text-sm text-slate-400">No documents found in the knowledge base.</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {docs.map(doc => (
                                <div
                                    key={doc.filename}
                                    className="border border-slate-200 rounded-lg p-4 flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-900">{doc.filename}</p>
                                            <p className="text-xs text-slate-400">{formatBytes(doc.size_bytes)}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleIngest(doc.filename)}
                                        disabled={ingesting === doc.filename}
                                        className="bg-blue-600 text-white text-xs font-medium px-4 py-1.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {ingesting === doc.filename ? "Ingesting..." : "Re-ingest"}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                    <p className="text-xs font-medium text-slate-600 mb-1">How ingestion works</p>
                    <p className="text-xs text-slate-500 leading-relaxed">
                        Documents are split into 500-character chunks with 50-character overlap, embedded using BAAI/bge-small-en-v1.5,
                        and uploaded to Pinecone. The AI uses semantic similarity search over these chunks to answer customer questions.
                        Re-ingesting a document updates existing vectors with the same content hash.
                    </p>
                </div>
            </div>
        </div>
    )
}
