import { Outlet, useLocation, useNavigate } from "react-router-dom";

export default function Layout() {
    const location = useLocation();
    const navigate = useNavigate();

    const tabs = [
        {
            path: "/",
            label: "Shifts",
            icon: (
                <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                    />
                </svg>
            ),
        },
        {
            path: "/export",
            label: "Export",
            icon: (
                <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                </svg>
            ),
        },
        {
            path: "/admin",
            label: "Admin",
            icon: (
                <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                </svg>
            ),
        },
    ];

    const getActiveTab = () => {
        if (location.pathname.startsWith("/export")) return "/export";
        if (location.pathname.startsWith("/admin")) return "/admin";
        return "/";
    };

    const activeTab = getActiveTab();

    return (
        <div className="min-h-screen" style={{ backgroundColor: "#fafaf9" }}>
            {/* Header */}
            <header className="sticky top-0 z-10 backdrop-blur-xl bg-white/80 border-b border-stone-200/60">
                <div className="px-5 py-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-lg font-semibold text-stone-900 tracking-tight">
                                Perfume Tracker
                            </h1>
                            <p className="text-xs text-stone-400 mt-0.5 font-medium">
                                Shift Sales
                            </p>
                        </div>
                        <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                            style={{
                                background:
                                    "linear-gradient(135deg, #5b8c7a, #7eb8a0)",
                            }}
                        >
                            PS
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="pb-20 px-4 pt-4 max-w-2xl mx-auto">
                <Outlet />
            </main>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 z-10 bg-white/90 backdrop-blur-xl border-t border-stone-200/60">
                <div className="max-w-2xl mx-auto px-2">
                    <div className="flex items-center justify-around py-1.5">
                        {tabs.map((tab) => {
                            const isActive =
                                activeTab === tab.path ||
                                (tab.path === "/" && activeTab === "/");
                            return (
                                <button
                                    key={tab.path}
                                    onClick={() => navigate(tab.path)}
                                    className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 ${
                                        isActive
                                            ? "text-stone-900"
                                            : "text-stone-400 hover:text-stone-600"
                                    }`}
                                >
                                    {tab.icon}
                                    <span className="text-[10px] font-medium">
                                        {tab.label}
                                    </span>
                                    {isActive && (
                                        <div
                                            className="w-1 h-1 rounded-full mt-0.5"
                                            style={{
                                                backgroundColor: "#5b8c7a",
                                            }}
                                        ></div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </nav>
        </div>
    );
}
