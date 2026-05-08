import React from "react";
import { Routes, Route } from "react-router-dom";
import QrForm from "./pages/QrForm";
import ESignPage from "./pages/ESignPage";
import RawDataPage from "./pages/RawDataPage";

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <div className="route-qr">
            <QrForm />
          </div>
        }
      />
      <Route
        path="/e-sign"
        element={
          <div className="route-esign">
            <ESignPage />
          </div>
        }
      />
      {/* Route ẩn — không xuất hiện trên navbar */}
      <Route
        path="/raw-data"
        element={<RawDataPage />}
      />
    </Routes>
  );
}

export default App;