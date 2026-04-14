import { useState } from "react";
import FileUploader from "./components/FileUploader";

function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-white shadow-xl rounded-2xl p-6">
        <h1 className="text-2xl font-bold mb-4 text-center">
          Procesador de Facturas Tigo
        </h1>

        <FileUploader />
      </div>
    </div>
  );
}

export default App;
