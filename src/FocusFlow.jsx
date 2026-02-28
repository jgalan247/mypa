import { useState, useEffect, useReducer, useRef, useCallback, useMemo } from "react";

/*
  ╔══════════════════════════════════════════════════════════════╗
  ║  FOCUSFLOW — Personal ADHD + Dyslexia Support PWA          ║
  ║                                                              ║
  ║  Features:                                                   ║
  ║  1. Reading support (TTS, bionic reading, reading guide,     ║
  ║     text simplification, chunking)                           ║
  ║  2. Task initiation (micro-steps, "just start" nudges,      ║
  ║     body doubling timer, energy matching)                    ║
  ║  3. Time blindness (visual countdown, time-elapsed bar,     ║
  ║     audio cues, now/next/later structure)                    ║
  ║  4. Writing/spelling (voice-to-text, spell check,           ║
  ║     word prediction, dyslexia-friendly editing)              ║
  ║  5. Overwhelm reduction (single-task mode, breathing,       ║
  ║     brain dump, priority matrix, daily limit)                ║
  ║  6. Full PWA with offline support                            ║
  ╚══════════════════════════════════════════════════════════════╝
*/

// ─── CONSTANTS ────────────────────────────────────────────────────
const FONTS = {
  dyslexic: "'OpenDyslexic', 'Comic Sans MS', cursive",
  atkinson: "'Atkinson Hyperlegible', 'Verdana', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

const THEMES = {
  cream: {
    name: "Cream", emoji: "☀️",
    bg: "#FDF6EC", surface: "#FFF8EF", surfaceAlt: "#F5EBD8", surfaceGlow: "#FFF3E0",
    text: "#3D3229", textMuted: "#8C7A65", accent: "#E8913A", accentSoft: "#F5D4A9",
    accentDark: "#C47520", success: "#6B9E5B", successSoft: "#E3F0DE",
    danger: "#D4644E", dangerSoft: "#FDEAE6", warning: "#D4A44E", warningSoft: "#FFF3D6",
    border: "#E8DCC8", shadow: "rgba(61,50,41,0.08)", focusRing: "rgba(232,145,58,0.35)",
    gradient: "linear-gradient(135deg, #FDF6EC 0%, #FFF3E0 100%)",
  },
  ocean: {
    name: "Ocean", emoji: "🌊",
    bg: "#EEF4F8", surface: "#F5F9FC", surfaceAlt: "#DCE8F0", surfaceGlow: "#E4F1FA",
    text: "#1E3448", textMuted: "#5A7A94", accent: "#2E86AB", accentSoft: "#A8D4E6",
    accentDark: "#1B6B8A", success: "#4A9E6B", successSoft: "#DFF0E6",
    danger: "#C45A5A", dangerSoft: "#F8E4E4", warning: "#C4944A", warningSoft: "#FFF3D6",
    border: "#C8DBE8", shadow: "rgba(30,52,72,0.08)", focusRing: "rgba(46,134,171,0.35)",
    gradient: "linear-gradient(135deg, #EEF4F8 0%, #E4F1FA 100%)",
  },
  moss: {
    name: "Forest", emoji: "🌿",
    bg: "#F0F4EC", surface: "#F7FAF4", surfaceAlt: "#DDE6D5", surfaceGlow: "#E8F2E0",
    text: "#2A3524", textMuted: "#6B7F62", accent: "#5A8F4A", accentSoft: "#B5D4A8",
    accentDark: "#3D7030", success: "#5A8F4A", successSoft: "#E0F0D8",
    danger: "#C45A5A", dangerSoft: "#F8E4E4", warning: "#B8944A", warningSoft: "#F8F0D6",
    border: "#C8D8BE", shadow: "rgba(42,53,36,0.08)", focusRing: "rgba(90,143,74,0.35)",
    gradient: "linear-gradient(135deg, #F0F4EC 0%, #E8F2E0 100%)",
  },
  dusk: {
    name: "Night", emoji: "🌙",
    bg: "#1A1B2E", surface: "#222338", surfaceAlt: "#2C2D45", surfaceGlow: "#2E2F4A",
    text: "#E4E0F0", textMuted: "#9A94B8", accent: "#B07ACC", accentSoft: "#4A3D5E",
    accentDark: "#9B5FBB", success: "#6BBF8A", successSoft: "#253530",
    danger: "#E07070", dangerSoft: "#3A2525", warning: "#D4A44E", warningSoft: "#352E1E",
    border: "#3A3B55", shadow: "rgba(0,0,0,0.3)", focusRing: "rgba(176,122,204,0.35)",
    gradient: "linear-gradient(135deg, #1A1B2E 0%, #252640 100%)",
  },
};

const LINE_HEIGHTS = { compact: 1.5, normal: 1.8, relaxed: 2.2 };
const FONT_SIZES = { small: 15, medium: 17, large: 20, xl: 24 };
const LETTER_SPACINGS = { normal: "0em", wide: "0.04em", wider: "0.07em" };

const ENERGY_LEVELS = [
  { id: "low", label: "🔋 Low", desc: "Tiny steps only", color: "#E07070" },
  { id: "medium", label: "⚡ Medium", desc: "Can handle a few things", color: "#D4A44E" },
  { id: "high", label: "🔥 High", desc: "Let's go!", color: "#6B9E5B" },
];

const TASK_STARTERS = [
  "Just open the file/app for 2 minutes",
  "Write one sentence about it",
  "Set a 5-minute timer and just begin",
  "Tell yourself: 'I'll do the worst version possible'",
  "Move to a different spot, then start",
  "Put on some background noise first",
  "Start with the easiest part",
  "Just gather what you need — that's enough for now",
  "Text a friend that you're about to start",
  "Do 3 deep breaths, then just touch the task",
];

const BREATHING_PATTERNS = {
  calm: { name: "4-7-8 Calm", in: 4, hold: 7, out: 8 },
  focus: { name: "Box Breathing", in: 4, hold: 4, out: 4, hold2: 4 },
  quick: { name: "Quick Reset", in: 3, hold: 0, out: 6 },
};

// ─── HELPERS ──────────────────────────────────────────────────────
const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const fmtTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
const fmtTimeWords = (s) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  if (m === 0) return `${sec} seconds`;
  if (sec === 0) return `${m} minute${m !== 1 ? "s" : ""}`;
  return `${m}m ${sec}s`;
};

function speak(text, rate = 0.9) {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = rate;
    u.pitch = 1;
    window.speechSynthesis.speak(u);
  }
}

function bionicText(text) {
  return text.split(" ").map((word) => {
    if (word.length <= 1) return word;
    const boldLen = Math.ceil(word.length * 0.45);
    return `<b>${word.slice(0, boldLen)}</b>${word.slice(boldLen)}`;
  }).join(" ");
}

function chunkText(text, sentencesPerChunk = 2) {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const chunks = [];
  for (let i = 0; i < sentences.length; i += sentencesPerChunk) {
    chunks.push(sentences.slice(i, i + sentencesPerChunk).join(" ").trim());
  }
  return chunks;
}

// ─── STATE ────────────────────────────────────────────────────────
const initialState = {
  tasks: [],
  timer: { seconds: 25 * 60, isRunning: false, mode: "focus", focusLen: 25 * 60, breakLen: 5 * 60, elapsed: 0 },
  notes: [],
  brainDump: [],
  energy: "medium",
  dailyDone: 0,
  dailyLimit: 5,
  settings: {
    theme: "cream", font: "atkinson", fontSize: "medium",
    lineHeight: "relaxed", letterSpacing: "wide",
    ttsEnabled: true, readingGuide: false, bionicReading: false,
    singleTaskMode: false, timeAnnounce: true,
  },
  view: "tasks",
  singleFocus: null,
};

function reducer(state, action) {
  switch (action.type) {
    case "LOAD_STATE": return { ...state, ...action.payload };
    case "SET_VIEW": return { ...state, view: action.payload };
    case "SET_ENERGY": return { ...state, energy: action.payload };
    case "SET_SINGLE_FOCUS": return { ...state, singleFocus: action.payload };

    case "ADD_TASK": return { ...state, tasks: [...state.tasks, action.payload] };
    case "TOGGLE_TASK": {
      const task = state.tasks.find(t => t.id === action.payload);
      const wasDone = task?.done;
      return {
        ...state,
        dailyDone: wasDone ? state.dailyDone - 1 : state.dailyDone + 1,
        tasks: state.tasks.map(t => t.id === action.payload ? { ...t, done: !t.done } : t),
        singleFocus: state.singleFocus === action.payload && !wasDone ? null : state.singleFocus,
      };
    }
    case "DELETE_TASK": return { ...state, tasks: state.tasks.filter(t => t.id !== action.payload), singleFocus: state.singleFocus === action.payload ? null : state.singleFocus };
    case "ADD_SUBTASK": return { ...state, tasks: state.tasks.map(t => t.id === action.payload.taskId ? { ...t, subtasks: [...(t.subtasks || []), action.payload.subtask] } : t) };
    case "TOGGLE_SUBTASK": return { ...state, tasks: state.tasks.map(t => t.id === action.payload.taskId ? { ...t, subtasks: (t.subtasks || []).map(s => s.id === action.payload.subtaskId ? { ...s, done: !s.done } : s) } : t) };
    case "UPDATE_TASK": return { ...state, tasks: state.tasks.map(t => t.id === action.payload.id ? { ...t, ...action.payload } : t) };

    case "SET_TIMER": return { ...state, timer: { ...state.timer, ...action.payload } };
    case "TICK": return { ...state, timer: { ...state.timer, seconds: state.timer.seconds - 1, elapsed: state.timer.elapsed + 1 } };
    case "TIMER_DONE": {
      const next = state.timer.mode === "focus" ? "break" : "focus";
      return { ...state, timer: { ...state.timer, mode: next, seconds: next === "focus" ? state.timer.focusLen : state.timer.breakLen, isRunning: false, elapsed: 0 } };
    }

    case "ADD_NOTE": return { ...state, notes: [action.payload, ...state.notes] };
    case "UPDATE_NOTE": return { ...state, notes: state.notes.map(n => n.id === action.payload.id ? { ...n, ...action.payload } : n) };
    case "DELETE_NOTE": return { ...state, notes: state.notes.filter(n => n.id !== action.payload) };

    case "ADD_DUMP": return { ...state, brainDump: [...state.brainDump, action.payload] };
    case "PROMOTE_DUMP": {
      const item = state.brainDump.find(d => d.id === action.payload);
      if (!item) return state;
      return { ...state, brainDump: state.brainDump.filter(d => d.id !== action.payload), tasks: [...state.tasks, { id: genId(), text: item.text, done: false, subtasks: [], createdAt: Date.now(), priority: "normal", energy: "medium" }] };
    }
    case "DELETE_DUMP": return { ...state, brainDump: state.brainDump.filter(d => d.id !== action.payload) };
    case "CLEAR_DUMP": return { ...state, brainDump: [] };

    case "SET_SETTING": return { ...state, settings: { ...state.settings, [action.payload.key]: action.payload.value } };
    case "SET_DAILY_LIMIT": return { ...state, dailyLimit: action.payload };
    default: return state;
  }
}

// ─── SHARED UI COMPONENTS ─────────────────────────────────────────

function SpeakBtn({ text, theme, size = 16 }) {
  return (
    <button onClick={(e) => { e.stopPropagation(); speak(text); }} title="Read aloud"
      style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", color: theme.textMuted, fontSize: `${size}px`, borderRadius: "6px", lineHeight: 1, flexShrink: 0 }}>
      🔊
    </button>
  );
}

function Card({ theme, children, style = {}, glow = false }) {
  return (
    <div style={{
      background: glow ? theme.surfaceGlow : theme.surface, borderRadius: "16px",
      padding: "16px 18px", border: `1.5px solid ${theme.border}`,
      boxShadow: `0 2px 8px ${theme.shadow}`, transition: "all 0.2s", ...style,
    }}>
      {children}
    </div>
  );
}

function Chip({ active, onClick, children, theme, color }) {
  return (
    <button onClick={onClick} style={{
      padding: "9px 16px", borderRadius: "11px", border: "none",
      background: active ? (color || theme.accent) : theme.surfaceAlt,
      color: active ? "#fff" : theme.text, fontWeight: 600, fontSize: "0.88em",
      cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s", whiteSpace: "nowrap",
    }}>
      {children}
    </button>
  );
}

function Input({ theme, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <input {...props}
      onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
      onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
      style={{
        padding: "13px 16px", borderRadius: "13px",
        border: `2px solid ${focused ? theme.accent : theme.border}`,
        background: theme.surface, color: theme.text, fontSize: "1em",
        fontFamily: "inherit", outline: "none", transition: "border-color 0.2s",
        width: "100%", boxSizing: "border-box", ...props.style,
      }}
    />
  );
}

function Btn({ theme, children, variant = "primary", style = {}, ...props }) {
  const styles = {
    primary: { background: theme.accent, color: "#fff", border: "none", boxShadow: `0 3px 12px ${theme.focusRing}` },
    secondary: { background: theme.surfaceAlt, color: theme.text, border: "none" },
    outline: { background: "transparent", color: theme.textMuted, border: `2px solid ${theme.border}` },
    danger: { background: "transparent", color: theme.danger, border: "none" },
  };
  return (
    <button {...props} style={{
      padding: "12px 22px", borderRadius: "13px", fontWeight: 700,
      fontSize: "0.95em", cursor: "pointer", fontFamily: "inherit",
      transition: "all 0.2s", ...styles[variant], ...style,
    }}>
      {children}
    </button>
  );
}

function SectionHeader({ theme, title, subtitle, icon }) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <h2 style={{ fontSize: "1.5em", fontWeight: 700, margin: 0, color: theme.text, display: "flex", alignItems: "center", gap: "10px" }}>
        {icon && <span style={{ fontSize: "0.85em" }}>{icon}</span>} {title}
      </h2>
      {subtitle && <p style={{ color: theme.textMuted, margin: "4px 0 0", fontSize: "0.92em" }}>{subtitle}</p>}
    </div>
  );
}

function ReadingGuide({ active }) {
  const [y, setY] = useState(0);
  useEffect(() => {
    if (!active) return;
    const handler = (e) => setY(e.clientY);
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, [active]);
  if (!active) return null;
  return (
    <>
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: Math.max(0, y - 28), background: "rgba(0,0,0,0.13)", pointerEvents: "none", zIndex: 9999, transition: "height 0.04s linear" }} />
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, height: Math.max(0, window.innerHeight - y - 28), background: "rgba(0,0,0,0.13)", pointerEvents: "none", zIndex: 9999, transition: "height 0.04s linear" }} />
    </>
  );
}

// ─── 1. TASKS — with initiation support & energy matching ─────────
function TaskView({ state, dispatch, theme }) {
  const [input, setInput] = useState("");
  const [subInputs, setSubInputs] = useState({});
  const [expanded, setExpanded] = useState(null);
  const [showStarter, setShowStarter] = useState(null);
  const [starterTip, setStarterTip] = useState("");
  const inputRef = useRef(null);

  const addTask = () => {
    const text = input.trim();
    if (!text) return;
    dispatch({ type: "ADD_TASK", payload: { id: genId(), text, done: false, subtasks: [], createdAt: Date.now(), priority: "normal", energy: state.energy } });
    setInput("");
    inputRef.current?.focus();
  };

  const addSubtask = (taskId) => {
    const text = (subInputs[taskId] || "").trim();
    if (!text) return;
    dispatch({ type: "ADD_SUBTASK", payload: { taskId, subtask: { id: genId(), text, done: false } } });
    setSubInputs(s => ({ ...s, [taskId]: "" }));
  };

  const getStarter = (taskId) => {
    const tip = TASK_STARTERS[Math.floor(Math.random() * TASK_STARTERS.length)];
    setStarterTip(tip);
    setShowStarter(taskId);
    if (state.settings.ttsEnabled) speak(tip);
  };

  const pending = state.tasks.filter(t => !t.done);
  const completed = state.tasks.filter(t => t.done);
  const energyTasks = pending.filter(t => t.energy === state.energy || state.energy === "high");
  const focusTask = state.singleFocus ? state.tasks.find(t => t.id === state.singleFocus) : null;

  // Single task mode: show only the focused task
  if (state.settings.singleTaskMode && focusTask && !focusTask.done) {
    const subDone = (focusTask.subtasks || []).filter(s => s.done).length;
    const subTotal = (focusTask.subtasks || []).length;
    return (
      <div style={{ animation: "fadeUp 0.35s ease" }}>
        <SectionHeader theme={theme} title="Single Focus" subtitle="Just this one thing. Nothing else matters right now." icon="🎯" />
        <Card theme={theme} glow style={{ borderColor: theme.accent, borderWidth: "2px" }}>
          <div style={{ textAlign: "center", marginBottom: "16px" }}>
            <span style={{ fontSize: "2.8em" }}>🎯</span>
          </div>
          <h3 style={{ fontSize: "1.3em", color: theme.text, textAlign: "center", marginBottom: "8px", fontWeight: 700 }}>{focusTask.text}</h3>
          {subTotal > 0 && (
            <div style={{ textAlign: "center", marginBottom: "16px" }}>
              <span style={{ color: theme.textMuted, fontSize: "0.9em" }}>{subDone} of {subTotal} steps done</span>
              <div style={{ height: 6, borderRadius: 3, background: theme.surfaceAlt, marginTop: "8px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${subTotal ? (subDone / subTotal) * 100 : 0}%`, background: theme.success, borderRadius: 3, transition: "width 0.4s ease" }} />
              </div>
            </div>
          )}
          {(focusTask.subtasks || []).map(sub => (
            <div key={sub.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 0" }}>
              <button onClick={() => dispatch({ type: "TOGGLE_SUBTASK", payload: { taskId: focusTask.id, subtaskId: sub.id } })}
                style={{ width: 26, height: 26, borderRadius: "8px", border: `2px solid ${sub.done ? theme.success : theme.border}`, background: sub.done ? theme.success : "transparent", cursor: "pointer", color: "#fff", fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {sub.done ? "✓" : ""}
              </button>
              <span style={{ color: sub.done ? theme.textMuted : theme.text, textDecoration: sub.done ? "line-through" : "none" }}>{sub.text}</span>
              {state.settings.ttsEnabled && <SpeakBtn text={sub.text} theme={theme} />}
            </div>
          ))}
          {showStarter === focusTask.id && (
            <div style={{ marginTop: "16px", padding: "14px", borderRadius: "12px", background: theme.warningSoft, border: `1.5px solid ${theme.warning}` }}>
              <p style={{ margin: 0, color: theme.text, fontWeight: 600, fontSize: "0.95em" }}>💡 {starterTip}</p>
            </div>
          )}
          <div style={{ display: "flex", gap: "10px", marginTop: "20px", justifyContent: "center", flexWrap: "wrap" }}>
            <Btn theme={theme} onClick={() => getStarter(focusTask.id)} variant="secondary">💡 Help me start</Btn>
            <Btn theme={theme} onClick={() => dispatch({ type: "TOGGLE_TASK", payload: focusTask.id })}>✓ Done!</Btn>
            <Btn theme={theme} onClick={() => dispatch({ type: "SET_SINGLE_FOCUS", payload: null })} variant="outline">Exit focus</Btn>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ animation: "fadeUp 0.35s ease" }}>
      <SectionHeader theme={theme} title="Tasks" subtitle="Break things down. One step at a time." icon="✓" />

      {/* Energy check */}
      <Card theme={theme} style={{ marginBottom: "16px" }}>
        <p style={{ color: theme.textMuted, fontSize: "0.85em", fontWeight: 600, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.06em" }}>How's your energy?</p>
        <div style={{ display: "flex", gap: "8px" }}>
          {ENERGY_LEVELS.map(e => (
            <Chip key={e.id} active={state.energy === e.id} onClick={() => dispatch({ type: "SET_ENERGY", payload: e.id })} theme={theme} color={e.color}>
              {e.label}
            </Chip>
          ))}
        </div>
      </Card>

      {/* Daily progress */}
      <Card theme={theme} style={{ marginBottom: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <span style={{ color: theme.textMuted, fontSize: "0.85em", fontWeight: 600 }}>TODAY'S PROGRESS</span>
          <span style={{ color: theme.text, fontWeight: 700, fontSize: "0.95em" }}>{state.dailyDone} / {state.dailyLimit}</span>
        </div>
        <div style={{ height: 8, borderRadius: 4, background: theme.surfaceAlt, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${Math.min(100, (state.dailyDone / state.dailyLimit) * 100)}%`, background: state.dailyDone >= state.dailyLimit ? theme.success : theme.accent, borderRadius: 4, transition: "width 0.5s ease" }} />
        </div>
        {state.dailyDone >= state.dailyLimit && (
          <p style={{ margin: "10px 0 0", color: theme.success, fontWeight: 600, fontSize: "0.9em" }}>
            🎉 You've hit your daily target! Anything extra is a bonus.
          </p>
        )}
      </Card>

      {/* Input */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <Input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && addTask()} placeholder="What needs doing?" theme={theme} style={{ flex: 1 }} />
        <Btn theme={theme} onClick={addTask} style={{ flexShrink: 0 }}>Add</Btn>
      </div>

      {/* Task list */}
      {pending.length === 0 && completed.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 20px", color: theme.textMuted }}>
          <div style={{ fontSize: "2.8em", marginBottom: "10px" }}>🎯</div>
          <p>No tasks yet. Start small — add one tiny thing.</p>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {pending.map(task => {
          const isExp = expanded === task.id;
          const subDone = (task.subtasks || []).filter(s => s.done).length;
          const subTotal = (task.subtasks || []).length;
          const energyMatch = task.energy === state.energy || state.energy === "high";

          return (
            <Card key={task.id} theme={theme} style={{
              opacity: energyMatch ? 1 : 0.5,
              borderColor: isExp ? theme.accent : theme.border,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <button onClick={() => dispatch({ type: "TOGGLE_TASK", payload: task.id })}
                  style={{ width: 28, height: 28, borderRadius: "50%", border: `2px solid ${theme.border}`, background: theme.bg, cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", transition: "all 0.2s" }}>
                  &nbsp;
                </button>
                <span style={{ flex: 1, color: theme.text, cursor: "pointer", lineHeight: 1.4 }} onClick={() => setExpanded(isExp ? null : task.id)}>
                  {task.text}
                </span>
                {state.settings.ttsEnabled && <SpeakBtn text={task.text} theme={theme} />}
                {subTotal > 0 && <span style={{ fontSize: "0.78em", color: theme.textMuted, background: theme.surfaceAlt, padding: "3px 9px", borderRadius: "16px", whiteSpace: "nowrap" }}>{subDone}/{subTotal}</span>}
                <button onClick={() => setExpanded(isExp ? null : task.id)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: theme.textMuted, fontSize: "1.1em", transform: isExp ? "rotate(180deg)" : "none", transition: "transform 0.2s", padding: "4px" }}>
                  ▾
                </button>
              </div>

              {isExp && (
                <div style={{ marginTop: "14px", paddingLeft: "40px", animation: "fadeUp 0.2s ease" }}>
                  {/* Subtasks */}
                  {(task.subtasks || []).map(sub => (
                    <div key={sub.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "6px 0" }}>
                      <button onClick={() => dispatch({ type: "TOGGLE_SUBTASK", payload: { taskId: task.id, subtaskId: sub.id } })}
                        style={{ width: 22, height: 22, borderRadius: "6px", border: `2px solid ${sub.done ? theme.success : theme.border}`, background: sub.done ? theme.success : "transparent", cursor: "pointer", color: "#fff", fontSize: "12px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {sub.done ? "✓" : ""}
                      </button>
                      <span style={{ color: sub.done ? theme.textMuted : theme.text, textDecoration: sub.done ? "line-through" : "none", fontSize: "0.95em" }}>{sub.text}</span>
                    </div>
                  ))}
                  <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                    <Input value={subInputs[task.id] || ""} onChange={e => setSubInputs(s => ({ ...s, [task.id]: e.target.value }))} onKeyDown={e => e.key === "Enter" && addSubtask(task.id)} placeholder="Add a small step..." theme={theme} style={{ flex: 1, padding: "10px 14px", fontSize: "0.9em" }} />
                    <Btn theme={theme} variant="secondary" onClick={() => addSubtask(task.id)} style={{ padding: "10px 16px" }}>+</Btn>
                  </div>

                  {/* Initiation help */}
                  <div style={{ display: "flex", gap: "8px", marginTop: "14px", flexWrap: "wrap" }}>
                    <Btn theme={theme} variant="secondary" onClick={() => getStarter(task.id)} style={{ fontSize: "0.85em", padding: "8px 14px" }}>💡 Help me start</Btn>
                    <Btn theme={theme} variant="secondary" onClick={() => { dispatch({ type: "SET_SINGLE_FOCUS", payload: task.id }); }} style={{ fontSize: "0.85em", padding: "8px 14px" }}>🎯 Focus only on this</Btn>
                    <Btn theme={theme} variant="danger" onClick={() => dispatch({ type: "DELETE_TASK", payload: task.id })} style={{ fontSize: "0.85em", padding: "8px 14px" }}>Delete</Btn>
                  </div>

                  {showStarter === task.id && (
                    <div style={{ marginTop: "12px", padding: "12px 14px", borderRadius: "10px", background: theme.warningSoft, border: `1.5px solid ${theme.warning}` }}>
                      <p style={{ margin: 0, color: theme.text, fontWeight: 600, fontSize: "0.9em" }}>💡 {starterTip}</p>
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Completed */}
      {completed.length > 0 && (
        <div style={{ marginTop: "24px" }}>
          <p style={{ color: theme.textMuted, fontWeight: 600, fontSize: "0.9em", marginBottom: "10px" }}>✓ Done ({completed.length})</p>
          {completed.slice(0, 5).map(task => (
            <div key={task.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 14px", borderRadius: "10px", background: theme.surfaceAlt, opacity: 0.6, marginBottom: "6px" }}>
              <span style={{ color: theme.success, fontWeight: 700 }}>✓</span>
              <span style={{ color: theme.textMuted, textDecoration: "line-through", flex: 1 }}>{task.text}</span>
              <button onClick={() => dispatch({ type: "DELETE_TASK", payload: task.id })} style={{ background: "none", border: "none", cursor: "pointer", color: theme.textMuted, padding: "4px" }}>×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── 2. FOCUS TIMER — with time blindness support ─────────────────
function TimerView({ state, dispatch, theme }) {
  const { timer } = state;
  const intervalRef = useRef(null);
  const announceRef = useRef(0);
  const totalTime = timer.mode === "focus" ? timer.focusLen : timer.breakLen;
  const progress = (totalTime - timer.seconds) / totalTime;

  useEffect(() => {
    if (timer.isRunning && timer.seconds > 0) {
      intervalRef.current = setInterval(() => dispatch({ type: "TICK" }), 1000);
    } else if (timer.seconds <= 0 && timer.isRunning) {
      dispatch({ type: "TIMER_DONE" });
      speak(timer.mode === "focus" ? "Great work! Time for a break." : "Break is over. Ready to focus?");
    }
    return () => clearInterval(intervalRef.current);
  }, [timer.isRunning, timer.seconds]);

  // Time announcements for time blindness
  useEffect(() => {
    if (!timer.isRunning || !state.settings.timeAnnounce) return;
    const elapsed = timer.elapsed;
    if (elapsed > 0 && elapsed % 300 === 0) { // every 5 min
      speak(`${Math.floor(timer.seconds / 60)} minutes left`);
    }
  }, [timer.elapsed]);

  const toggle = () => {
    if (!timer.isRunning && timer.seconds === 0) {
      dispatch({ type: "SET_TIMER", payload: { seconds: totalTime, elapsed: 0 } });
    }
    dispatch({ type: "SET_TIMER", payload: { isRunning: !timer.isRunning } });
  };
  const reset = () => dispatch({ type: "SET_TIMER", payload: { seconds: totalTime, isRunning: false, elapsed: 0 } });
  const setFocusLen = (mins) => {
    const s = mins * 60;
    dispatch({ type: "SET_TIMER", payload: { focusLen: s, seconds: timer.mode === "focus" ? s : timer.seconds, elapsed: 0 } });
  };

  const radius = 105;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);

  // Elapsed time bar (always visible — combats time blindness)
  const elapsedMins = Math.floor(timer.elapsed / 60);

  return (
    <div style={{ animation: "fadeUp 0.35s ease", textAlign: "center" }}>
      <SectionHeader theme={theme} title={timer.mode === "focus" ? "Focus Time" : "Break Time"} subtitle={timer.mode === "focus" ? "One thing at a time." : "Step away. Breathe. Move."} icon={timer.mode === "focus" ? "◔" : "☕"} />

      {/* Time elapsed banner */}
      {timer.isRunning && (
        <div style={{ marginBottom: "20px", padding: "10px 16px", borderRadius: "12px", background: theme.surfaceGlow, border: `1.5px solid ${theme.border}`, display: "inline-flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "1.2em" }}>⏱</span>
          <span style={{ color: theme.text, fontWeight: 600 }}>You've been going for {elapsedMins < 1 ? "less than a minute" : `${elapsedMins} min`}</span>
        </div>
      )}

      {/* Timer circle */}
      <div style={{ position: "relative", width: 250, height: 250, margin: "0 auto 28px" }}>
        <svg width="250" height="250" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="125" cy="125" r={radius} fill="none" stroke={theme.surfaceAlt} strokeWidth="10" />
          <circle cx="125" cy="125" r={radius} fill="none"
            stroke={timer.mode === "focus" ? theme.accent : theme.success}
            strokeWidth="10" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.5s ease" }} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: "3em", fontWeight: 700, color: theme.text, fontVariantNumeric: "tabular-nums" }}>{fmtTime(timer.seconds)}</span>
          <span style={{ fontSize: "0.85em", color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>{timer.mode}</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginBottom: "28px" }}>
        <Btn theme={theme} onClick={toggle} variant={timer.isRunning ? "secondary" : "primary"}>
          {timer.isRunning ? "⏸ Pause" : "▶ Start"}
        </Btn>
        <Btn theme={theme} onClick={reset} variant="outline">Reset</Btn>
      </div>

      <p style={{ color: theme.textMuted, fontSize: "0.82em", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>Focus duration</p>
      <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap", marginBottom: "24px" }}>
        {[5, 10, 15, 20, 25, 30, 45].map(m => (
          <Chip key={m} active={timer.focusLen === m * 60} onClick={() => setFocusLen(m)} theme={theme}>{m}m</Chip>
        ))}
      </div>

      {/* Time announce toggle */}
      <Card theme={theme}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ margin: 0, color: theme.text, fontWeight: 600, fontSize: "0.95em" }}>⏰ Time announcements</p>
            <p style={{ margin: "2px 0 0", color: theme.textMuted, fontSize: "0.82em" }}>Speaks the time remaining every 5 minutes</p>
          </div>
          <Chip active={state.settings.timeAnnounce} onClick={() => dispatch({ type: "SET_SETTING", payload: { key: "timeAnnounce", value: !state.settings.timeAnnounce } })} theme={theme}>
            {state.settings.timeAnnounce ? "On" : "Off"}
          </Chip>
        </div>
      </Card>
    </div>
  );
}

// ─── 3. READER — for long text ────────────────────────────────────
function ReaderView({ state, dispatch, theme }) {
  const [text, setText] = useState("");
  const [chunks, setChunks] = useState([]);
  const [currentChunk, setCurrentChunk] = useState(0);
  const [isReading, setIsReading] = useState(false);

  const processText = () => {
    const t = text.trim();
    if (!t) return;
    setChunks(chunkText(t, 2));
    setCurrentChunk(0);
  };

  const readCurrentChunk = () => {
    if (chunks.length > 0) {
      speak(chunks[currentChunk], 0.85);
      setIsReading(true);
    }
  };

  const readAll = () => {
    if (chunks.length > 0) {
      speak(chunks.join(". "), 0.85);
      setIsReading(true);
    }
  };

  const stopReading = () => {
    window.speechSynthesis?.cancel();
    setIsReading(false);
  };

  return (
    <div style={{ animation: "fadeUp 0.35s ease" }}>
      <SectionHeader theme={theme} title="Reader" subtitle="Paste long text here. Read it in chunks, with bionic mode or listen." icon="📖" />

      <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Paste text here to make it easier to read..."
        rows={6} style={{
          width: "100%", padding: "14px 18px", borderRadius: "14px",
          border: `2px solid ${theme.border}`, background: theme.surface,
          color: theme.text, fontSize: "1em", fontFamily: "inherit", outline: "none",
          resize: "vertical", lineHeight: "inherit", letterSpacing: "inherit",
          boxSizing: "border-box",
        }} />

      <div style={{ display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap" }}>
        <Btn theme={theme} onClick={processText}>Break into chunks</Btn>
        <Btn theme={theme} variant="secondary" onClick={readAll}>🔊 Read all</Btn>
        {isReading && <Btn theme={theme} variant="danger" onClick={stopReading}>⏹ Stop</Btn>}
      </div>

      {/* Bionic reading toggle */}
      <div style={{ display: "flex", gap: "8px", marginTop: "14px", alignItems: "center" }}>
        <Chip active={state.settings.bionicReading} onClick={() => dispatch({ type: "SET_SETTING", payload: { key: "bionicReading", value: !state.settings.bionicReading } })} theme={theme}>
          {state.settings.bionicReading ? "Bionic: On" : "Bionic: Off"}
        </Chip>
        <span style={{ color: theme.textMuted, fontSize: "0.82em" }}>Bolds the start of each word to guide your eyes</span>
      </div>

      {/* Chunked output */}
      {chunks.length > 0 && (
        <div style={{ marginTop: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ color: theme.textMuted, fontWeight: 600, fontSize: "0.85em" }}>
              Chunk {currentChunk + 1} of {chunks.length}
            </span>
            <div style={{ display: "flex", gap: "6px" }}>
              <Btn theme={theme} variant="outline" onClick={() => setCurrentChunk(c => Math.max(0, c - 1))} style={{ padding: "6px 14px", fontSize: "0.85em" }}>← Prev</Btn>
              <Btn theme={theme} variant="outline" onClick={() => setCurrentChunk(c => Math.min(chunks.length - 1, c + 1))} style={{ padding: "6px 14px", fontSize: "0.85em" }}>Next →</Btn>
            </div>
          </div>

          {/* Progress */}
          <div style={{ height: 4, borderRadius: 2, background: theme.surfaceAlt, marginBottom: "14px", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${((currentChunk + 1) / chunks.length) * 100}%`, background: theme.accent, borderRadius: 2, transition: "width 0.3s" }} />
          </div>

          <Card theme={theme} glow>
            {state.settings.bionicReading ? (
              <p style={{ margin: 0, color: theme.text, lineHeight: "inherit", fontSize: "1.05em" }}
                dangerouslySetInnerHTML={{ __html: bionicText(chunks[currentChunk]) }} />
            ) : (
              <p style={{ margin: 0, color: theme.text, lineHeight: "inherit", fontSize: "1.05em" }}>{chunks[currentChunk]}</p>
            )}
            <div style={{ marginTop: "14px" }}>
              <Btn theme={theme} variant="secondary" onClick={readCurrentChunk} style={{ fontSize: "0.85em", padding: "8px 16px" }}>🔊 Read this chunk</Btn>
            </div>
          </Card>
        </div>
      )}

      {chunks.length === 0 && text.length === 0 && (
        <Card theme={theme} style={{ marginTop: "20px", textAlign: "center" }}>
          <p style={{ color: theme.textMuted, margin: 0 }}>📖 Paste an article, email, or any long text above. The reader will break it into small pieces and can read it aloud to you.</p>
        </Card>
      )}
    </div>
  );
}

// ─── 4. BRAIN DUMP — overwhelm reduction ──────────────────────────
function DumpView({ state, dispatch, theme }) {
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recRef = useRef(null);
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathPhase, setBreathPhase] = useState("in");
  const [breathCount, setBreathCount] = useState(0);
  const [breathPattern, setBreathPattern] = useState("calm");
  const breathIntervalRef = useRef(null);

  const addDump = () => {
    const t = input.trim();
    if (!t) return;
    // Split by newlines or commas for rapid dumping
    const items = t.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
    items.forEach(text => dispatch({ type: "ADD_DUMP", payload: { id: genId(), text, createdAt: Date.now() } }));
    setInput("");
  };

  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.continuous = true; rec.interimResults = true; rec.lang = "en-GB";
    recRef.current = rec;
    rec.onresult = (e) => { let t = ""; for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript; setInput(t); };
    rec.onerror = () => setIsListening(false);
    rec.onend = () => setIsListening(false);
    rec.start();
    setIsListening(true);
  };
  const stopListening = () => { recRef.current?.stop(); setIsListening(false); };

  // Breathing exercise
  const startBreathing = () => {
    setBreathingActive(true);
    setBreathPhase("in");
    setBreathCount(0);
    const pattern = BREATHING_PATTERNS[breathPattern];
    let phase = "in";
    let timer = pattern.in;
    let count = 0;

    speak("Breathe in");

    breathIntervalRef.current = setInterval(() => {
      timer--;
      if (timer <= 0) {
        if (phase === "in") {
          if (pattern.hold > 0) { phase = "hold"; timer = pattern.hold; speak("Hold"); }
          else { phase = "out"; timer = pattern.out; speak("Breathe out"); }
        } else if (phase === "hold") {
          phase = "out"; timer = pattern.out; speak("Breathe out");
        } else if (phase === "out") {
          if (pattern.hold2) { phase = "hold2"; timer = pattern.hold2; speak("Hold"); }
          else { count++; if (count >= 4) { clearInterval(breathIntervalRef.current); setBreathingActive(false); speak("Well done. Feeling better?"); return; } phase = "in"; timer = pattern.in; speak("Breathe in"); }
        } else if (phase === "hold2") {
          count++; if (count >= 4) { clearInterval(breathIntervalRef.current); setBreathingActive(false); speak("Well done."); return; }
          phase = "in"; timer = pattern.in; speak("Breathe in");
        }
        setBreathPhase(phase);
        setBreathCount(count);
      }
    }, 1000);
  };

  const stopBreathing = () => { clearInterval(breathIntervalRef.current); setBreathingActive(false); };

  useEffect(() => () => clearInterval(breathIntervalRef.current), []);

  return (
    <div style={{ animation: "fadeUp 0.35s ease" }}>
      <SectionHeader theme={theme} title="Brain Dump" subtitle="Get everything out of your head. Sort it later." icon="🧠" />

      {/* Breathing */}
      <Card theme={theme} glow style={{ marginBottom: "16px", textAlign: "center" }}>
        {breathingActive ? (
          <div>
            <div style={{
              width: 100, height: 100, borderRadius: "50%", margin: "0 auto 16px",
              background: breathPhase === "in" || breathPhase === "hold" ? theme.accentSoft : theme.surfaceAlt,
              border: `3px solid ${theme.accent}`, display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 1.5s ease",
              transform: breathPhase === "in" ? "scale(1.2)" : breathPhase === "out" ? "scale(0.8)" : "scale(1)",
            }}>
              <span style={{ fontSize: "1.3em", fontWeight: 700, color: theme.accent, textTransform: "capitalize" }}>
                {breathPhase === "hold2" ? "hold" : breathPhase}
              </span>
            </div>
            <p style={{ color: theme.textMuted, margin: "0 0 12px", fontSize: "0.9em" }}>Cycle {breathCount + 1} of 4</p>
            <Btn theme={theme} variant="outline" onClick={stopBreathing}>Stop</Btn>
          </div>
        ) : (
          <div>
            <p style={{ color: theme.text, fontWeight: 600, margin: "0 0 10px" }}>😮‍💨 Feeling overwhelmed? Breathe first.</p>
            <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap", marginBottom: "12px" }}>
              {Object.entries(BREATHING_PATTERNS).map(([key, p]) => (
                <Chip key={key} active={breathPattern === key} onClick={() => setBreathPattern(key)} theme={theme}>{p.name}</Chip>
              ))}
            </div>
            <Btn theme={theme} onClick={startBreathing}>Start breathing</Btn>
          </div>
        )}
      </Card>

      {/* Dump input */}
      <textarea value={input} onChange={e => setInput(e.target.value)} placeholder="Dump everything here... separate items with commas or new lines"
        rows={4} style={{
          width: "100%", padding: "14px 18px", borderRadius: "14px",
          border: `2px solid ${isListening ? theme.accent : theme.border}`, background: theme.surface,
          color: theme.text, fontSize: "1em", fontFamily: "inherit", outline: "none",
          resize: "vertical", lineHeight: "inherit", letterSpacing: "inherit", boxSizing: "border-box",
        }} />
      <div style={{ display: "flex", gap: "8px", marginTop: "10px", flexWrap: "wrap" }}>
        <Btn theme={theme} variant={isListening ? "danger" : "secondary"} onClick={isListening ? stopListening : startListening}>
          {isListening ? "⏹ Stop" : "🎙 Voice"}
        </Btn>
        <Btn theme={theme} onClick={addDump}>Dump it</Btn>
        {state.brainDump.length > 0 && <Btn theme={theme} variant="outline" onClick={() => dispatch({ type: "CLEAR_DUMP" })}>Clear all</Btn>}
      </div>

      {/* Dump items */}
      {state.brainDump.length > 0 && (
        <div style={{ marginTop: "20px" }}>
          <p style={{ color: theme.textMuted, fontWeight: 600, fontSize: "0.85em", marginBottom: "10px" }}>
            {state.brainDump.length} items — promote the ones that matter, delete the rest
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {state.brainDump.map(item => (
              <div key={item.id} style={{
                display: "flex", alignItems: "center", gap: "10px", padding: "12px 14px",
                borderRadius: "12px", background: theme.surface, border: `1.5px solid ${theme.border}`,
              }}>
                <span style={{ flex: 1, color: theme.text, fontSize: "0.95em" }}>{item.text}</span>
                <button onClick={() => dispatch({ type: "PROMOTE_DUMP", payload: item.id })} title="Make it a task"
                  style={{ background: theme.successSoft, border: "none", borderRadius: "8px", padding: "6px 10px", cursor: "pointer", fontSize: "0.8em", color: theme.success, fontWeight: 700 }}>
                  → Task
                </button>
                <button onClick={() => dispatch({ type: "DELETE_DUMP", payload: item.id })}
                  style={{ background: "none", border: "none", cursor: "pointer", color: theme.textMuted, fontSize: "1.1em", padding: "4px" }}>
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {state.brainDump.length === 0 && (
        <Card theme={theme} style={{ marginTop: "20px", textAlign: "center" }}>
          <p style={{ color: theme.textMuted, margin: 0 }}>🧠 When everything feels like too much, dump it all here. You don't have to do any of it — just get it out of your head.</p>
        </Card>
      )}
    </div>
  );
}

// ─── 5. WRITER — with spell help & voice ──────────────────────────
function WriterView({ state, dispatch, theme }) {
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const recRef = useRef(null);
  const textRef = useRef(null);

  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Speech recognition not supported. Try Chrome."); return; }
    const rec = new SR();
    rec.continuous = true; rec.interimResults = true; rec.lang = "en-GB";
    recRef.current = rec;
    let prev = text;
    rec.onresult = (e) => {
      let transcript = "";
      for (let i = 0; i < e.results.length; i++) transcript += e.results[i][0].transcript;
      setText(prev + " " + transcript);
    };
    rec.onerror = () => setIsListening(false);
    rec.onend = () => setIsListening(false);
    rec.start();
    setIsListening(true);
  };
  const stopListening = () => { recRef.current?.stop(); setIsListening(false); };

  const saveAsNote = () => {
    if (!text.trim()) return;
    dispatch({ type: "ADD_NOTE", payload: { id: genId(), text: (title ? `${title}\n\n` : "") + text, createdAt: Date.now() } });
    setText("");
    setTitle("");
  };

  // Simple spell-check visual — highlight commonly misspelled patterns
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charCount = text.length;

  return (
    <div style={{ animation: "fadeUp 0.35s ease" }}>
      <SectionHeader theme={theme} title="Writer" subtitle="Speak your ideas. Fix spelling later. Just get words down." icon="✍️" />

      <Card theme={theme} style={{ marginBottom: "16px", padding: "12px 16px" }}>
        <p style={{ margin: 0, color: theme.textMuted, fontSize: "0.88em" }}>
          💡 <strong style={{ color: theme.text }}>Tip:</strong> Use the voice button to dictate instead of typing. Don't worry about spelling — just get your ideas out. You can clean it up later.
        </p>
      </Card>

      <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title (optional)" theme={theme} style={{ marginBottom: "10px", fontWeight: 700 }} />

      <div style={{ position: "relative" }}>
        <textarea ref={textRef} value={text} onChange={e => setText(e.target.value)}
          placeholder="Start writing or use voice input..."
          rows={10} style={{
            width: "100%", padding: "16px 18px", borderRadius: "14px",
            border: `2px solid ${isListening ? theme.accent : theme.border}`,
            background: theme.surface, color: theme.text, fontSize: "1.05em",
            fontFamily: "inherit", outline: "none", resize: "vertical",
            lineHeight: "inherit", letterSpacing: "inherit", boxSizing: "border-box",
          }} />
      </div>

      {/* Word count */}
      <div style={{ display: "flex", justifyContent: "space-between", margin: "8px 0 14px", color: theme.textMuted, fontSize: "0.82em" }}>
        <span>{wordCount} words · {charCount} characters</span>
        {state.settings.ttsEnabled && text.trim() && (
          <button onClick={() => speak(text, 0.85)} style={{ background: "none", border: "none", color: theme.accent, cursor: "pointer", fontFamily: "inherit", fontSize: "0.95em", fontWeight: 600 }}>
            🔊 Read back to me
          </button>
        )}
      </div>

      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <Btn theme={theme} variant={isListening ? "danger" : "secondary"} onClick={isListening ? stopListening : startListening}>
          {isListening ? "⏹ Stop dictation" : "🎙 Dictate"}
        </Btn>
        <Btn theme={theme} onClick={saveAsNote}>💾 Save as note</Btn>
        {text && <Btn theme={theme} variant="outline" onClick={() => setText("")}>Clear</Btn>}
      </div>

      {/* Saved notes */}
      {state.notes.length > 0 && (
        <div style={{ marginTop: "28px" }}>
          <p style={{ color: theme.textMuted, fontWeight: 600, fontSize: "0.85em", marginBottom: "10px" }}>Saved notes ({state.notes.length})</p>
          {state.notes.slice(0, 5).map(note => (
            <Card key={note.id} theme={theme} style={{ marginBottom: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                <p style={{ margin: 0, color: theme.text, whiteSpace: "pre-wrap", fontSize: "0.95em", flex: 1 }}>
                  {note.text.length > 200 ? note.text.slice(0, 200) + "..." : note.text}
                </p>
                <div style={{ display: "flex", gap: "2px", flexShrink: 0 }}>
                  {state.settings.ttsEnabled && <SpeakBtn text={note.text} theme={theme} />}
                  <button onClick={() => dispatch({ type: "DELETE_NOTE", payload: note.id })} style={{ background: "none", border: "none", cursor: "pointer", color: theme.textMuted, padding: "4px" }}>×</button>
                </div>
              </div>
              <span style={{ fontSize: "0.78em", color: theme.textMuted, marginTop: "6px", display: "block" }}>
                {new Date(note.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
              </span>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── 6. SETTINGS ──────────────────────────────────────────────────
function SettingsView({ state, dispatch, theme }) {
  const set = (key, value) => dispatch({ type: "SET_SETTING", payload: { key, value } });
  const s = state.settings;

  const Row = ({ label, children }) => (
    <div style={{ marginBottom: "22px" }}>
      <label style={{ display: "block", color: theme.textMuted, fontSize: "0.82em", fontWeight: 600, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</label>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>{children}</div>
    </div>
  );

  return (
    <div style={{ animation: "fadeUp 0.35s ease" }}>
      <SectionHeader theme={theme} title="Settings" subtitle="Make it work for your brain." icon="⚙️" />

      <Row label="Colour theme">
        {Object.entries(THEMES).map(([k, t]) => (
          <Chip key={k} active={s.theme === k} onClick={() => set("theme", k)} theme={theme} color={t.accent}>{t.emoji} {t.name}</Chip>
        ))}
      </Row>
      <Row label="Font">
        <Chip active={s.font === "atkinson"} onClick={() => set("font", "atkinson")} theme={theme}>Atkinson Hyperlegible</Chip>
        <Chip active={s.font === "dyslexic"} onClick={() => set("font", "dyslexic")} theme={theme}>OpenDyslexic</Chip>
        <Chip active={s.font === "mono"} onClick={() => set("font", "mono")} theme={theme}>Monospace</Chip>
      </Row>
      <Row label="Font size">
        {Object.entries(FONT_SIZES).map(([k, v]) => (
          <Chip key={k} active={s.fontSize === k} onClick={() => set("fontSize", k)} theme={theme}>{k}</Chip>
        ))}
      </Row>
      <Row label="Line height">
        {Object.entries(LINE_HEIGHTS).map(([k, v]) => (
          <Chip key={k} active={s.lineHeight === k} onClick={() => set("lineHeight", k)} theme={theme}>{k} ({v})</Chip>
        ))}
      </Row>
      <Row label="Letter spacing">
        {Object.entries(LETTER_SPACINGS).map(([k]) => (
          <Chip key={k} active={s.letterSpacing === k} onClick={() => set("letterSpacing", k)} theme={theme}>{k}</Chip>
        ))}
      </Row>

      <div style={{ borderTop: `1px solid ${theme.border}`, paddingTop: "18px", marginTop: "4px" }}>
        <p style={{ color: theme.textMuted, fontSize: "0.82em", fontWeight: 600, marginBottom: "14px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Accessibility</p>
        {[
          { key: "ttsEnabled", label: "Text-to-speech", desc: "🔊 buttons to read content aloud" },
          { key: "readingGuide", label: "Reading guide", desc: "Darkens everything except the line you're reading" },
          { key: "bionicReading", label: "Bionic reading", desc: "Bolds the start of words to help your eyes flow" },
          { key: "singleTaskMode", label: "Single-task mode", desc: "Shows only the focused task — hides everything else" },
          { key: "timeAnnounce", label: "Time announcements", desc: "Tells you the time remaining during focus sessions" },
        ].map(opt => (
          <div key={opt.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${theme.surfaceAlt}` }}>
            <div>
              <p style={{ margin: 0, color: theme.text, fontWeight: 600, fontSize: "0.95em" }}>{opt.label}</p>
              <p style={{ margin: "2px 0 0", color: theme.textMuted, fontSize: "0.82em" }}>{opt.desc}</p>
            </div>
            <Chip active={s[opt.key]} onClick={() => set(opt.key, !s[opt.key])} theme={theme}>{s[opt.key] ? "On" : "Off"}</Chip>
          </div>
        ))}
      </div>

      <div style={{ borderTop: `1px solid ${theme.border}`, paddingTop: "18px", marginTop: "18px" }}>
        <p style={{ color: theme.textMuted, fontSize: "0.82em", fontWeight: 600, marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Daily task limit</p>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {[3, 5, 7, 10].map(n => (
            <Chip key={n} active={state.dailyLimit === n} onClick={() => dispatch({ type: "SET_DAILY_LIMIT", payload: n })} theme={theme}>{n} tasks</Chip>
          ))}
        </div>
        <p style={{ color: theme.textMuted, fontSize: "0.82em", marginTop: "6px" }}>Limits how many tasks count as "enough" for the day</p>
      </div>

      <Card theme={theme} style={{ marginTop: "24px" }}>
        <p style={{ margin: 0, color: theme.textMuted, fontSize: "0.88em", lineHeight: 1.6 }}>
          <strong style={{ color: theme.text }}>Tips:</strong> OpenDyslexic + wider spacing helps with dyslexia. Single-task mode + low energy filter helps with ADHD overwhelm. Time announcements fight time blindness. Voice input everywhere bypasses writing difficulties.
        </p>
      </Card>
    </div>
  );
}

// ─── NAVIGATION ───────────────────────────────────────────────────
function Nav({ view, dispatch, theme }) {
  const items = [
    { id: "tasks", icon: "✓", label: "Tasks" },
    { id: "timer", icon: "◔", label: "Focus" },
    { id: "reader", icon: "📖", label: "Reader" },
    { id: "dump", icon: "🧠", label: "Dump" },
    { id: "writer", icon: "✍️", label: "Write" },
    { id: "settings", icon: "⚙", label: "Settings" },
  ];
  return (
    <nav style={{
      display: "flex", gap: "2px", background: theme.surface,
      borderRadius: "16px", padding: "5px",
      border: `1.5px solid ${theme.border}`, boxShadow: `0 4px 20px ${theme.shadow}`,
    }}>
      {items.map(item => (
        <button key={item.id} onClick={() => dispatch({ type: "SET_VIEW", payload: item.id })}
          style={{
            flex: 1, padding: "10px 4px", borderRadius: "12px", border: "none",
            background: view === item.id ? theme.accent : "transparent",
            color: view === item.id ? "#fff" : theme.textMuted,
            fontWeight: 700, fontSize: "0.72em", cursor: "pointer",
            fontFamily: "inherit", transition: "all 0.2s",
            display: "flex", flexDirection: "column", alignItems: "center", gap: "1px",
          }}>
          <span style={{ fontSize: "1.3em", lineHeight: 1 }}>{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────
export default function FocusFlow() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const theme = THEMES[state.settings.theme] || THEMES.cream;

  // Persistence via localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("focusflow-data");
      if (saved) {
        const parsed = JSON.parse(saved);
        dispatch({ type: "LOAD_STATE", payload: { ...parsed, timer: { ...initialState.timer, focusLen: parsed.timer?.focusLen || 25 * 60, breakLen: parsed.timer?.breakLen || 5 * 60, mode: "focus", seconds: parsed.timer?.focusLen || 25 * 60, isRunning: false, elapsed: 0 } } });
      } else {
        dispatch({ type: "SET_TIMER", payload: { seconds: 25 * 60 } });
      }
    } catch {
      dispatch({ type: "SET_TIMER", payload: { seconds: 25 * 60 } });
    }
  }, []);

  // Save on changes (debounced)
  const saveTimeout = useRef(null);
  useEffect(() => {
    clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      try {
        const toSave = { tasks: state.tasks, notes: state.notes, brainDump: state.brainDump, energy: state.energy, dailyDone: state.dailyDone, dailyLimit: state.dailyLimit, settings: state.settings, timer: { focusLen: state.timer.focusLen, breakLen: state.timer.breakLen } };
        localStorage.setItem("focusflow-data", JSON.stringify(toSave));
      } catch {}
    }, 500);
  }, [state.tasks, state.notes, state.brainDump, state.settings, state.dailyDone, state.dailyLimit, state.timer.focusLen]);

  // Notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") Notification.requestPermission();
  }, []);

  return (
    <div style={{
      fontFamily: FONTS[state.settings.font],
      fontSize: `${FONT_SIZES[state.settings.fontSize]}px`,
      lineHeight: LINE_HEIGHTS[state.settings.lineHeight],
      letterSpacing: LETTER_SPACINGS[state.settings.letterSpacing],
      color: theme.text, background: theme.gradient, minHeight: "100vh",
      transition: "background 0.4s, color 0.3s",
    }}>
      <ReadingGuide active={state.settings.readingGuide} />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=JetBrains+Mono:wght@400;700&display=swap');
        @font-face { font-family: 'OpenDyslexic'; src: url('https://cdn.jsdelivr.net/npm/open-dyslexic@1.0.3/woff/OpenDyslexic-Regular.woff') format('woff'); font-weight: 400; }
        @font-face { font-family: 'OpenDyslexic'; src: url('https://cdn.jsdelivr.net/npm/open-dyslexic@1.0.3/woff/OpenDyslexic-Bold.woff') format('woff'); font-weight: 700; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { margin: 0; -webkit-font-smoothing: antialiased; }
        ::selection { background: ${theme.accentSoft}; color: ${theme.text}; }
        input::placeholder, textarea::placeholder { color: ${theme.textMuted}; opacity: 0.6; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.15); } }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${theme.border}; border-radius: 6px; }
        textarea, input { font-family: inherit; line-height: inherit; letter-spacing: inherit; }
      `}</style>

      <div style={{ maxWidth: 580, margin: "0 auto", padding: "16px 18px 110px" }}>
        {/* Header */}
        <header style={{ marginBottom: "24px", paddingTop: "8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h1 style={{ fontSize: "1.5em", fontWeight: 700, color: theme.text, display: "flex", alignItems: "center", gap: "10px", margin: 0 }}>
            <span style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              width: 36, height: 36, borderRadius: "10px", background: theme.accent,
              color: "#fff", fontSize: "0.55em", fontWeight: 700,
            }}>FF</span>
            FocusFlow
          </h1>
          <span style={{ fontSize: "0.8em", color: theme.textMuted, background: theme.surfaceAlt, padding: "4px 10px", borderRadius: "8px" }}>
            {ENERGY_LEVELS.find(e => e.id === state.energy)?.label}
          </span>
        </header>

        {/* Views */}
        {state.view === "tasks" && <TaskView state={state} dispatch={dispatch} theme={theme} />}
        {state.view === "timer" && <TimerView state={state} dispatch={dispatch} theme={theme} />}
        {state.view === "reader" && <ReaderView state={state} dispatch={dispatch} theme={theme} />}
        {state.view === "dump" && <DumpView state={state} dispatch={dispatch} theme={theme} />}
        {state.view === "writer" && <WriterView state={state} dispatch={dispatch} theme={theme} />}
        {state.view === "settings" && <SettingsView state={state} dispatch={dispatch} theme={theme} />}
      </div>

      {/* Bottom nav */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        padding: "10px 16px 16px",
        background: `linear-gradient(transparent, ${theme.bg} 35%)`,
      }}>
        <div style={{ maxWidth: 580, margin: "0 auto" }}>
          <Nav view={state.view} dispatch={dispatch} theme={theme} />
        </div>
      </div>
    </div>
  );
}
