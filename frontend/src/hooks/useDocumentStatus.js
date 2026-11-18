import { useEffect, useRef, useState } from "react";
import { api } from "../services/api";

/**
 * Polls GET /api/documents/{id} until status is "completed" or "failed".
 * Returns the live document record plus loading/error state.
 */
export function useDocumentStatus(documentId, { intervalMs = 1500 } = {}) {
  const [document, setDocument] = useState(null);
  const [error, setError] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!documentId) return;
    let cancelled = false;

    async function poll() {
      try {
        const doc = await api.getDocument(documentId);
        if (cancelled) return;
        setDocument(doc);
        setError(null);
        if (doc.status !== "completed" && doc.status !== "failed") {
          timerRef.current = setTimeout(poll, intervalMs);
        }
      } catch (e) {
        if (!cancelled) setError(e.message);
      }
    }

    poll();
    return () => {
      cancelled = true;
      clearTimeout(timerRef.current);
    };
  }, [documentId, intervalMs]);

  return { document, error };
}
