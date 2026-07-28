import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";
import { initializeDatabase, addSampleProducts } from "./db/database";

async function setupApp() {
    try {
        // Initialize database (will delete old one if needed)
        await initializeDatabase();

        // Add sample products if none exist
        const { db } = await import("./db/database");
        const productCount = await db.products.count();
        if (productCount === 0) {
            await addSampleProducts();
        }

        // Render the app
        createRoot(document.getElementById("root")!).render(
            <StrictMode>
                <BrowserRouter>
                    <App />
                </BrowserRouter>
            </StrictMode>,
        );
    } catch (error) {
        console.error("Failed to setup app:", error);
    }
}

setupApp();
