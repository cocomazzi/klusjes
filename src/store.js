import { useEffect, useState, useCallback } from "react";
import { supabase } from "./supabase";
import { dateKey } from "./recurrence";
const KEY = "klusjes-demo-v1";
async function allRows(table) {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .order(table === "series" ? "id" : "series_id")
      .order(table === "series" ? "id" : "day")
      .range(from, from + 999);
    if (error) return { error };
    rows.push(...data);
    if (data.length < 1000) return { data: rows };
  }
}

const demo = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || { series: [], states: [] };
  } catch {
    return { series: [], states: [] };
  }
};
export function useStore() {
  const [session, setSession] = useState(null),
    [data, setData] = useState(supabase ? { series: [], states: [] } : demo),
    [status, setStatus] = useState(
      supabase ? "Verbinden…" : "Alleen op dit apparaat",
    ),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, s) => {
      setSession(s);
      if (!s) setData({ series: [], states: [] });
    });
    return () => subscription.unsubscribe();
  }, []);
  const refresh = useCallback(async () => {
    if (!session) return;
    const [a, b] = await Promise.all([
      allRows("series"),
      allRows("occurrences"),
    ]);
    if (a.error || b.error) {
      setError((a.error || b.error).message);
      return;
    }
    setData({ series: a.data, states: b.data });
  }, [session]);
  useEffect(() => {
    if (!session) return;
    refresh();
    const ch = supabase
      .channel("household")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "series" },
        refresh,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "occurrences" },
        refresh,
      )
      .subscribe((s) => {
        setStatus(
          s === "SUBSCRIBED"
            ? "Live gesynchroniseerd"
            : "Verbinding herstellen…",
        );
        if (s === "SUBSCRIBED") refresh();
      });
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      supabase.removeChannel(ch);
      window.removeEventListener("focus", onFocus);
    };
  }, [session, refresh]);
  useEffect(() => {
    if (!supabase) localStorage.setItem(KEY, JSON.stringify(data));
  }, [data]);
  useEffect(() => {
    if (supabase) return;
    const fn = (e) => {
      if (e.key === KEY) setData(demo());
    };
    window.addEventListener("storage", fn);
    return () => window.removeEventListener("storage", fn);
  }, []);
  async function save(table, row) {
    setBusy(true);
    setError("");
    try {
      if (supabase) {
        if (!session) throw Error("Log eerst in.");
        const { error } = await supabase
          .from(table)
          .upsert(
            { ...row, owner_id: session.user.id },
            { onConflict: table === "series" ? "id" : "series_id,day" },
          );
        if (error) throw error;
        await refresh();
      } else
        setData((d) => {
          const key = table === "series" ? "series" : "states";
          return {
            ...d,
            [key]: [
              ...d[key].filter((x) =>
                table === "series"
                  ? x.id !== row.id
                  : !(x.series_id === row.series_id && x.day === row.day),
              ),
              {
                ...d[key].find((x) =>
                  table === "series"
                    ? x.id === row.id
                    : x.series_id === row.series_id && x.day === row.day,
                ),
                ...row,
              },
            ],
          };
        });
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function updateState(series_id, day, patch) {
    const existing =
      data.states.find((x) => x.series_id === series_id && x.day === day) || {};
    return save("occurrences", { ...existing, series_id, day, ...patch });
  }
  return {
    ...data,
    session,
    status,
    error,
    setError,
    busy,
    save,
    updateState,
    configured: !!supabase,
  };
}
