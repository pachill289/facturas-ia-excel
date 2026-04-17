import { useState } from "react";

export default function FileUploader() {
  const [pdfFiles, setPdfFiles] = useState([]);
  const [excelFile, setExcelFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [downloadUrl, setDownloadUrl] = useState(null);

  const handlePdfChange = (e) => {
    setPdfFiles([...e.target.files]);
  };

  const handleExcelChange = (e) => {
    setExcelFile(e.target.files[0]);
  };

  const handleSubmit = async () => {
    if (!pdfFiles.length || !excelFile) {
      setMessage("Debes subir archivos PDFs y el archivo Excel.");
      return;
    }

    setLoading(true);
    setMessage("");
    setDownloadUrl(null);

    const formData = new FormData();

    pdfFiles.forEach((file) => {
      formData.append("pdfs", file, file.name);
    });

    formData.append("excel", excelFile, excelFile.name);

    try {
      const response = await fetch(
        "https://hook.us2.make.com/sbkmalltuc76bx1m3ojm25gwstn464m1",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Error en la respuesta del servidor");
      }

      // recibir como archivo
      const blob = await response.blob();

      // crear URL temporal para descarga
      const url = window.URL.createObjectURL(blob);
      setDownloadUrl(url);

      setMessage("Proceso completado. Ya puedes descargar el Excel.");
    } catch (error) {
      console.error(error);
      setMessage("Error al procesar.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = "facturas_procesadas.xlsx";
    a.click();
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-2xl shadow space-y-4">
      
      <h2 className="text-xl font-semibold text-center">
        Procesador de Facturas PDF → Excel
      </h2>

      {/* PDFs */}
      <div>
        <label className="block font-medium mb-1">Subir Facturas (PDF)</label>
        <input
          type="file"
          multiple
          accept="application/pdf"
          onChange={handlePdfChange}
          className="w-full border p-2 rounded"
        />
      </div>

      {/* Excel */}
      <div>
        <label className="block font-medium mb-1">Subir Excel Base</label>
        <input
          type="file"
          accept=".xlsx"
          onChange={handleExcelChange}
          className="w-full border p-2 rounded"
        />
      </div>

      {/* Estado */}
      <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
        <p><strong>PDFs:</strong> {pdfFiles.length}</p>
        <p><strong>Excel:</strong> {excelFile?.name || "No seleccionado"}</p>
      </div>

      {/* Botón procesar */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition disabled:bg-gray-400"
      >
        {loading ? "Procesando..." : "Procesar"}
      </button>

      {/* Mensaje */}
      {message && (
        <div
          className={`text-center text-sm mt-2 ${
            message.includes("Error") ? "text-red-500" : "text-green-600"
          }`}
        >
          {message}
        </div>
      )}

      {/* descarga excel */}
      {downloadUrl && (
        <>
          <button
            onClick={handleDownload}
            className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition shadow"
          >
            📥 Descargar Excel
          </button>

          <div className="text-center mt-3">
            <p className="text-sm text-gray-500 mb-1">
              Si los datos no se actualizaron puedes ver el excel en línea
            </p>

            <a
              href="https://docs.google.com/spreadsheets/d/1aDrP5jqU04DCPW2PLwAYNZFbiNCsDHJKcBN8TUYA1Hc/edit?usp=drive_link"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-blue-600 hover:text-blue-800 text-sm font-medium underline transition"
            >
              Abrir Excel en Google Sheets
            </a>
          </div>
        </>
        
      )}
    </div>
  );
}