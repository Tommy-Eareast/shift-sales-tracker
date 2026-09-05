import { useNavigate } from "react-router-dom";
import { Card } from "../../../components/ui/Card";
import type { ShiftRecord, ShiftTemplate, ShiftSummary } from "../../../types";

type Props = {
  shift: ShiftRecord;
  template: ShiftTemplate | null;
  summary: ShiftSummary | null;
};

export function ShiftHeader({ shift, template, summary }: Props) {
  const navigate = useNavigate();

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => navigate("/")}
          className="p-2 rounded-xl text-stone-400 hover:text-stone-600 hover:bg-stone-50 transition-colors"
        >
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <div className="text-center flex-1">
          <h2 className="font-semibold text-stone-900 text-sm tracking-tight">
            {shift.shiftDisplayName}
          </h2>
          <p className="text-xs text-stone-400 mt-0.5">
            {template?.templateName}
          </p>
        </div>
        <div className="w-8" />
      </div>

      {summary && (
        <div className="grid grid-cols-2 gap-3">
          <div
            className="rounded-xl p-3"
            style={{ backgroundColor: "#ecf5f1" }}
          >
            <p
              className="text-xs font-medium uppercase tracking-wider"
              style={{ color: "#5b8c7a" }}
            >
              Total Sold
            </p>
            <p className="text-xl font-bold text-stone-900 tracking-tight">
              {summary.totalCount}
            </p>
          </div>
          <div
            className="rounded-xl p-3"
            style={{ backgroundColor: "#ecf5f1" }}
          >
            <p
              className="text-xs font-medium uppercase tracking-wider"
              style={{ color: "#5b8c7a" }}
            >
              Revenue
            </p>
            <p className="text-xl font-bold text-stone-900 tracking-tight">
              ${summary.totalRevenue}
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}
