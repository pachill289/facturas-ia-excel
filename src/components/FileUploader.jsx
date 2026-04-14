import { useState } from "react";

export default function FileUploader() {
  const [pdfFiles, setPdfFiles] = useState([]);
  const [excelFile, setExcelFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handlePdfChange = (e) => {
    setPdfFiles([...e.target.files]);
  };

  const handleExcelChange = (e) => {
    setExcelFile(e.target.files[0]);
  };

  const handleSubmit = async () => {
    if (!pdfFiles.length || !excelFile) {
      setMessage("Debes subir PDFs y el archivo Excel.");
      return;
    }

    setLoading(true);
    setMessage("");

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
        },
      );

      const result = await response.json();

      setMessage("Proceso completado correctamente.");
      console.log(result);
    } catch (error) {
      console.error(error);
      setMessage("Error al procesar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
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

      {/* Lista de archivos */}
      <div className="text-sm text-gray-600">
        <p>
          <strong>PDFs:</strong> {pdfFiles.length}
        </p>
        <p>
          <strong>Excel:</strong> {excelFile?.name || "No seleccionado"}
        </p>
      </div>

      {/* Botón */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
      >
        {loading ? "Procesando..." : "Procesar"}
      </button>

      {/* Mensaje */}
      {message && (
        <div className="text-center text-sm mt-2 text-red-500">{message}</div>
      )}
    </div>
  );
}
