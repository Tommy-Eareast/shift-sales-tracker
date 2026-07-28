import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import ShiftList from "./pages/ShiftList";
import ShiftEdit from "./pages/ShiftEdit";
import ExportPage from "./pages/Export";
import Admin from "./pages/Admin";

function App() {
    return (
        <Routes>
            <Route element={<Layout />}>
                <Route path="/" element={<ShiftList />} />
                <Route path="/shift/:shiftId" element={<ShiftEdit />} />
                <Route path="/export" element={<ExportPage />} />
                <Route path="/admin" element={<Admin />} />
            </Route>
        </Routes>
    );
}

export default App;
