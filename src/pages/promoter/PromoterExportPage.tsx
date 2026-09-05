import { useState, useEffect } from "react";
import type { ShiftRecord } from "../../types";
import { shiftService } from "../../features/shifts/services/shiftService";
import { exportService } from "../../features/export/services/exportService";
import { whatsappService } from "../../features/export/services/whatsappService";
import { templateService } from "../../features/templates/services/templateService";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { AlertModal } from "../../components/ui/AlertModal";
import { formatExportFilename } from "../../utils/date";

export default function PromoterExportPage() {
  const [shifts, setShifts] = useState<ShiftRecord[]>([]);
  const [templates, setTemplates] = useState<Record<string, string>>({}); // templateId -> name
  const [selectedShift, setSelectedShift] = useState("");
  const [exporting, setExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [alertInfo, setAlertInfo] = useState<{
    title: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    shiftService.getAll().then(async (data) => {
      setShifts(data);
      // Load template names for all shifts
      const templateMap: Record<string, string> = {};
      for (const shift of data) {
        const t = await templateService.getById(shift.templateId);
        templateMap[shift.templateId] = t?.templateName || "Unknown";
      }
      setTemplates(templateMap);
    });
  }, []);

  const handleExport = async () => {
    if (!selectedShift) return;
    setExporting(true);
    try {
      const { content, filename } =
        await exportService.generateCsv(selectedShift);
      exportService.downloadCsv(content, filename);
    } catch (error) {
      console.error("Export failed:", error);
      setAlertInfo({ title: "Error", message: "Failed to export CSV" });
    } finally {
      setExporting(false);
    }
  };

  const handleCopySummary = async () => {
    if (!selectedShift) return;
    try {
      const text = await whatsappService.generateSummary(selectedShift);
      const success = await whatsappService.copyToClipboard(text);
      if (success) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (error) {
      console.error("Copy failed:", error);
      setAlertInfo({ title: "Error", message: "Failed to copy summary" });
    }
  };

  const selectedShiftData = shifts.find((s) => s.shiftId === selectedShift);
  const templateName = selectedShiftData
    ? templates[selectedShiftData.templateId] || "Unknown"
    : "";

  return (
    <div className="space-y-4">
      <Card className="p-6 text-center">
        <div
          className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "#ecf5f1" }}
        >
          <svg
            className="w-7 h-7"
            style={{ color: "#5b8c7a" }}
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
        </div>
        <h3 className="text-lg font-semibold text-stone-900 mb-1 tracking-tight">
          Export Report
        </h3>
        <p className="text-sm text-stone-400 mb-5">
          Download CSV or copy for WhatsApp
        </p>

        <select
          value={selectedShift}
          onChange={(e) => setSelectedShift(e.target.value)}
          className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-300 mb-4"
        >
          <option value="">Select a shift...</option>
          {shifts.map((shift) => (
            <option key={shift.shiftId} value={shift.shiftId}>
              {shift.shiftDisplayName}
            </option>
          ))}
        </select>

        {selectedShiftData && (
          <p className="text-xs text-stone-400 mb-4 font-mono">
            {formatExportFilename(
              selectedShiftData.recordDate,
              selectedShiftData.shiftTimeStart,
              selectedShiftData.shiftTimeEnd,
            )}
            _{templateName.replace(/\s+/g, "_")}.csv
          </p>
        )}

        <div className="space-y-2">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            disabled={!selectedShift || exporting}
            onClick={handleExport}
          >
            {exporting ? "Exporting..." : "Export CSV"}
          </Button>
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            disabled={!selectedShift}
            onClick={handleCopySummary}
          >
            {copied ? "✓ Copied!" : "Copy for WhatsApp"}
          </Button>
        </div>
      </Card>

      {shifts.length === 0 && (
        <Card className="p-6 text-center">
          <p className="text-stone-400 text-sm">
            No shifts available for export
          </p>
        </Card>
      )}

      <AlertModal
        isOpen={alertInfo !== null}
        title={alertInfo?.title || ""}
        message={alertInfo?.message || ""}
        onClose={() => setAlertInfo(null)}
      />
    </div>
  );
}
