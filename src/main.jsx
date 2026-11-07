import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import {
  Home,
  CalendarDays,
  ListTodo,
  Settings,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Check,
  Repeat2,
  MoreHorizontal,
  Wifi,
  Download,
} from "lucide-react";
import {
  dateKey,
  parse,
  addDays,
  occurrence,
  futureRules,
  labels,
} from "./recurrence";
import { useStore } from "./store";
import { supabase } from "./supabase";
import "./style.css";
const fmt = (d, opts) => parse(d).toLocaleDateString("nl-NL", opts);
const suggestions = [
  "Stofzuigen",
  "Badkamer schoonmaken",
  "Was ophangen",
  "Planten water geven",
  "Bed verschonen",
  "Dweilen",
  "Vuilnis buitenzetten",
  "Keuken schoonmaken",
  "Ramen wassen",
  "Was opvouwen",
];
function Editor({ item, date, store, onClose }) {
  const [title, setTitle] = useState(item?.title || ""),
    [day, setDay] = useState(item?.date || date),
    [freq, setFreq] = useState(item?.rule.freq || "once"),
    [interval, setInterval] = useState(item?.rule.interval || 1),
    [weekdays, setWeekdays] = useState(
      item?.rule.weekdays || [parse(day).getDay()],
    ),
    [scope, setScope] = useState("one"),
    [custom, setCustom] = useState((item?.rule.interval || 1) > 1),
    [show, setShow] = useState(false);
  const ref = useRef();
  useEffect(() => {
    ref.current?.focus();
    const fn = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", fn);
    const previous = document.activeElement;
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = old;
      previous?.focus();
      document.removeEventListener("keydown", fn);
    };
  }, []);
  async function submit(e) {
    e.preventDefault();
    let ok;
    const rule = {
      title: title.trim(),
      start: day,
      freq,
      interval: Number(interval),
      weekdays,
    };
    if (!rule.title) return;
    if (item) {
      if (scope === "one")
        ok = await store.updateState(item.series.id, item.date, {
          title: rule.title,
        });
      else
        ok = await store.save("series", {
          ...item.series,
          rules: futureRules(item.series, item.date, rule),
        });
    } else
      ok = await store.save("series", {
        id: crypto.randomUUID(),
        rules: [rule],
      });
    if (ok) onClose();
  }
  async function remove() {
    const ok =
      scope === "one"
        ? await store.updateState(item.series.id, item.date, { deleted: true })
        : await store.save("series", {
            ...item.series,
            rules: item.series.rules
              .filter((r) => r.start < item.date)
              .map((r) => ({
                ...r,
                until:
                  r.until && r.until < item.date
                    ? r.until
                    : addDays(item.date, -1),
              })),
          });
    if (ok) onClose();
  }
  return (
    <div
      className="overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        className="sheet"
        onKeyDown={(e) => {
          if (e.key !== "Tab") return;
          const els = [
            ...e.currentTarget.querySelectorAll(
              "button:not(:disabled),input,select",
            ),
          ];
          const first = els[0],
            last = els.at(-1);
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last?.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first?.focus();
          }
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="editor-title"
      >
        <div className="handle" />
        <header>
          <h2 id="editor-title">{item ? "Klusje bewerken" : "Nieuw klusje"}</h2>
          <button aria-label="Sluiten" onClick={onClose}>
            <X />
          </button>
        </header>
        <form onSubmit={submit}>
          {item && (
            <label>
              Wijzigingen toepassen op
              <select value={scope} onChange={(e) => setScope(e.target.value)}>
                <option value="one">Alleen dit klusje</option>
                <option value="future">Dit en alle toekomstige klusjes</option>
              </select>
            </label>
          )}
          <label>
            Naam
            <input
              ref={ref}
              required
              maxLength={200}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setShow(true);
              }}
              onFocus={() => setShow(true)}
              placeholder="Bijv. Stofzuigen"
              role="combobox"
              aria-expanded={show}
              aria-controls="suggestions"
              autoComplete="off"
            />
          </label>
          {show && (
            <div id="suggestions" className="suggestions" role="listbox">
              {[
                ...new Set([
                  ...suggestions,
                  ...store.series.flatMap((s) => s.rules.map((r) => r.title)),
                ]),
              ]
                .filter((s) => s.toLowerCase().includes(title.toLowerCase()))
                .slice(0, 5)
                .map((s) => (
                  <button
                    key={s}
                    type="button"
                    role="option"
                    aria-selected={title === s}
                    onClick={() => {
                      setTitle(s);
                      setShow(false);
                    }}
                  >
                    {s}
                  </button>
                ))}
              {title &&
                !suggestions.some(
                  (s) => s.toLowerCase() === title.toLowerCase(),
                ) && (
                  <button type="button" onClick={() => setShow(false)}>
                    <Plus size={16} /> “{title}” aanmaken
                  </button>
                )}
            </div>
          )}
          {!item && (
            <label>
              Datum
              <input
                type="date"
                required
                value={day}
                onChange={(e) => {
                  setDay(e.target.value);
                  setWeekdays([parse(e.target.value).getDay()]);
                }}
              />
            </label>
          )}
          {(!item || scope === "future") && (
            <>
              <label>
                Herhalen
                <select
                  value={custom ? "custom" : freq}
                  onChange={(e) => {
                    if (e.target.value === "custom") {
                      setCustom(true);
                      setFreq("weekly");
                    } else {
                      setCustom(false);
                      setFreq(e.target.value);
                      setInterval(1);
                    }
                  }}
                >
                  {Object.entries(labels).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                  <option value="custom">Aangepast…</option>
                </select>
              </label>
              {custom && (
                <>
                  <div className="formrow">
                    <label>
                      Elke
                      <input
                        type="number"
                        min="1"
                        max="365"
                        required
                        value={interval}
                        onChange={(e) => setInterval(e.target.value)}
                      />
                    </label>
                    <label>
                      Eenheid
                      <select
                        value={freq}
                        onChange={(e) => setFreq(e.target.value)}
                      >
                        <option value="daily">dagen</option>
                        <option value="weekly">weken</option>
                        <option value="monthly">maanden</option>
                      </select>
                    </label>
                  </div>
                  {freq === "weekly" && (
                    <fieldset>
                      <legend>Op deze dagen</legend>
                      <div className="weekday-choices">
                        {[1, 2, 3, 4, 5, 6, 0].map((d, i) => (
                          <button
                            className={weekdays.includes(d) ? "selected" : ""}
                            type="button"
                            aria-pressed={weekdays.includes(d)}
                            key={d}
                            onClick={() =>
                              setWeekdays((v) =>
                                v.includes(d)
                                  ? v.filter((x) => x !== d)
                                  : [...v, d],
                              )
                            }
                          >
                            {["ma", "di", "wo", "do", "vr", "za", "zo"][i]}
                          </button>
                        ))}
                      </div>
                      {!weekdays.length && (
                        <small>Geen keuze: de dag van de startdatum.</small>
                      )}
                    </fieldset>
                  )}
                </>
              )}
            </>
          )}
          {item && (
            <p className="muted">
              Datum:{" "}
              {fmt(item.date, {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
              . Voltooide dagen blijven bewaard.
            </p>
          )}
          {store.error && (
            <p role="alert" className="error">
              {store.error}
            </p>
          )}
          <button className="primary w-full" disabled={store.busy}>
            Opslaan
          </button>
          {item && (
            <button
              type="button"
              className="delete"
              disabled={store.busy}
              onClick={remove}
            >
              Verwijderen
            </button>
          )}
        </form>
      </section>
    </div>
  );
}
function ChoreList({ items, store, onEdit }) {
  return (
    <div className="chores">
      {!items.length && (
        <div className="empty">
          <Home size={30} />
          <h3>Ruimte voor een rustig thuis</h3>
          <p>Voeg een klusje toe voor deze dag.</p>
        </div>
      )}
      {[...items]
        .sort(
          (a, b) =>
            Number(a.done) - Number(b.done) ||
            a.title.localeCompare(b.title, "nl"),
        )
        .map((i) => (
          <div className={"chore " + (i.done ? "done" : "")} key={i.series.id}>
            <button
              className="checkbox"
              role="checkbox"
              aria-checked={i.done}
              aria-label={`${i.title} ${i.done ? "heropenen" : "afronden"}`}
              disabled={store.busy}
              onClick={() =>
                store.updateState(i.series.id, i.date, { done: !i.done })
              }
            >
              {i.done && <Check size={19} />}
            </button>
            <button className="chore-name" onClick={() => onEdit(i)}>
              <span>{i.title}</span>
              {i.rule.freq !== "once" && (
                <small>
                  <Repeat2 size={12} />
                  {labels[i.rule.freq]}
                  {i.rule.interval > 1 ? ` · ${i.rule.interval}` : ""}
                </small>
              )}
            </button>
            <button
              className="more"
              aria-label={`${i.title} bewerken`}
              onClick={() => onEdit(i)}
            >
              <MoreHorizontal size={19} />
            </button>
          </div>
        ))}
    </div>
  );
}
function Account({ store }) {
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [message, setMessage] = useState(""),
    [pending, setPending] = useState(false);
  async function login(e) {
    e.preventDefault();
    setPending(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setMessage(
      error ? "Inloggen mislukt. Controleer je e-mailadres en wachtwoord." : "",
    );
    setPending(false);
  }
  return (
    <section className="settings">
      <h2>Samen thuis</h2>
      <p>Gebruik op beide apparaten hetzelfde huishoudaccount.</p>
      {!store.configured ? (
        <div className="notice">
          <h3>Lokale modus</h3>
          <p>
            Je klusjes worden op dit apparaat bewaard. Stel Supabase in volgens
            de README om ze te delen.
          </p>
        </div>
      ) : store.session ? (
        <>
          <p className="notice">Ingelogd als {store.session.user.email}</p>
          <button
            className="secondary"
            onClick={async () => {
              const { error } = await supabase.auth.signOut();
              if (error) setMessage(error.message);
            }}
          >
            Uitloggen
          </button>
        </>
      ) : (
        <form onSubmit={login}>
          <label>
            E-mailadres
            <input
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label>
            Wachtwoord
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <button className="primary" disabled={pending}>
            Inloggen
          </button>
        </form>
      )}
      {message && <p role="alert">{message}</p>}
      <hr />
      <h3>Op je telefoon</h3>
      <p>
        Open Klusjes in je browser en kies ‘Toevoegen aan beginscherm’ om de app
        te installeren.
      </p>
      <h3>Een dag tegelijk</h3>
      <p>
        Klusjes zonder vinkje blijven op hun oorspronkelijke dag. Je hoeft niets
        in te halen voordat je verder kunt.
      </p>
    </section>
  );
}
function App() {
  const store = useStore(),
    [section, setSection] = useState("Kalender"),
    [view, setView] = useState("Dag"),
    [date, setDate] = useState(dateKey()),
    [editor, setEditor] = useState(null),
    [search, setSearch] = useState("");
  const touch = useRef(null);
  const monday = addDays(date, -(parse(date).getDay() + 6) % 7),
    days = Array.from({ length: 7 }, (_, i) => addDays(monday, i)),
    items = (d) =>
      store.series.map((s) => occurrence(s, d, store.states)).filter(Boolean),
    todayItems = items(date);
  function add() {
    if (store.configured && !store.session) {
      setSection("Instellingen");
      return;
    }
    setEditor({});
  }
  function step(n) {
    setDate(addDays(date, n * (view === "Week" ? 7 : 1)));
  }
  function goHome() {
    setSection("Kalender");
    setView("Dag");
    setDate(dateKey());
  }
  return (
    <div className="app">
      <header className="brand">
        <h1>
          <button
            className="brand-home"
            aria-label="Klusjes · Naar vandaag"
            onClick={goHome}
          >
            <Home size={29} aria-hidden="true" />
            <span>Klusjes</span>
          </button>
        </h1>
        <span>Thuis</span>
      </header>
      <main>
        {section === "Kalender" ? (
          <>
            <div className="segmented">
              {["Dag", "Week"].map((v) => (
                <button
                  className={view === v ? "selected" : ""}
                  aria-pressed={view === v}
                  onClick={() => setView(v)}
                  key={v}
                >
                  {v}
                </button>
              ))}
            </div>
            <div className="datebar">
              <button aria-label="Vorige" onClick={() => step(-1)}>
                <ChevronLeft />
              </button>
              <h2>{fmt(date, { month: "long", year: "numeric" })}</h2>
              <button className="today" onClick={() => setDate(dateKey())}>
                Vandaag
              </button>
              <button aria-label="Volgende" onClick={() => step(1)}>
                <ChevronRight />
              </button>
            </div>
            <div className="weekstrip">
              {days.map((d) => (
                <button
                  key={d}
                  onClick={() => setDate(d)}
                  className={d === date ? "selected" : ""}
                  aria-label={fmt(d, { dateStyle: "full" })}
                  aria-current={d === date ? "date" : undefined}
                >
                  <span>{fmt(d, { weekday: "short" }).replace(".", "")}</span>
                  <strong>{parse(d).getDate()}</strong>
                  {d === dateKey() && <i />}
                </button>
              ))}
            </div>
            <div
              className="calendar-content"
              onTouchStart={(e) => {
                touch.current = {
                  x: e.touches[0].clientX,
                  y: e.touches[0].clientY,
                };
              }}
              onTouchEnd={(e) => {
                if (!touch.current) return;
                const dx = e.changedTouches[0].clientX - touch.current.x,
                  dy = e.changedTouches[0].clientY - touch.current.y;
                if (Math.abs(dx) > 65 && Math.abs(dx) > Math.abs(dy) * 1.5)
                  step(dx < 0 ? 1 : -1);
                touch.current = null;
              }}
            >
              {view === "Dag" ? (
                <>
                  <div className="day-heading">
                    <h2>
                      {fmt(date, {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      })}
                    </h2>
                    <p>
                      {todayItems.filter((i) => i.done).length} van{" "}
                      {todayItems.length} afgerond
                    </p>
                  </div>
                  <ChoreList
                    items={todayItems}
                    store={store}
                    onEdit={setEditor}
                  />
                </>
              ) : (
                <div className="weekview">
                  {days.map((d) => (
                    <section key={d}>
                      <button
                        className="week-title"
                        onClick={() => {
                          setDate(d);
                          setView("Dag");
                        }}
                      >
                        {fmt(d, {
                          weekday: "long",
                          day: "numeric",
                          month: "short",
                        })}
                        <Plus size={16} />
                      </button>
                      <ChoreList
                        items={items(d)}
                        store={store}
                        onEdit={setEditor}
                      />
                    </section>
                  ))}
                </div>
              )}
            </div>
            <button className="primary add" onClick={add}>
              <Plus />
              Klusje toevoegen
            </button>
          </>
        ) : section === "Alle klusjes" ? (
          <>
            <div className="page-heading">
              <h2>Alle klusjes</h2>
              <p>Alles voor jullie thuis, op één plek.</p>
            </div>
            <input
              aria-label="Klusjes zoeken"
              placeholder="Zoek een klusje…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="library">
              {store.series
                .filter(
                  (s) =>
                    s.rules.length &&
                    s.rules
                      .at(-1)
                      .title.toLowerCase()
                      .includes(search.toLowerCase()),
                )
                .map((s) => {
                  const r = s.rules.at(-1);
                  return (
                    <button
                      key={s.id}
                      onClick={() => {
                        setDate(r.start > date ? r.start : date);
                        setSection("Kalender");
                      }}
                    >
                      <div>
                        <strong>{r.title}</strong>
                        <small>
                          {labels[r.freq]} · vanaf{" "}
                          {fmt(r.start, { day: "numeric", month: "short" })}
                          {r.until ? " · beëindigd" : ""}
                        </small>
                      </div>
                      <ChevronRight size={18} />
                    </button>
                  );
                })}
              {!store.series.length && (
                <p className="muted">Je eerste klusje begint hier.</p>
              )}
            </div>
            <button className="primary add" onClick={add}>
              <Plus />
              Klusje toevoegen
            </button>
          </>
        ) : (
          <Account store={store} />
        )}{" "}
        {store.error && !editor && (
          <p className="error" role="alert">
            {store.error}
          </p>
        )}
      </main>
      <footer>
        <div className="sync">
          <span className={store.session ? "live" : ""} />
          {store.status}
        </div>
        <nav>
          {[
            [CalendarDays, "Kalender"],
            [ListTodo, "Alle klusjes"],
            [Settings, "Instellingen"],
          ].map(([Icon, name]) => (
            <button
              aria-current={section === name ? "page" : undefined}
              className={section === name ? "selected" : ""}
              key={name}
              onClick={() => setSection(name)}
            >
              <Icon size={22} />
              <span>{name}</span>
            </button>
          ))}
        </nav>
      </footer>
      {editor && (
        <Editor
          item={editor.series ? editor : null}
          date={date}
          store={store}
          onClose={() => setEditor(null)}
        />
      )}
    </div>
  );
}
createRoot(document.getElementById("root")).render(<App />);
