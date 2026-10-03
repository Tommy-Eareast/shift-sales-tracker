import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import Layout from './components/Layout';
import ShiftListPage from './pages/promoter/ShiftListPage';
import ShiftEditPage from './pages/promoter/ShiftEditPage';
import PromoterExportPage from './pages/promoter/PromoterExportPage';
import HistoryPage from './pages/promoter/HistoryPage';
import NotFoundPage from './pages/NotFoundPage';

const SalesPage = lazy(() => import('./pages/manager/SalesPage'));
const ManagerExportPage = lazy(() => import('./pages/manager/ManagerExportPage'));
const DashboardPage = lazy(() => import('./pages/manager/DashboardPage'));
const AdminPage = lazy(() => import('./pages/manager/AdminPage'));

function LoadingFallback() {
    return (
        <div className="animate-pulse space-y-4">
            <div className="h-24 bg-stone-100 rounded-2xl" />
            <div className="h-12 bg-stone-100 rounded-2xl" />
            <div className="h-12 bg-stone-100 rounded-2xl" />
        </div>
    );
}

function App() {
    return (
        <ErrorBoundary>
            <Routes>
                <Route element={<Layout />}>
                    {/* Promoter routes */}
                    <Route path="/" element={<ShiftListPage />} />
                    <Route path="/shift/:shiftId" element={<ShiftEditPage />} />
                    <Route path="/history" element={<HistoryPage />} />
                    <Route path="/export" element={<PromoterExportPage />} />

                    {/* Manager routes */}
                    <Route
                        path="/manager/sales"
                        element={
                            <Suspense fallback={<LoadingFallback />}>
                                <SalesPage />
                            </Suspense>
                        }
                    />
                    <Route
                        path="/manager/export"
                        element={
                            <Suspense fallback={<LoadingFallback />}>
                                <ManagerExportPage />
                            </Suspense>
                        }
                    />
                    <Route
                        path="/manager/dashboard"
                        element={
                            <Suspense fallback={<LoadingFallback />}>
                                <DashboardPage />
                            </Suspense>
                        }
                    />
                    <Route
                        path="/manager/admin"
                        element={
                            <Suspense fallback={<LoadingFallback />}>
                                <AdminPage />
                            </Suspense>
                        }
                    />

                    {/* Catch-all 404 */}
                    <Route path="*" element={<NotFoundPage />} />
                </Route>
            </Routes>
        </ErrorBoundary>
    );
}

export default App;
