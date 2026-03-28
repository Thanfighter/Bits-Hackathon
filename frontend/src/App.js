import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import NewShipment from "@/pages/NewShipment";
import ShipmentResult from "@/pages/ShipmentResult";
import History from "@/pages/History";
import Finance from "@/pages/Finance";

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/new-shipment" element={<NewShipment />} />
          <Route path="/result/:id" element={<ShipmentResult />} />
          <Route path="/history" element={<History />} />
          <Route path="/finance" element={<Finance />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
