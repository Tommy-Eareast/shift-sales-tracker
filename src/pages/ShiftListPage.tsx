import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useShifts } from "../features/shifts/hooks/useShifts";
import { useTemplates } from "../features/templates/hooks/useTemplates";
import { Card, CardHeader } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { NewShiftModal } from "../features/shifts/components/NewShiftModal";
import { EditShiftModal } from "../features/shifts/components/EditShiftModal";

export default function ShiftListPage() {
    const navigate = useNavigate();
    const { shifts, summaries, loading, error, create, update, remove } =
        useShifts();
    const { templates } = useTemplates();

    const [showNew, setShowNew] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [templateId, setTemplateId] = useState("");
    const [date, setDate] = useState("");
    const [start, setStart] = useState("07:00");
    const [end, setEnd] = useState("12:00");

    const openNew = () => {
        setTemplateId(templates[0]?.templateId || "");
        setDate(new Date().toISOString().split("T")[0]);
        setStart("07:00");
        setEnd("12:00");
        setShowNew(true);
    };
    const openEdit = (id: string) => {
        const s = shifts.find((x) => x.shiftId === id);
        if (s) {
            setEditingId(id);
            setDate(s.recordDate);
            setStart(s.shiftTimeStart);
            setEnd(s.shiftTimeEnd);
            setShowEdit(true);
        }
    };

    if (loading)
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-stone-400 text-sm">Loading...</div>
            </div>
        );
    if (error)
        return (
            <Card className="p-6 text-center">
                <p className="text-red-500 text-sm">{error}</p>
            </Card>
        );

    const editingTemplate =
        templates.find(
            (t) =>
                t.templateId ===
                shifts.find((s) => s.shiftId === editingId)?.templateId,
        )?.templateName || "";

    return (
        <div>
            <div className="grid grid-cols-2 gap-3 mb-6">
                <Card>
                    <p className="text-xs font-medium text-stone-400 uppercase tracking-wider">
                        Total Shifts
                    </p>
                    <p className="text-2xl font-bold text-stone-900 mt-1 tracking-tight">
                        {shifts.length}
                    </p>
                    <p className="text-xs text-stone-400 mt-1">All time</p>
                </Card>
                <Card>
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
                </Card>
            </div>

            <div className="space-y-3">
                <CardHeader>
                    <h2 className="text-lg font-semibold text-stone-900 tracking-tight">
                        Recent Shifts
                    </h2>
                    <Button variant="primary" size="md" onClick={openNew}>
                        + New Shift
                    </Button>
                </CardHeader>

                {shifts.length === 0 ? (
                    <Card className="p-8 text-center">
                        <div className="text-4xl mb-3">⚱️</div>
                        <p className="text-stone-500 font-medium">
                            No shifts recorded yet
                        </p>
                        <p className="text-sm text-stone-400 mt-1">
                            Create your first shift to start tracking sales
                        </p>
                    </Card>
                ) : (
                    shifts.map((shift) => {
                        const t = templates.find(
                            (x) => x.templateId === shift.templateId,
                        );
                        const s = summaries[shift.shiftId];
                        return (
                            <Card
                                key={shift.shiftId}
                                interactive
                                onClick={() =>
                                    navigate(`/shift/${shift.shiftId}`)
                                }
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2.5">
                                            <span
                                                className="w-2 h-2 rounded-full flex-shrink-0"
                                                style={{
                                                    backgroundColor: "#5b8c7a",
                                                }}
                                            />
                                            <h3 className="font-semibold text-stone-900 text-sm">
                                                {shift.shiftDisplayName}
                                            </h3>
                                        </div>
                                        <p className="text-xs text-stone-400 mt-1 ml-[18px]">
                                            {t?.templateName || "Unknown"}
                                        </p>
                                        {s && (
                                            <div className="flex items-center gap-4 mt-2 ml-[18px]">
                                                <span className="text-xs text-stone-500">
                                                    <span className="font-semibold text-stone-700">
                                                        {s.totalCount}
                                                    </span>{" "}
                                                    sold
                                                </span>
                                                <span
                                                    className="text-xs font-semibold"
                                                    style={{ color: "#5b8c7a" }}
                                                >
                                                    ${s.totalRevenue}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-0.5 ml-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openEdit(shift.shiftId);
                                            }}
                                            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-50"
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
                                                if (
                                                    confirm(
                                                        "Delete this shift? All sales data will be lost.",
                                                    )
                                                )
                                                    remove(shift.shiftId);
                                            }}
                                            className="p-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50"
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
                            </Card>
                        );
                    })
                )}
            </div>

            <NewShiftModal
                isOpen={showNew}
                onClose={() => setShowNew(false)}
                templates={templates}
                selectedTemplate={templateId}
                recordDate={date}
                timeStart={start}
                timeEnd={end}
                onTemplateChange={setTemplateId}
                onDateChange={setDate}
                onTimeStartChange={setStart}
                onTimeEndChange={setEnd}
                onCreate={async () => {
                    try {
                        await create(templateId, date, start, end);
                        setShowNew(false);
                    } catch (e) {
                        alert(e instanceof Error ? e.message : "Failed");
                    }
                }}
            />

            <EditShiftModal
                isOpen={showEdit}
                onClose={() => setShowEdit(false)}
                templateName={editingTemplate}
                recordDate={date}
                timeStart={start}
                timeEnd={end}
                onDateChange={setDate}
                onTimeStartChange={setStart}
                onTimeEndChange={setEnd}
                onUpdate={async () => {
                    try {
                        await update(editingId!, {
                            recordDate: date,
                            shiftTimeStart: start,
                            shiftTimeEnd: end,
                        });
                        setShowEdit(false);
                    } catch (e) {
                        alert(e instanceof Error ? e.message : "Failed");
                    }
                }}
            />
        </div>
    );
}
