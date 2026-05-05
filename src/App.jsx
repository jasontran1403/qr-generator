import React from "react";
import { Routes, Route } from "react-router-dom";
import QrForm from "./pages/QrForm";
import ESignPage from "./pages/ESignPage";

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
    </Routes>
  );
}

export default App;