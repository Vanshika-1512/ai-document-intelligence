const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      headers: options.body instanceof FormData ? undefined : { "Content-Type": "application/json" },
      ...options,
    });
  } catch (e) {
    throw new ApiError("Can't reach the server. Is the backend running on port 8000?", 0);
  }

  if (!response.ok) {
    let detail = `Request failed (${response.status})`;
    try {
      const data = await response.json();
      detail = data.detail || detail;
    } catch (_) {
      /* non-JSON error body */
    }
    throw new ApiError(detail, response.status);
  }

  if (response.status === 204) return null;
  return response.json();
}

export const api = {
  // Documents
  uploadDocument: (file, onProgress) => {
    const form = new FormData();
    form.append("file", file);
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${BASE_URL}/api/documents/upload`);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => {
        try {
          const data = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) resolve(data);
          else reject(new ApiError(data.detail || "Upload failed", xhr.status));
        } catch (e) {
          reject(new ApiError("Upload failed — unexpected server response.", xhr.status));
        }
      };
      xhr.onerror = () => reject(new ApiError("Can't reach the server. Is the backend running?", 0));
      xhr.send(form);
    });
  },
  listDocuments: () => request("/api/documents"),
  getDocument: (id) => request(`/api/documents/${id}`),
  getDocumentText: (id) => request(`/api/documents/${id}/text`),
  deleteDocument: (id) => request(`/api/documents/${id}`, { method: "DELETE" }),

  getAnalysis: (id) => request(`/api/documents/${id}/analysis`),
  getEntities: (id) => request(`/api/documents/${id}/entities`),
  getKeywords: (id) => request(`/api/documents/${id}/keywords`),
  getStats: (id) => request(`/api/documents/${id}/stats`),
  searchDocument: (id, q) => request(`/api/documents/${id}/search?q=${encodeURIComponent(q)}`),

  chat: (id, question, history = null) =>
    request(`/api/documents/${id}/chat`, {
      method: "POST",
      body: JSON.stringify(history ? { question, history } : { question }),
    }),
  chatHistory: (id) => request(`/api/documents/${id}/chat/history`),

  compareDocuments: (idA, idB) =>
    request(`/api/documents/compare`, {
      method: "POST",
      body: JSON.stringify({ document_id_a: idA, document_id_b: idB }),
    }),
};

export { ApiError };
