import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getDate,
  getDaysInMonth,
  isBefore,
  isSameMonth,
  isSameDay,
  isToday,
  setDate,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";

export function addDaysToDate(date: Date, days: number) {
  return addDays(date, days);
}

export function fmt(date: Date | string | null | undefined, pattern = "yyyy/MM/dd") {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "";
  return format(d, pattern);
}

export function daysUntil(date: Date | string | null | undefined) {
  if (!date) return null;
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return null;
  return differenceInCalendarDays(startOfDay(d), startOfDay(new Date()));
}

export function isOverdue(date: Date | string | null | undefined, doneStatus?: string) {
  const days = daysUntil(date);
  if (days === null) return false;
  return days < 0 && doneStatus !== "DONE";
}

export function isDueSoon(date: Date | string | null | undefined, withinDays = 3, doneStatus?: string) {
  const days = daysUntil(date);
  if (days === null) return false;
  return days >= 0 && days <= withinDays && doneStatus !== "DONE";
}

/**
 * 月内の日付指定(1-31)を、実在しない日(2月30日等)は当該月末日に丸めて解決する。
 * dayOfMonth=99 は「月末」として扱う。
 */
export function resolveDayInMonth(year: number, monthIndex0: number, dayOfMonth: number) {
  const base = new Date(year, monthIndex0, 1);
  const lastDay = getDaysInMonth(base);
  if (dayOfMonth >= 99) return endOfMonth(base);
  const clamped = Math.min(Math.max(dayOfMonth, 1), lastDay);
  return setDate(base, clamped);
}

/**
 * 給与タスクの締め日/支払日から、対象年月(periodKey)における
 * 締め日・支払日の実日付を計算する。
 */
export function computePayrollDates(
  periodYear: number,
  periodMonth1: number, // 1-12
  closingDay: number,
  payDay: number,
  payMonthOffset: number
) {
  const monthIndex0 = periodMonth1 - 1;
  const closingDate = resolveDayInMonth(periodYear, monthIndex0, closingDay);
  const payBase = addMonths(new Date(periodYear, monthIndex0, 1), payMonthOffset);
  const payDate = resolveDayInMonth(payBase.getFullYear(), payBase.getMonth(), payDay);
  return { closingDate, payDate };
}

export function periodKeyOf(year: number, month1: number) {
  return `${year}-${String(month1).padStart(2, "0")}`;
}

export function getDate1(date: Date) {
  return getDate(date);
}

/**
 * 月表示カレンダー用に、指定月を含む週単位のグリッド(日曜始まり)を返す。
 */
export function buildMonthGrid(year: number, month1: number) {
  const monthStart = startOfMonth(new Date(year, month1 - 1, 1));
  const monthEnd = endOfMonth(monthStart);
  const gridStart = startOfWeek(monthStart);
  const gridEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }
  return { weeks, monthStart, monthEnd };
}

export { isBefore, isSameMonth, isSameDay, isToday };
