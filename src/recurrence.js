export const dateKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const parse = (d) => new Date(d + "T12:00:00");
export const addDays = (d, n) => {
  const x = parse(d);
  x.setDate(x.getDate() + n);
  return dateKey(x);
};
export function matches(r, date) {
  if (date < r.start || (r.until && date > r.until)) return false;
  const a = parse(r.start),
    b = parse(date),
    days = Math.round(
      (Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) -
        Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())) /
        86400000,
    ),
    n = Math.max(1, Number(r.interval) || 1);
  if (r.freq === "once") return date === r.start;
  if (r.freq === "daily") return days % n === 0;
  if (r.freq === "weekly")
    return (
      Math.floor((days + ((a.getDay() + 6) % 7)) / 7) % n === 0 &&
      (r.weekdays?.length ? r.weekdays : [a.getDay()]).includes(b.getDay())
    );
  if (r.freq === "monthly")
    return (
      ((b.getFullYear() - a.getFullYear()) * 12 + b.getMonth() - a.getMonth()) %
        n ===
        0 &&
      b.getDate() ===
        Math.min(
          a.getDate(),
          new Date(b.getFullYear(), b.getMonth() + 1, 0).getDate(),
        )
    );
  return false;
}
export function occurrence(series, date, states) {
  const rule = [...series.rules].reverse().find((r) => date >= r.start);
  if (!rule || !matches(rule, date)) return null;
  const state = states.find((s) => s.series_id === series.id && s.day === date);
  if (state?.deleted) return null;
  return {
    series,
    date,
    title: state?.title ?? rule.title,
    done: state?.done ?? false,
    rule,
  };
}
export function futureRules(series, date, rule) {
  return [
    ...series.rules
      .filter((r) => r.start < date)
      .map((r) => ({
        ...r,
        until: r.until && r.until < date ? r.until : addDays(date, -1),
      })),
    { ...rule, start: date },
  ];
}
export const labels = {
  once: "Eenmalig",
  daily: "Elke dag",
  weekly: "Elke week",
  monthly: "Elke maand",
};
