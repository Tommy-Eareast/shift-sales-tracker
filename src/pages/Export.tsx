import { useState, useEffect } from "react";
import type { ShiftRecord } from "../types";
import { getAllShiftRecords, getTemplate } from "../db/operations";
import { exportShiftToCsv, downloadCsv } from "../utils/csv";

export default function Export() {
    const [shifts, setShifts] = useState<ShiftRecord[]>([]);
    const [selectedShift, setSelectedShift] = useState("");
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        getAllShiftRecords().then(setShifts);
    }, []);

    const formatFilename = (shift: ShiftRecord): string => {
        const [year, month, day] = shift.recordDate.split("-");
        const date = new Date(
            parseInt(year),
            parseInt(month) - 1,
            parseInt(day),
        );
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const dayStr = `${parseInt(day)}-${month}-${year}`;
        const dayName = days[date.getDay()];
        const timeStr = shift.shiftTimeStart.replace(":", "");
        return `${dayStr}_${dayName}_${timeStr}`;
    };

    const handleExport = async () => {
        if (!selectedShift) return;
        setExporting(true);
        try {
            const csvContent = await exportShiftToCsv(selectedShift);
            const shift = shifts.find((s) => s.shiftId === selectedShift);
            if (!shift) {
                alert("Shift not found");
                return;
            }
            const template = await getTemplate(shift.templateId);
            const templateName = template?.templateName || "Unknown";
            const filename = `${formatFilename(shift)}_${templateName.replace(/\s+/g, "_")}.csv`;
            downloadCsv(csvContent, filename);
        } catch (error) {
            console.error("Export failed:", error);
            alert("Failed to export CSV");
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-violet-50 flex items-center justify-center">
                    <span className="text-3xl">📤</span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    Export Shift Report
                </h3>
                <p className="text-sm text-slate-500 mb-4">
                    Download CSV file matching your Excel format
                </p>
                <select
                    value={selectedShift}
                    onChange={(e) => setSelectedShift(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 mb-4"
                >
                    <option value="">Select a shift...</option>
                    {shifts.map((shift) => (
                        <option key={shift.shiftId} value={shift.shiftId}>
                            {shift.shiftDisplayName}
                        </option>
                    ))}
                </select>
                {selectedShift && (
                    <p className="text-xs text-slate-400 mb-3">
                        Filename:{" "}
                        <span className="font-mono">
                            {formatFilename(
                                shifts.find(
                                    (s) => s.shiftId === selectedShift,
                                )!,
                            )}
                            _*.csv
                        </span>
                    </p>
                )}
                <button
                    onClick={handleExport}
                    disabled={!selectedShift || exporting}
                    className="w-full bg-violet-600 text-white py-3 rounded-xl font-medium hover:bg-violet-700 transition-colors shadow-md shadow-violet-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {exporting ? "Exporting..." : "Export CSV"}
                </button>
            </div>
            {shifts.length === 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 text-center">
                    <p className="text-slate-500">
                        No shifts available for export
                    </p>
                </div>
            )}
        </div>
    );
}
