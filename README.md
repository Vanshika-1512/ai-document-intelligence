# AI Document Intelligence System

Upload documents → AI extracts, summarizes, classifies, and lets you ask questions about them in natural language.

> **Status: complete, end-to-end.** Both the FastAPI backend (upload, extraction, the full NLP pipeline, embeddings + retrieval, document Q&A, comparison, SQLite persistence) and the React frontend (landing page, dashboard, upload flow with live stage tracking, split-pane document viewer, chat with sources, compare, insights, history, settings) are implemented and wired together. See **Verification** below for exactly what was tested in this environment and what to check on your machine.

---

## Features implemented

| Feature | Status |
|---|---|
| Upload (PDF/DOCX/TXT/CSV) with validation | ✅ |
| Background async processing pipeline | ✅ |
| Text extraction + document stats | ✅ |
| Chunking + sentence-transformer embeddings | ✅ |
| Semantic search (cosine similarity) | ✅ |
| Document classification (TF-IDF + Naive Bayes, explainable) | ✅ |
| Hierarchical summarization (short / detailed / key points) | ✅ |
| Named Entity Recognition (spaCy) | ✅ |
| Keyword extraction (TF-IDF) | ✅ |
| Sentiment analysis with applicability check | ✅ |
| "Ask Your Document" retrieval-augmented QA with sources | ✅ |
| Document comparison (similarity + shared/unique topics) | ✅ |
| Document history (SQLite) | ✅ |
| Global error handling (no raw stack traces) | ✅ |
| Automated tests (pytest) | ✅ |
| Landing page (hero, features, how-it-works, footer) | ✅ |
| Dashboard (overview cards, recent docs, activity chart, quick actions) | ✅ |
| Drag-and-drop upload with live processing-stage tracker | ✅ |
| Document viewer (text + search) with AI panel (summary/classification/entities/keywords) | ✅ |
| "Ask Your Document" chat UI with source citations | ✅ |
| Compare page (similarity score, shared/unique topics, side-by-side) | ✅ |
| Insights page (aggregate stats, classification breakdown chart) | ✅ |
| History page, Settings page | ✅ |
| Responsive layout (collapsible sidebar on mobile/tablet) | ✅ |
| Multi-document chat, knowledge map (advanced/optional) | ⏳ future extension |
| OCR for scanned PDFs | ⏳ future extension |

---

## Verification

What was actually run and checked while building this, so you know what's proven vs. what to confirm yourself:

- **`pytest tests/ -v`** → 13/13 passing (extraction, cleaning, chunking, classification, keyword extraction, API validation/404 handling).
- **Direct pipeline smoke test** (extraction → stats → chunking → classification → keywords) run against a real sample document — correctly classified as "Report" at 80% confidence with sensible ranked keywords. Confirms the lightweight (non-transformer) stages are not faked.
- **Backend boots** (`uvicorn app.main:app`) — DB initializes, `/api/health` and `/` respond correctly.
- **Frontend production build** (`npm run build`) — compiles cleanly, no errors.
- **Frontend dev server** — every page module (`Landing`, `Dashboard`, `Documents`, `Upload`, `DocumentAnalysis`, `Compare`, `Insights`, `History`, `Settings`, `NotFound`) and `App.jsx` transform and serve with HTTP 200, confirming no syntax/import errors anywhere in the React app.
- **Not verified in this sandbox:** a live upload exercising the transformer-based stages (summarization, NER, embeddings, sentiment) end-to-end, because those models download from Hugging Face / spaCy's CDN on first use and this sandbox's network allowlist doesn't include those hosts. The code paths are implemented and unit-testable, but you should run one real upload on your machine after `pip install -r requirements.txt` + the spaCy model download (see below) to confirm the full pipeline on your setup — this is the one thing to check first.

---

## Architecture

```
Upload → Validate → Extract Text (PyMuPDF / python-docx / pandas)
       → Clean → Chunk (~500 words, 50-word overlap)
       → Embed chunks (sentence-transformers) → save vectors (.npy per document)
       → Classify (TF-IDF + Naive Bayes, keyword-rule fallback)
       → Summarize (hierarchical: chunk-level → merged → short)
       → NER (spaCy) · Keywords (TF-IDF) · Sentiment (DistilBERT, with N/A guard)
       → Persist everything to SQLite

Chat:  Question → embed → cosine top-k chunks → extractive QA over
       retrieved context only (never the whole document) → answer + sources
```

Processing runs as a FastAPI **background task**, so `POST /upload` returns immediately with `status: "uploaded"`; the client polls `GET /api/documents/{id}` until `status` becomes `"completed"` (or `"failed"`, with a friendly `error_message`).

### Why these technology choices

- **TF-IDF + Naive Bayes classifier** instead of a large pretrained classifier: trains in <1s on the bundled sample set (`sample_data/classification_training.csv`), is fully explainable, and needs no GPU — fast, lightweight, and efficient. A keyword-rule fallback covers cold start / low-confidence cases.
- **NumPy `.npy` vector store** instead of a dedicated vector DB: zero extra infrastructure, fast enough for single-document retrieval, and the interface (`save_vectors` / `search_similar`) is a drop-in point for FAISS or pgvector later.
- **Extractive QA over retrieved chunks** instead of sending the whole document to an LLM: bounded latency, works fully offline/open-source, and naturally yields page-level source citations.
- **SQLite + SQLAlchemy**: `DATABASE_URL` can be swapped for a Postgres connection string with no model code changes.

### Folder structure

```
backend/
├── app/
│   ├── main.py                # FastAPI app, CORS, global error handlers
│   ├── config.py               # env-driven settings
│   ├── api/                    # documents, analysis, chat, comparison routers
│   ├── services/                # extraction, embeddings, vector_store, summarizer,
│   │                            # classifier, ner, keyword_extractor, sentiment, qa, pipeline
│   ├── database/                # SQLAlchemy engine + models
│   ├── models/schemas.py        # Pydantic request/response models
│   └── utils/                   # text cleaning/chunking, file validation
├── sample_data/classification_training.csv
├── tests/test_pipeline_components.py
├── requirements.txt
└── .env.example

frontend/   # scaffolded next phase
```

### Database design

`documents` (metadata + status) → `document_chunks` (text + page + vector index) → `document_analysis` (1:1 — summary, classification, sentiment) → `entities`, `keywords` (1:many) → `chat_history` (Q&A log with sources). Full schema: `app/database/models.py`.

### API endpoints

```
POST   /api/documents/upload
GET    /api/documents
GET    /api/documents/{id}
GET    /api/documents/{id}/text
DELETE /api/documents/{id}

GET    /api/documents/{id}/analysis
GET    /api/documents/{id}/entities
GET    /api/documents/{id}/keywords
GET    /api/documents/{id}/classification
GET    /api/documents/{id}/stats
GET    /api/documents/{id}/search?q=...

POST   /api/documents/{id}/chat
GET    /api/documents/{id}/chat/history

POST   /api/documents/compare
```

Interactive docs are auto-generated at `/docs` (Swagger) once the server is running.

---

## Installation

### Backend

```bash
cd backend
python -m venv venv
```

Windows: `venv\Scripts\activate`
macOS/Linux: `source venv/bin/activate`

```bash
pip install -r requirements.txt
python -m spacy download en_core_web_sm
cp .env.example .env
uvicorn app.main:app --reload
```

The API is now live at `http://localhost:8000` (docs at `http://localhost:8000/docs`).

> **First run note:** `sentence-transformers`, `transformers`, and spaCy will download their model weights from Hugging Face / spaCy's CDN on first use — this requires internet access and may take a few minutes. After that, models are cached locally and load instantly.

### Quick test without the frontend

```bash
curl -X POST http://localhost:8000/api/documents/upload -F "file=@sample_data/classification_training.csv"
curl http://localhost:8000/api/documents          # see status move: uploaded → analyzing → completed
```

### Running tests

```bash
cd backend
pytest tests/ -v
```

The bundled suite (13 tests) covers extraction, cleaning, chunking, classification, keyword extraction, and core API behavior (upload validation, 404 handling) — it runs in under 2 seconds and does **not** require downloading the large transformer/spaCy models, so it's safe to run in any environment, including CI.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env      # points VITE_API_URL at the backend; defaults to http://localhost:8000
npm run dev
```

The app is now live at `http://localhost:5173`. Start the backend first (or alongside) — the landing page works standalone, but the dashboard and every `/app/*` route call the API directly. If the backend isn't reachable, upload and every data view shows a clear "Can't reach the server" error state rather than hanging or crashing.

### Frontend structure

```
frontend/src/
├── App.jsx                  # routes
├── main.jsx                 # entry point
├── pages/                   # Landing, Dashboard, Documents, Upload, DocumentAnalysis,
│                             # Compare, Insights, History, Settings, NotFound
├── components/               # Sidebar, Navbar, AppShell, UploadZone, ChatInterface,
│                             # DocumentCard, ui.jsx (Card/EmptyState/LoadingState/etc.)
├── services/api.js           # single fetch client for every backend endpoint
└── hooks/useDocumentStatus.js # polls a document until processing completes/fails
```

**Design tokens**: Frosted glassmorphism aesthetic inspired by modern health & intelligence interfaces. Warm muted paper background (`#DCE5E7`), deep ink accents (`#12181B`), luminous cyan glow (`#00D2EE`), Plus Jakarta Sans typography, rounded-3xl / rounded-full pill buttons, and interactive 3D orb effects in the chat interface. Every view balances high-contrast legibility with tactile, modern glass surfaces.

---

## Environment variables

See `backend/.env.example`. Everything defaults to open-source/local models — `OPENAI_API_KEY` is optional and unused unless you extend the QA/summarization services to call an external LLM.

---

## Common errors & fixes

| Problem | Fix |
|---|---|
| `OSError: [E050] Can't find model 'en_core_web_sm'` | Run `python -m spacy download en_core_web_sm` |
| Upload returns 400 "Unsupported file type" | Only `.pdf .docx .txt .csv` are accepted (`app/config.py: allowed_extensions`) |
| Document stuck in `analyzing` | Check server logs — the pipeline writes `status: "failed"` with `error_message` on any extraction/model error rather than hanging |
| PDF extraction error "No extractable text found" | The PDF is likely scanned images; OCR (Tesseract/EasyOCR) is a planned extension, not yet wired in |
| Slow first request to `/chat` or `/analysis` | Transformer models load lazily on first use per process; subsequent requests are fast |

---

## Roadmap (optional future extensions)

1. **OCR** for scanned/image-based PDFs (Tesseract or EasyOCR) — currently PDFs with no extractable text return a clear error rather than silently failing.
2. **Multi-document chat** — extend `qa.py` retrieval to search across several documents' vector stores and tag sources by document.
3. **Document knowledge map** — derive an entity/topic co-occurrence graph and render it (optional advanced feature from the spec).
4. **Caching** for repeated analysis/search calls; pagination on `/api/documents` for large libraries.
5. **Persisted settings** — wire the Settings page's controls to a real user-preferences table (currently session-only, as noted on the page).
6. **Auth** — none is implemented; every document is globally visible, which is suitable for local/single-tenant deployment but would require extension for multi-tenant production.
