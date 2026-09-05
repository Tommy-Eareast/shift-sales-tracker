import { getWeekRange, formatShortDate } from "../../../utils/week";

type Props = {
  weekOffset: number;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onUseCustomRange: () => void;
  useCustomRange: boolean;
};

/**
 * Week selector with prev/next arrows.
 * Defaults to current week (Mon-Sun). Toggle for custom date range.
 */
export function WeekSelector({
  weekOffset,
  onPrevWeek,
  onNextWeek,
  onUseCustomRange,
  useCustomRange,
}: Props) {
  const currentDate = new Date();
  currentDate.setDate(currentDate.getDate() + weekOffset * 7);
  const { monday, sunday } = getWeekRange(currentDate);

  return (
    <div className="mb-5">
      <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wider">
        Week
      </label>
      <div className="flex items-center gap-2">
        <button
          onClick={onPrevWeek}
          className="p-2 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-50"
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
        <div className="flex-1 text-center text-sm font-medium text-stone-900">
          {formatShortDate(monday)} — {formatShortDate(sunday)}
        </div>
        <button
          onClick={onNextWeek}
          className="p-2 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-50"
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
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      <button
        onClick={onUseCustomRange}
        className="text-xs text-stone-400 hover:text-stone-600 mt-2"
      >
        {useCustomRange ? "Use week selector instead" : "Custom date range"}
      </button>
    </div>
  );
}
