import { useState, useEffect, useRef } from "react";

const API_BASE  = import.meta.env.VITE_API_BASE  ?? "http://localhost:8000";
const API_URL   = `${API_BASE}/process-invoices`;
const SHEET_URL = import.meta.env.VITE_SHEET_URL;

const STATUS_CONFIG = {
  added:     { label: "Agregada",  bg: "#E6F9F1", color: "#0A6B45", border: "#6EDCAB" },
  duplicate: { label: "Duplicada", bg: "#FFF8E6", color: "#7A5500", border: "#F5C842" },
  error:     { label: "Error",     bg: "#FEF0F0", color: "#991B1B", border: "#FCA5A5" },
};

export default function FileUploader() {
  const [pdfFiles, setPdfFiles]   = useState([]);
  const [loading, setLoading]     = useState(false);
  const [results, setResults]     = useState(null);
  const [error, setError]         = useState("");
  const [dragOver, setDragOver]   = useState(false);
  // null = comprobando, true = conectado, false = sin conexión
  const [apiStatus, setApiStatus] = useState(null);
  const inputRef = useRef();

  // ── Health check al montar el componente ──────────────────────
  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch(`${API_BASE}health`, { signal: AbortSignal.timeout(4000) });
        setApiStatus(res.ok);
      } catch {
        setApiStatus(false);
      }
    };
    check();
  }, []);

  // ── Manejo de archivos ────────────────────────────────────────
  const addFiles = (incoming) => {
    const pdfs = Array.from(incoming).filter(f => f.type === "application/pdf");
    if (!pdfs.length) { setError("Solo se aceptan archivos PDF."); return; }
    setError("");
    setPdfFiles(prev => {
      const existing = new Set(prev.map(f => f.name));
      return [...prev, ...pdfs.filter(f => !existing.has(f.name))];
    });
  };

  const removeFile = (name) => setPdfFiles(prev => prev.filter(f => f.name !== name));

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    addFiles(e.dataTransfer.files);
  };

  // ── Envío a la API ────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!pdfFiles.length) { setError("Selecciona al menos un PDF."); return; }
    setLoading(true); setError(""); setResults(null);

    const formData = new FormData();
    pdfFiles.forEach(f => formData.append("files", f, f.name));

    try {
      const res = await fetch(API_URL, { method: "POST", body: formData });
      if (!res.ok) throw new Error(`Error del servidor: ${res.status}`);
      const data = await res.json();
      setResults(data);
      setPdfFiles([]);
    } catch (e) {
      setError(`No se pudo conectar con la API. ¿Está corriendo en ${API_URL}?\n${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const added     = results?.filter(r => r.status === "added").length     ?? 0;
  const duplicate = results?.filter(r => r.status === "duplicate").length ?? 0;
  const errors    = results?.filter(r => r.status === "error").length     ?? 0;
  const sheetUrl  = results?.find(r => r.spreadsheet_url)?.spreadsheet_url ?? SHEET_URL;

  // ── Pill de estado de la API ──────────────────────────────────
  const statusPill = () => {
    if (apiStatus === null) return { dot: "#A0A0A0", text: 'Verificando conexión…' };
    if (apiStatus)          return { dot: "#4ADE80", text: 'Conectado al servicio '};
    return                         { dot: "#F87171", text: 'Sin conexión al servicio'};
  };
  const pill = statusPill();

  return (
    <div style={{
      minHeight: "100vh", background: "#F7F7F5",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif", padding: "2rem 1rem",
    }}>
      <div style={{ width: "100%", maxWidth: 560 }}>

        {/* Header */}
        <div style={{ marginBottom: 28, textAlign: "center" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            background: "#1A1A1A", color: "#F7F7F5", borderRadius: 12,
            padding: "8px 18px", marginBottom: 16, fontSize: 13, fontWeight: 500,
            transition: "opacity .3s",
          }}>
            <span style={{
              width: 7, height: 7, borderRadius: "50%",
              background: pill.dot, display: "inline-block",
              // pulso animado mientras verifica
              animation: apiStatus === null ? "pulse 1s ease-in-out infinite" : "none",
            }}/>
            {pill.text}
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "#1A1A1A", margin: "0 0 6px", letterSpacing: "-0.5px" }}>
            Procesador de Facturas
          </h1>
          <p style={{ fontSize: 14, color: "#6B6B6B", margin: 0 }}>
            Sube los PDF de facturas TIGO para llevarlos automáticamente a un archivo Excel
          </p>
        </div>

        {/* Card principal */}
        <div style={{
          background: "#fff", borderRadius: 20, border: "1px solid #E8E8E4",
          padding: "28px 28px 24px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        }}>

          {/* Aviso si la API no responde */}
          {apiStatus === false && (
            <div style={{
              background: "#FEF0F0", border: "1px solid #FCA5A5", borderRadius: 10,
              padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#991B1B",
            }}>
              Error la conexión a la API no esta disponible.
              Recarga la página para comprobar la conexión nuevamente.
            </div>
          )}

          {/* Zona drag & drop */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            style={{
              border: `2px dashed ${dragOver ? "#1A1A1A" : "#D4D4CF"}`,
              borderRadius: 14, padding: "32px 20px", textAlign: "center",
              cursor: "pointer", transition: "all .2s",
              background: dragOver ? "#F0F0EC" : "#FAFAF8",
              marginBottom: 20,
            }}
          >
            <input ref={inputRef} type="file" multiple accept="application/pdf"
              onChange={e => addFiles(e.target.files)} style={{ display: "none" }} />
            <div style={{ fontSize: 32, marginBottom: 10 }}>📄</div>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A", margin: "0 0 4px" }}>
              Arrastra tus PDFs aquí
            </p>
            <p style={{ fontSize: 13, color: "#9A9A96", margin: 0 }}>
              o haz clic para seleccionar — puedes subir varios a la vez
            </p>
          </div>

          {/* Lista de archivos */}
          {pdfFiles.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: "#6B6B6B", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {pdfFiles.length} archivo{pdfFiles.length > 1 ? "s" : ""} seleccionado{pdfFiles.length > 1 ? "s" : ""}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {pdfFiles.map(f => (
                  <div key={f.name} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    background: "#F7F7F5", borderRadius: 9, padding: "8px 12px",
                    border: "1px solid #ECECEA",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 15 }}>📋</span>
                      <span style={{ fontSize: 13, color: "#1A1A1A", fontWeight: 500 }}>{f.name}</span>
                      <span style={{ fontSize: 11, color: "#9A9A96" }}>{(f.size / 1024).toFixed(0)} KB</span>
                    </div>
                    <button onClick={e => { e.stopPropagation(); removeFile(f.name); }}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#C0C0BB", fontSize: 16, lineHeight: 1, padding: "0 2px" }}>
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{
              background: "#FEF0F0", border: "1px solid #FCA5A5", borderRadius: 10,
              padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#991B1B", whiteSpace: "pre-wrap",
            }}>
              {error}
            </div>
          )}

          {/* Botón procesar */}
          <button
            onClick={handleSubmit}
            disabled={loading || !pdfFiles.length || apiStatus === false}
            style={{
              width: "100%", padding: "13px 0", borderRadius: 12, border: "none",
              background: loading || !pdfFiles.length || apiStatus === false ? "#C8C8C4" : "#1A1A1A",
              color: "#F7F7F5", fontWeight: 600, fontSize: 15,
              cursor: loading || !pdfFiles.length || apiStatus === false ? "not-allowed" : "pointer",
              transition: "background .2s", letterSpacing: "-0.2px",
            }}
          >
            {loading ? (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                <span style={{
                  width: 16, height: 16, border: "2px solid #F7F7F5",
                  borderTopColor: "transparent", borderRadius: "50%",
                  display: "inline-block", animation: "spin 0.7s linear infinite",
                }}/>
                Procesando facturas…
              </span>
            ) : "Procesar facturas"}
          </button>
        </div>

        {/* Resultados */}
        {results && (
          <div style={{
            marginTop: 20, background: "#fff", borderRadius: 20,
            border: "1px solid #E8E8E4", overflow: "hidden",
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          }}>
            {/* Resumen */}
            <div style={{ padding: "20px 28px 16px", borderBottom: "1px solid #F0F0EC" }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#6B6B6B", margin: "0 0 12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Resumen del proceso
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                {[
                  { label: "Agregadas",  value: added,     ...STATUS_CONFIG.added },
                  { label: "Duplicadas", value: duplicate, ...STATUS_CONFIG.duplicate },
                  { label: "Con error",  value: errors,    ...STATUS_CONFIG.error },
                ].map(s => (
                  <div key={s.label} style={{
                    background: s.bg, border: `1px solid ${s.border}`,
                    borderRadius: 10, padding: "10px 12px", textAlign: "center",
                  }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: s.color, fontWeight: 500, marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Detalle por factura */}
            <div style={{ padding: "16px 28px", display: "flex", flexDirection: "column", gap: 8 }}>
              {results.map((r, i) => {
                const cfg = STATUS_CONFIG[r.status] ?? STATUS_CONFIG.error;
                return (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    background: "#FAFAF8", borderRadius: 10, padding: "10px 14px",
                    border: "1px solid #ECECEA",
                  }}>
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A" }}>
                        Factura #{r.nro_factura}
                      </span>
                      <p style={{ fontSize: 12, color: "#9A9A96", margin: "2px 0 0" }}>{r.message}</p>
                    </div>
                    <span style={{
                      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
                      borderRadius: 6, padding: "3px 10px", fontSize: 12, fontWeight: 600,
                      whiteSpace: "nowrap", marginLeft: 12,
                    }}>
                      {cfg.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Acciones */}
            <div style={{ padding: "0 28px 24px", display: "flex", gap: 10 }}>
              <a href={sheetUrl} target="_blank" rel="noopener noreferrer" style={{
                flex: 1, display: "block", textAlign: "center",
                background: "#1A1A1A", color: "#F7F7F5", borderRadius: 12,
                padding: "11px 0", fontSize: 14, fontWeight: 600, textDecoration: "none",
              }}>
                Abrir Google Sheets
              </a>
              <button onClick={() => setResults(null)} style={{
                padding: "11px 18px", borderRadius: 12,
                border: "1px solid #E8E8E4", background: "#F7F7F5",
                color: "#6B6B6B", fontSize: 14, fontWeight: 500, cursor: "pointer",
              }}>
                Nuevo lote
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: .4; } }
      `}</style>
    </div>
  );
}