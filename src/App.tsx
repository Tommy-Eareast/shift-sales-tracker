import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import ShiftListPage from "./pages/ShiftListPage";
import ShiftEditPage from "./pages/ShiftEditPage";
import ExportPage from "./pages/ExportPage";
import AdminPage from "./pages/AdminPage";

function App() {
    return (
        <Routes>
            <Route element={<Layout />}>
                <Route path="/" element={<ShiftListPage />} />
                <Route path="/shift/:shiftId" element={<ShiftEditPage />} />
                <Route path="/export" element={<ExportPage />} />
                <Route path="/admin" element={<AdminPage />} />
            </Route>
        </Routes>
    );
}

export default App;
