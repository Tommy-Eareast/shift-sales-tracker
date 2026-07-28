import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import type { ShiftRecord, ShiftTemplate, ShiftSummary } from "../types";
import {
    getAllShiftRecords,
    getAllTemplates,
    createShiftRecord,
    updateShiftRecord,
    deleteShiftRecord,
    getShiftSummary,
} from "../db/operations";

export default function ShiftList() {
    const [shifts, setShifts] = useState<ShiftRecord[]>([]);
    const [templates, setTemplates] = useState<ShiftTemplate[]>([]);
    const [summaries, setSummaries] = useState<Record<string, ShiftSummary>>(
        {},
    );
    const [showNewShift, setShowNewShift] = useState(false);
    const [showEditShift, setShowEditShift] = useState(false);
    const [editingShift, setEditingShift] = useState<ShiftRecord | null>(null);
    const [selectedTemplate, setSelectedTemplate] = useState("");
    const [recordDate, setRecordDate] = useState("");
    const [timeStart, setTimeStart] = useState("07:00");
    const [timeEnd, setTimeEnd] = useState("12:00");
    const navigate = useNavigate();
    const initialized = useRef(false);

    const loadData = useCallback(async () => {
        const shiftData = await getAllShiftRecords();
        setShifts(shiftData);
        const templateData = await getAllTemplates();
        setTemplates(templateData);
        if (templateData.length > 0) {
            setSelectedTemplate((prev) => prev || templateData[0].templateId);
        }
        const today = new Date();
        setRecordDate(today.toISOString().split("T")[0]);

        const summaryMap: Record<string, ShiftSummary> = {};
        for (const shift of shiftData) {
            try {
                const summary = await getShiftSummary(shift.shiftId);
                summaryMap[shift.shiftId] = summary;
            } catch {
                // Skip shifts with missing templates
            }
        }
        setSummaries(summaryMap);
    }, []);

    useEffect(() => {
        if (!initialized.current) {
            initialized.current = true;
            loadData();
        }
    }, [loadData]);

    const refreshData = async () => {
        await loadData();
    };

    const handleCreateShift = async () => {
        if (!selectedTemplate || !recordDate || !timeStart || !timeEnd) {
            alert("Please fill in all fields");
            return;
        }
        try {
            await createShiftRecord(
                selectedTemplate,
                recordDate,
                timeStart,
                timeEnd,
            );
            setShowNewShift(false);
            await refreshData();
        } catch (error) {
            console.error("Failed to create shift:", error);
            alert("Failed to create shift");
        }
    };

    const handleEditShift = (shift: ShiftRecord) => {
        setEditingShift(shift);
        setRecordDate(shift.recordDate);
        setTimeStart(shift.shiftTimeStart);
        setTimeEnd(shift.shiftTimeEnd);
        setShowEditShift(true);
    };

    const handleUpdateShift = async () => {
        if (!editingShift || !recordDate || !timeStart || !timeEnd) {
            alert("Please fill in all fields");
            return;
        }
        try {
            await updateShiftRecord(editingShift.shiftId, {
                recordDate,
                shiftTimeStart: timeStart,
                shiftTimeEnd: timeEnd,
            });
            setShowEditShift(false);
            setEditingShift(null);
            await refreshData();
        } catch (error) {
            console.error("Failed to update shift:", error);
            alert("Failed to update shift");
        }
    };

    const handleDeleteShift = async (shiftId: string) => {
        if (
            confirm(
                "Are you sure you want to delete this shift? All sales data will be lost.",
            )
        ) {
            await deleteShiftRecord(shiftId);
            await refreshData();
        }
    };

    return (
        <div>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-3 mb-6">
                <div
                    className="bg-white rounded-2xl p-4 border border-stone-200/60"
                    style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}
                >
                    <p className="text-xs font-medium text-stone-400 uppercase tracking-wider">
                        Total Shifts
                    </p>
                    <p className="text-2xl font-bold text-stone-900 mt-1 tracking-tight">
                        {shifts.length}
                    </p>
                    <p className="text-xs text-stone-400 mt-1">All time</p>
                </div>
                <div
                    className="bg-white rounded-2xl p-4 border border-stone-200/60"
                    style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}
                >
                    <p className="text-xs font-medium text-stone-400 uppercase tracking-wider">
                        Last Shift
                    </p>
                    <p className="text-2xl font-bold text-stone-900 mt-1 tracking-tight">
                        {shifts.length > 0
                            ? shifts[0].shiftDisplayName.split(" ")[0]
                            : "—"}
                    </p>
                    <p className="text-xs text-stone-400 mt-1">
                        Recent activity
                    </p>
                </div>
            </div>

            {/* Shift List */}
            <div className="space-y-3">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-stone-900 tracking-tight">
                        Recent Shifts
                    </h2>
                    <button
                        onClick={() => {
                            setShowNewShift(true);
                            const today = new Date();
                            setRecordDate(today.toISOString().split("T")[0]);
                            setTimeStart("07:00");
                            setTimeEnd("12:00");
                        }}
                        className="text-white px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 active:scale-95"
                        style={{
                            background:
                                "linear-gradient(135deg, #5b8c7a, #6d9e8a)",
                            boxShadow: "0 2px 8px rgba(91,140,122,0.2)",
                        }}
                    >
                        + New Shift
                    </button>
                </div>

                {shifts.length === 0 ? (
                    <div
                        className="bg-white rounded-2xl p-8 border border-stone-200/60 text-center"
                        style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}
                    >
                        <div className="text-4xl mb-3">⚱️</div>
                        <p className="text-stone-500 font-medium">
                            No shifts recorded yet
                        </p>
                        <p className="text-sm text-stone-400 mt-1">
                            Create your first shift to start tracking sales
                        </p>
                    </div>
                ) : (
                    shifts.map((shift) => {
                        const template = templates.find(
                            (t) => t.templateId === shift.templateId,
                        );
                        const summary = summaries[shift.shiftId];
                        return (
                            <div
                                key={shift.shiftId}
                                className="bg-white rounded-2xl p-4 border border-stone-200/60 transition-all duration-200 active:scale-[0.98]"
                                style={{
                                    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                                }}
                            >
                                <div className="flex items-center justify-between">
                                    <div
                                        className="flex-1 cursor-pointer"
                                        onClick={() =>
                                            navigate(`/shift/${shift.shiftId}`)
                                        }
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <span
                                                className="w-2 h-2 rounded-full flex-shrink-0"
                                                style={{
                                                    backgroundColor: "#5b8c7a",
                                                }}
                                            ></span>
                                            <h3 className="font-semibold text-stone-900 text-sm">
                                                {shift.shiftDisplayName}
                                            </h3>
                                        </div>
                                        <p className="text-xs text-stone-400 mt-1 ml-[18px]">
                                            {template?.templateName ||
                                                "Unknown Template"}
                                        </p>
                                        {summary && (
                                            <div className="flex items-center gap-4 mt-2 ml-[18px]">
                                                <span className="text-xs text-stone-500">
                                                    <span className="font-semibold text-stone-700">
                                                        {summary.totalCount}
                                                    </span>{" "}
                                                    sold
                                                </span>
                                                <span
                                                    className="text-xs font-semibold"
                                                    style={{ color: "#5b8c7a" }}
                                                >
                                                    ${summary.totalRevenue}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-0.5">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEditShift(shift);
                                            }}
                                            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-50 transition-colors"
                                            title="Edit shift"
                                        >
                                            <svg
                                                className="w-4 h-4"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={1.5}
                                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteShift(
                                                    shift.shiftId,
                                                );
                                            }}
                                            className="p-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                            title="Delete shift"
                                        >
                                            <svg
                                                className="w-4 h-4"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={1.5}
                                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* New Shift Modal */}
            {showNewShift && (
                <div
                    className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm flex items-end justify-center z-20"
                    onClick={() => setShowNewShift(false)}
                >
                    <div
                        className="bg-white rounded-t-3xl w-full max-w-2xl p-6 animate-slide-up"
                        style={{ boxShadow: "0 -4px 24px rgba(0,0,0,0.08)" }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div
                            className="w-10 h-1 rounded-full mx-auto mb-5"
                            style={{ backgroundColor: "#e7e5e2" }}
                        ></div>
                        <h3 className="text-lg font-semibold text-stone-900 mb-5 tracking-tight">
                            New Shift
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wider">
                                    Template
                                </label>
                                <select
                                    value={selectedTemplate}
                                    onChange={(e) =>
                                        setSelectedTemplate(e.target.value)
                                    }
                                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-300 focus:border-stone-300 transition-all"
                                >
                                    {templates.map((template) => (
                                        <option
                                            key={template.templateId}
                                            value={template.templateId}
                                        >
                                            {template.templateName}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wider">
                                    Date
                                </label>
                                <input
                                    type="date"
                                    value={recordDate}
                                    onChange={(e) =>
                                        setRecordDate(e.target.value)
                                    }
                                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-300 focus:border-stone-300 transition-all"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wider">
                                        Start
                                    </label>
                                    <input
                                        type="time"
                                        value={timeStart}
                                        onChange={(e) =>
                                            setTimeStart(e.target.value)
                                        }
                                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-300 focus:border-stone-300 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wider">
                                        End
                                    </label>
                                    <input
                                        type="time"
                                        value={timeEnd}
                                        onChange={(e) =>
                                            setTimeEnd(e.target.value)
                                        }
                                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-300 focus:border-stone-300 transition-all"
                                    />
                                </div>
                            </div>
                            <button
                                onClick={handleCreateShift}
                                className="w-full text-white py-3 rounded-xl font-medium transition-all duration-200 active:scale-95 mt-2"
                                style={{
                                    background:
                                        "linear-gradient(135deg, #5b8c7a, #6d9e8a)",
                                    boxShadow: "0 2px 8px rgba(91,140,122,0.2)",
                                }}
                            >
                                Create Shift
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Shift Modal */}
            {showEditShift && editingShift && (
                <div
                    className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm flex items-end justify-center z-20"
                    onClick={() => setShowEditShift(false)}
                >
                    <div
                        className="bg-white rounded-t-3xl w-full max-w-2xl p-6 animate-slide-up"
                        style={{ boxShadow: "0 -4px 24px rgba(0,0,0,0.08)" }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div
                            className="w-10 h-1 rounded-full mx-auto mb-5"
                            style={{ backgroundColor: "#e7e5e2" }}
                        ></div>
                        <h3 className="text-lg font-semibold text-stone-900 mb-1 tracking-tight">
                            Edit Shift
                        </h3>
                        <p className="text-xs text-stone-400 mb-5">
                            {templates.find(
                                (t) => t.templateId === editingShift.templateId,
                            )?.templateName || "Unknown Template"}
                        </p>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wider">
                                    Date
                                </label>
                                <input
                                    type="date"
                                    value={recordDate}
                                    onChange={(e) =>
                                        setRecordDate(e.target.value)
                                    }
                                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-300 focus:border-stone-300 transition-all"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wider">
                                        Start
                                    </label>
                                    <input
                                        type="time"
                                        value={timeStart}
                                        onChange={(e) =>
                                            setTimeStart(e.target.value)
                                        }
                                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-300 focus:border-stone-300 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wider">
                                        End
                                    </label>
                                    <input
                                        type="time"
                                        value={timeEnd}
                                        onChange={(e) =>
                                            setTimeEnd(e.target.value)
                                        }
                                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-300 focus:border-stone-300 transition-all"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 mt-2">
                                <button
                                    onClick={() => setShowEditShift(false)}
                                    className="flex-1 py-3 rounded-xl font-medium transition-colors"
                                    style={{
                                        backgroundColor: "#f5f4f1",
                                        color: "#78716c",
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpdateShift}
                                    className="flex-1 text-white py-3 rounded-xl font-medium transition-all duration-200 active:scale-95"
                                    style={{
                                        background:
                                            "linear-gradient(135deg, #5b8c7a, #6d9e8a)",
                                        boxShadow:
                                            "0 2px 8px rgba(91,140,122,0.2)",
                                    }}
                                >
                                    Update Shift
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
