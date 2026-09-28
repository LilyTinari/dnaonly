import { useEffect, useMemo, useState } from "react";
import { Helix, strands } from "./helix";

const KEY = "dnaonly.helix";
const MINDS_KEY = "dnaonly.minds";

const minds = [
  {
    id: "claude",
    name: "Claude",
    maker: "Anthropic",
    status: "open" as const,
    strand: "Neurogenesis · Plasticity",
    copy: "The long thread. Projects, artifacts, and the way you revise a thought until it holds.",
  },
  {
    id: "chatgpt",
    name: "ChatGPT",
    maker: "OpenAI",
    status: "open" as const,
    strand: "Capture · Thinking path",
    copy: "The working chat. Instructions you already set, and the sessions you choose to bring over.",
  },
  {
    id: "grok",
    name: "Grok",
    maker: "xAI",
    status: "soon" as const,
    strand: "Same helix · next",
    copy: "The one that argues back. Same molecule when the pipe opens — not a second profile.",
  },
];

const signals = [
  ["Health & vitals", "Sleep, HRV, energy, recovery, mood — fed into Circadian and Affect strands so every suggestion respects your biology."],
  ["Eating habits", "Meals, hydration, fasting windows, glycemic load — linked to focus, mood and the Fuel strand in real time."],
  ["Projects & achievements", "Upload docs, designs and PDFs. Lucien plus the agent council score each one against the constitution."],
  ["Skills & craft", "Deliberate practice logs become a Plasticity trajectory — myelination, deep work, and what to stretch next."],
  ["Daily life, in one place", "Habits, schedule, check-ins, voice notes, attachments — every thread of your day woven into the same molecule."],
  ["Thinking path & evolution", "Your reasoning, reframes and breakthroughs are mapped as a living timeline — see exactly how your mind has shifted."],
] as const;

const trackers = [
  ["Apple Health", "Sleep · HRV · Steps"],
  ["Google Fit", "Workouts · Energy"],
  ["Whoop · Oura · Garmin", "Recovery · Strain"],
  ["MyFitnessPal", "Macros · Calories"],
  ["Cronometer", "Micronutrients"],
  ["Shortcuts · Tasker", "Anything → webhook"],
];

const devices = [
  ["Apple Watch", "Steps · HR · Energy", "Export Apple Health or auto-sync via Shortcuts / Health Auto Export."],
  ["Oura Ring", "Sleep · Readiness · Temp", "Connect through Zapier or Make on each new sleep and readiness record."],
  ["WHOOP", "Recovery · Strain · HRV", "Push recovery and strain to your personal webhook automatically."],
  ["Lab results", "Blood panels · Biomarkers", "Upload a CSV or log values by hand — cholesterol, glucose, vitamin D and more."],
];

const privacy = [
  ["Only you can access it", "Every entry is scoped to your account with row-level security. Another signed-in user cannot query your logs — access is enforced by the database on every request, not just the UI."],
  ["Encrypted in transit", "All traffic between your devices, trackers and dnaonly.ai runs over encrypted HTTPS/TLS connections. Uploaded files and lab exports go into private storage that is never publicly listable."],
  ["Authentication required", "Nothing loads without a valid, authenticated session. Your webhook sync uses a private token you can rotate at any time from Connections if you ever want to cut off a device."],
  ["Never sold or shared", "Your data isn’t sold, rented, or handed to advertisers. It’s used only to power your dashboard and the insights Lucien generates for you."],
  ["Export & delete anytime", "You brought the data in and you can take it back out. Remove individual entries, disconnect a tracker, or clear imports whenever you choose."],
  ["Managed cloud backend", "Data is stored on a managed cloud backend with authentication, access policies and encrypted storage handled at the infrastructure level."],
];

const papers = [
  ["U-shape", "Circadian", "9-year cohort (CHARLS, n=8,500+): both short (<6h) and long (>9h) sleep predict accelerated cognitive decline — the inflection point is personal.", "Scientific Reports · 2025"],
  ["2026 umbrella", "Circadian", "Updated umbrella review: short / disturbed sleep is a modifiable risk factor for cognitive impairment that the 2024 Lancet Commission still omitted. Worth instrumenting.", "PubMed umbrella review · 2025 (updated 2026)"],
  ["2024 review", "Affect / Neurogenesis", "Vagally-mediated HRV reliably indexes prefrontal regulatory capacity and executive performance — synthesis of the post-2022 brain–heart literature.", "Cortex · 2024"],
  ["Longitudinal", "Affect / Neurogenesis", "2024 narrative review of longitudinal studies: HRV trajectories track cognitive aging and predict executive decline before symptoms appear.", "J. Clinical Medicine · 2024"],
  ["Quality > hours", "Plasticity", "2023 re-analysis: prior meta-analyses understated deliberate practice because they ignored individualization. Structured, feedback-rich, personalised practice dominates.", "Current Psychology · 2023"],
  ["Dose-dependent", "Consistency", "2024 meta-analysis: sustained short sleep is a dose-dependent predictor of dementia incidence — a signal that only surfaces in longitudinal records.", "Howard et al. · Sleep Medicine · 2024"],
  ["2025 meta-meta", "Fuel / Capture", "Umbrella meta-meta-analysis of eHealth/mHealth interventions: self-monitoring + feedback is the strongest active ingredient for sustained behavior change.", "Singh et al. · JMIR · 2025"],
  ["2026 cohort", "Capture", "Multinational cohort (China · England · India, n>22k): sleep → cognition curve is non-linear and individual. Population means hide each operator’s personal optimum.", "BMC Public Health · 2026"],
];

const questions = [
  ["Circadian", "How steady was last night’s sleep?"],
  ["Fuel", "How well did you eat for the work in front of you?"],
  ["Neurogenesis", "How much new material did you actually retrieve?"],
  ["Affect", "How regulated did the day feel?"],
  ["Plasticity", "How much deliberate practice landed?"],
  ["Capture", "How completely did you log the day?"],
];

function loadMinds() {
  try {
    const raw = localStorage.getItem(MINDS_KEY);
    if (!raw) return {} as Record<string, boolean>;
    const parsed = JSON.parse(raw) as Record<string, boolean>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function loadLevels() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [0.72, 0.64, 0.8, 0.58, 0.7, 0.5];
    const parsed = JSON.parse(raw) as number[];
    if (parsed.length === 6) return parsed;
  } catch {
    /* ignore */
  }
  return [0.72, 0.64, 0.8, 0.58, 0.7, 0.5];
}

export function App() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [levels, setLevels] = useState(loadLevels);
  const [open, setOpen] = useState<"decode" | "account" | "connect" | "mind" | null>(null);
  const [draft, setDraft] = useState(loadLevels);
  const [held, setHeld] = useState(loadMinds);
  const [mindId, setMindId] = useState(minds[0].id);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const saved = useMemo(() => levels.map((n) => Math.round(n * 100)), [levels]);

  function holdMind(id: string) {
    const next = { ...held, [id]: true };
    setHeld(next);
    localStorage.setItem(MINDS_KEY, JSON.stringify(next));
    setOpen(null);
  }

  function releaseMind(id: string) {
    const next = { ...held, [id]: false };
    setHeld(next);
    localStorage.setItem(MINDS_KEY, JSON.stringify(next));
  }

  const activeMind = minds.find((m) => m.id === mindId) ?? minds[0];

  function save(next: number[]) {
    setLevels(next);
    localStorage.setItem(KEY, JSON.stringify(next));
    setOpen(null);
  }

  return (
    <>
      <header className="wrap nav">
        <a className="brand" href="#top">
          <Mark />
          dnaonly.ai
        </a>
        <div className="nav-actions">
          <button className="icon-btn" type="button" aria-label="Toggle theme" onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}>
            {theme === "light" ? "☾" : "☀"}
          </button>
          <button className="ghost" type="button" onClick={() => setOpen("account")}>
            Sign in
          </button>
          <button className="solid" type="button" onClick={() => { setDraft(levels); setOpen("decode"); }}>
            Decode
          </button>
        </div>
      </header>

      <main id="top">
        <section className="wrap hero">
          <div>
            <p className="kicker">Real-time neurocognitive decoding</p>
            <h1 style={{ marginTop: 18 }}>
              You don’t have a profile.
              <br />
              You have Cognitive DNA.
            </h1>
            <p className="lede">
              A living blueprint of how you think, learn, and grow. Six luminous strands that evolve
              with every check-in, conversation, and breakthrough.
            </p>
            <div className="actions">
              <button className="solid" type="button" onClick={() => { setDraft(levels); setOpen("decode"); }}>
                Generate my helix
              </button>
              <a className="ghost" href="#molecule">Take the 3D tour</a>
              <button className="ghost" type="button" onClick={() => save(loadLevels())}>
                I already have one
              </button>
            </div>
          </div>
          <div>
            <div className="grid-2" style={{ marginBottom: 14 }}>
              {["Brain-system vitals", "Pattern detection", "Live recalculation", "Mechanism insights"].map((item) => (
                <article className="card" key={item}><h3>{item}</h3></article>
              ))}
            </div>
          </div>
        </section>

        <section className="wrap" id="molecule">
          <div className="legend">
            {strands.map((s) => (
              <span key={s.id}><i className="dot" style={{ background: s.color }} />{s.name}</span>
            ))}
          </div>
          <div className="stage">
            <span className="float-label" style={{ top: 24, left: 20 }}>Strand 23 · Neurogenesis {saved[2]}</span>
            <span className="float-label" style={{ top: 80, right: 16 }}>Plasticity · {saved[4]}</span>
            <span className="float-label" style={{ bottom: 28, left: 20 }}>Fuel · {saved[1]}</span>
            <Helix levels={levels} />
          </div>
          <p className="center fine">Your mind · decoded · beta 2026. Drag the molecule.</p>
        </section>

        <section className="wrap section center">
          <p className="kicker">One molecule · every signal</p>
          <h2 style={{ marginTop: 16 }}>Everything that shapes you on one helix.</h2>
          <p className="lede" style={{ marginTop: 14 }}>
            Lucien doesn’t just read your mind — it factors in what you eat, how you move, the
            projects you ship, the skills you sharpen, and the way your thinking itself evolves over time.
          </p>
          <div className="stack" style={{ marginTop: 28, textAlign: "left" }}>
            {signals.map(([title, copy]) => (
              <article className="card" key={title}>
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="wrap section">
          <article className="card">
            <p className="kicker">Cognitive evolution</p>
            <h2 style={{ marginTop: 12 }}>Your thinking, mapped.</h2>
            <p>
              Every conversation with Lucien, every reframe, every breakthrough becomes a node on a
              timeline — so you can literally watch the shape of your mind evolve.
            </p>
            <div className="track">
              {["#243e66", "#3d756e", "#7eb0be", "#8d6a86", "#c4a574"].map((c) => (
                <i key={c} style={{ background: c }} />
              ))}
            </div>
            <p className="fine" style={{ letterSpacing: "0.14em", textAlign: "center" }}>
              Curious · Wired · Reframed · Compounding · Mastery
            </p>
          </article>
        </section>

        <section className="wrap section" id="minds">
          <p className="kicker">Minds you already use</p>
          <h2 style={{ marginTop: 16 }}>Claude, ChatGPT, and Grok — on the same helix.</h2>
          <p className="lede">
            The thinking strand should not start from zero just because the chat lived somewhere
            else. Connect the models you already think with. What you approve becomes nodes on
            this molecule. Grok is next, not missing.
          </p>
          <div className="minds">
            {minds.map((mind) => (
              <article className="card mind" key={mind.id}>
                <div className="mind-top">
                  <span className="mono">{mind.name.slice(0, 1)}</span>
                  <span className={mind.status === "soon" ? "pill soon" : "pill"}>
                    {held[mind.id] ? "Slot held" : mind.status === "soon" ? "Soon" : "Ready to link"}
                  </span>
                </div>
                <h3>{mind.name}</h3>
                <p className="fine" style={{ letterSpacing: "0.08em" }}>{mind.maker} · {mind.strand}</p>
                <p>{mind.copy}</p>
                <button
                  className={mind.status === "soon" && !held[mind.id] ? "ghost" : "solid"}
                  type="button"
                  onClick={() => {
                    setMindId(mind.id);
                    setOpen("mind");
                  }}
                >
                  {held[mind.id] ? "Edit slot" : mind.status === "soon" ? "Keep my place" : `Connect ${mind.name}`}
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="wrap section">
          <p className="kicker">Live sync · zero typing</p>
          <h2 style={{ marginTop: 16 }}>Plug in your phone. Predict your next pattern.</h2>
          <p className="lede">
            Connect Apple Health, Google Fit, Whoop, Oura, Garmin, MyFitnessPal, Cronometer and more.
            Sleep, HRV, steps, meals and macros are meant to stream into the helix — so Lucien can
            time the work to the body. This preview does not open those accounts. It shows the slot
            each source gets.
          </p>
          <ul>
            <li>Spots the sleep and macro combos that precede your sharpest sessions</li>
            <li>Reads recovery before it asks you to do the hard hour</li>
            <li>Times deep work, study and review to circadian peaks you actually logged</li>
            <li>Flags foods that showed up before a flat afternoon — only after you logged both</li>
          </ul>
          <div className="actions" style={{ maxWidth: 360 }}>
            <button className="solid" type="button" onClick={() => setOpen("connect")}>Connect Apple Health & trackers</button>
            <button className="ghost" type="button" onClick={() => setOpen("connect")}>Link food trackers</button>
          </div>
          <div className="grid-2" style={{ marginTop: 18 }}>
            {trackers.map(([name, meta]) => (
              <article className="card" key={name}>
                <h3>{name}</h3>
                <p>{meta}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="wrap section">
          <p className="kicker">One dashboard · every source</p>
          <h2>Apple Watch, Oura, WHOOP & lab results — unified in one place.</h2>
          <p className="lede">
            Your data lives in five apps that don’t talk to each other. dnaonly.ai is built to pull
            wearable, ring, strap and blood panel onto a single helix — then Lucien reads across them.
            Connections are the product path, not a switch this page can flip.
          </p>
          <div className="stack">
            {devices.map(([name, meta, copy]) => (
              <article className="card" key={name}>
                <h3>{name}</h3>
                <p style={{ letterSpacing: "0.08em", fontSize: 12 }}>{meta}</p>
                <p>{copy}</p>
              </article>
            ))}
          </div>
          <div className="steps" style={{ marginTop: 12 }}>
            {[
              ["01", "Connect once", "Add each device with a webhook, an app export, or a CSV. No manual re-typing — new data streams in on its own."],
              ["02", "Auto-merged & aligned", "Every metric is time-aligned and normalized onto the same helix, so sleep from Oura sits next to strain from WHOOP and your latest blood panel."],
              ["03", "One dashboard, read together", "See recovery, sleep, activity, nutrition and labs side by side — and let Lucien surface the patterns hiding across sources."],
            ].map(([n, t, c]) => (
              <article className="card" key={n}>
                <p className="num">{n}</p>
                <h3>{t}</h3>
                <p>{c}</p>
              </article>
            ))}
          </div>
          <button className="solid" style={{ marginTop: 16 }} type="button" onClick={() => setOpen("connect")}>
            Unify my devices & labs
          </button>
        </section>

        <section className="wrap section">
          <p className="kicker">Security & privacy</p>
          <h2>Your health data is yours alone.</h2>
          <p className="lede">
            Health data is deeply personal, so dnaonly.ai is built so that only you can see it. Every
            log, wearable sync and lab result is tied to your account and locked to your identity at
            the database level. The controls below describe the product, not a certification.
          </p>
          <div className="stack">
            {privacy.map(([t, c]) => (
              <article className="card" key={t}><h3>{t}</h3><p>{c}</p></article>
            ))}
          </div>
          <p className="fine">
            This section answers common security questions and describes controls aimed at the
            product. It isn’t an independent certification.
          </p>
        </section>

        <section className="wrap section science">
          <p className="kicker">Evidence base · peer-reviewed</p>
          <h2>Built on real science, not vibes.</h2>
          <p className="lede">
            Every strand maps to a body of research on what actually moves human performance. The
            cards name the papers the product cites. This revamp does not invent a link when the
            exact DOI isn’t in the page you filmed. dnaonly.ai synthesises signals — it does not
            provide medical advice.
          </p>
          <div className="stack">
            {papers.map(([title, tag, copy, source]) => (
              <article className="card" key={title}>
                <span className="tag">{tag}</span>
                <h3>{title}</h3>
                <p>{copy}</p>
                <p className="fine">{source}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="wrap">
        <p>dnaonly.ai · Your mind, mapped</p>
        <nav>
          <a href="#molecule">Helix</a>
          <a href="#minds">Minds</a>
          <a href="#top">Top</a>
        </nav>
        <p>© 2026</p>
      </footer>

      {open ? (
        <div className="sheet" role="presentation" onClick={() => setOpen(null)}>
          <article onClick={(e) => e.stopPropagation()}>
            {open === "decode" ? (
              <>
                <p className="kicker">Generate</p>
                <h2 style={{ marginTop: 10 }}>A first read, not a lab.</h2>
                <p>Six strands. Drag what today actually felt like. It stays on this device.</p>
                {questions.map(([name, q], i) => (
                  <label className="q" key={name}>
                    <span>{name}</span>
                    <span className="fine">{q}</span>
                    <input
                      type="range"
                      min={0.15}
                      max={1}
                      step={0.01}
                      value={draft[i]}
                      onChange={(e) => {
                        const next = [...draft];
                        next[i] = Number(e.target.value);
                        setDraft(next);
                      }}
                    />
                  </label>
                ))}
                <button className="solid" style={{ marginTop: 16 }} type="button" onClick={() => save(draft)}>
                  Write it into the helix
                </button>
              </>
            ) : null}
            {open === "account" ? (
              <>
                <p className="kicker">Sign in</p>
                <h2 style={{ marginTop: 10 }}>Accounts aren’t on this revamp.</h2>
                <p>
                  The live product locks a helix to a person. This site only keeps the one you
                  generate, in this browser. Nothing is sent.
                </p>
                <button className="solid" type="button" onClick={() => setOpen(null)}>Close</button>
              </>
            ) : null}
            {open === "mind" ? (
              <>
                <p className="kicker">{activeMind.maker}</p>
                <h2 style={{ marginTop: 10 }}>{activeMind.name} writes into the helix. It does not replace it.</h2>
                <p>
                  {activeMind.status === "soon"
                    ? "Grok is not on the pipe yet. Holding a place only remembers that you want it. No key, no account, nothing sent."
                    : "When the account is live, you approve the chats that come across. This preview only holds the slot on this device. It will not ask for an API key, and it does not read Claude or ChatGPT from here."}
                </p>
                <p className="fine">Lands on {activeMind.strand}.</p>
                <div className="actions" style={{ marginTop: 16 }}>
                  <button className="solid" type="button" onClick={() => holdMind(activeMind.id)}>
                    {held[activeMind.id] ? "Slot already held" : activeMind.status === "soon" ? "Keep my place" : "Hold this slot"}
                  </button>
                  {held[activeMind.id] ? (
                    <button className="ghost" type="button" onClick={() => releaseMind(activeMind.id)}>
                      Release
                    </button>
                  ) : null}
                </div>
              </>
            ) : null}
            {open === "connect" ? (
              <>
                <p className="kicker">Connections</p>
                <h2 style={{ marginTop: 10 }}>The slots are real. The pipes aren’t, here.</h2>
                <p>
                  Apple Health, Oura, WHOOP and a lab CSV each get a place on the helix. This page
                  will not pretend it already read your watch. When the account exists, a webhook or
                  an export lands in the strand it belongs to — and you can cut it off.
                </p>
                <button className="solid" type="button" onClick={() => setOpen(null)}>Got it</button>
              </>
            ) : null}
          </article>
        </div>
      ) : null}
    </>
  );
}

function Mark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path d="M3 3c4 2 8 2 12 0M3 9c4 2 8 2 12 0M3 15c4 2 8 2 12 0" fill="none" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}
