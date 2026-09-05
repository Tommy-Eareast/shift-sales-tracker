import { describe, it, expect } from "vitest";
import { formatShiftDisplayName, formatExportFilename } from "../../utils/date";
import {
  getWeekRange,
  formatDate,
  formatShortDate,
  addDays,
} from "../../utils/week";

describe("date utilities", () => {
  it("formatShiftDisplayName formats correctly", () => {
    const result = formatShiftDisplayName("2026-07-28", "07:00", "12:00");
    expect(result).toBe("28/07/2026 Tue 07:00-12:00");
  });

  it("formatExportFilename formats correctly", () => {
    const result = formatExportFilename("2026-07-28", "07:00", "12:00");
    expect(result).toBe("28-07-2026_Tue_0700_1200");
  });
});

describe("week utilities", () => {
  it("getWeekRange returns Monday and Sunday", () => {
    const wednesday = new Date("2026-07-29T10:00:00"); // Wed
    const { monday, sunday } = getWeekRange(wednesday);
    expect(monday.getDay()).toBe(1); // Monday
    expect(sunday.getDay()).toBe(0); // Sunday
    expect(formatDate(monday)).toBe("2026-07-27");
    expect(formatDate(sunday)).toBe("2026-08-02");
  });

  it("formatShortDate formats as Mon DD", () => {
    const result = formatShortDate(new Date("2026-08-25"));
    expect(result).toBe("Aug 25");
  });

  it("addDays adds days correctly", () => {
    const start = new Date("2026-08-25");
    const result = addDays(start, 7);
    expect(formatDate(result)).toBe("2026-09-01");
  });
});
