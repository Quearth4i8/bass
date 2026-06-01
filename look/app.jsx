// BASSIANA Portal — dark immersive data-dashboard

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "density": "comfortable",
  "dividers": "on",
  "font": "geist"
}/*EDITMODE-END*/;

// ── Data ────────────────────────────────────────────────────────────────────

const STATS = [
  { value: "50+", label: "Environmental Parameters", delta: "↗ active" },
  { value: "2020", label: "Programme Launch", delta: "5y running" },
  { value: "4",   label: "Ecosystem Categories", delta: "marine · coastal · lagoon · river" },
  { value: "1.2M", label: "Data Records", delta: "↗ +14% YoY" },
];

const PROJECTS = [
  {
    id: "BSN-001",
    code: "IMAS-ICKEUL",
    title: "Ichkeul Lagoon Monitoring",
    desc: "Long-term ecological survey of the Ichkeul wetland — water quality, biodiversity, and seasonal dynamics.",
    coord: "Béchir Béjaoui",
    status: "ACTIVE",
    region: "TN · 37.16°N",
    cycle: "CYCLE 08",
    bg: "linear-gradient(135deg, #0e4d5c 0%, #2a8b9c 50%, #c4a572 100%)",
    pattern: "lagoon",
  },
  {
    id: "BSN-002",
    code: "COAST-DELTA",
    title: "Mediterranean Coastal Survey",
    desc: "Multi-station physico-chemical and sedimentological characterization across the southern Mediterranean shelf.",
    coord: "Dr. A. Hamza",
    status: "ACTIVE",
    region: "TN · 36.84°N",
    cycle: "CYCLE 08",
    bg: "linear-gradient(135deg, #062132 0%, #1b5573 60%, #4ad6c4 120%)",
    pattern: "shelf",
  },
  {
    id: "BSN-003",
    code: "MANGROVE-AT",
    title: "Mangrove Carbon Stocks",
    desc: "Quantifying blue-carbon sequestration potential of fringing mangrove communities in coastal lagoons.",
    coord: "Dr. L. Mansouri",
    status: "DATA COLLECTION",
    region: "TN · 33.72°N",
    cycle: "CYCLE 09",
    bg: "linear-gradient(135deg, #0e4d5c 0%, #0a3142 50%, #103a4f 100%)",
    pattern: "mangrove",
  },
  {
    id: "BSN-004",
    code: "RIV-MED",
    title: "Freshwater Inflows",
    desc: "Hydrological mass-balance and nutrient flux modelling for rivers discharging into protected coastal zones.",
    coord: "Pr. K. Trabelsi",
    status: "ANALYSIS",
    region: "TN · 36.10°N",
    cycle: "CYCLE 08",
    bg: "linear-gradient(135deg, #103a4f 0%, #2a8b9c 100%)",
    pattern: "river",
  },
  {
    id: "BSN-005",
    code: "BIO-SED",
    title: "Sedimentological Atlas",
    desc: "Granulometric and geochemical mapping of intertidal sediments across the BASSIANA network.",
    coord: "Dr. S. Khouaja",
    status: "ACTIVE",
    region: "TN · 35.55°N",
    cycle: "CYCLE 09",
    bg: "linear-gradient(135deg, #c4a572 0%, #0a3142 100%)",
    pattern: "sediment",
  },
  {
    id: "BSN-006",
    code: "FISH-STK",
    title: "Fisheries Stock Assessment",
    desc: "Annual catch composition, length-frequency distributions, and stock-status indicators for artisanal fisheries.",
    coord: "Dr. M. Ennouri",
    status: "PLANNED",
    region: "TN · 34.74°N",
    cycle: "CYCLE 10",
    bg: "linear-gradient(135deg, #1b5573 0%, #082a3d 100%)",
    pattern: "fish",
  },
];

const GEO_TILES = [
  { name: "Open Ocean",  region: "MED Basin", coord: "36.5°N · 10.2°E",
    bg: "linear-gradient(180deg, #082a3d 0%, #1b5573 40%, #2a8b9c 100%)" },
  { name: "Lagoon",      region: "Ichkeul",   coord: "37.1°N · 09.6°E",
    bg: "radial-gradient(circle at 50% 60%, #4ad6c4 0%, #2a8b9c 30%, #082a3d 80%)" },
  { name: "Coastal Beach", region: "Gulf of Gabès", coord: "33.9°N · 10.1°E",
    bg: "linear-gradient(180deg, #88b5cf 0%, #c4a572 60%, #8a7548 100%)" },
  { name: "Mangrove",    region: "Lagoon",    coord: "34.7°N · 10.7°E",
    bg: "linear-gradient(160deg, #1b5573 0%, #2a8b9c 40%, #5a8e3a 100%)" },
];

const DEVELOPERS = [
  { initials: "BB", name: "Béchir Béjaoui",   role: "Project Lead · Data Architecture",
    color: "#4ad6c4", joined: "2020", commits: "1.2k", focus: ["GIS", "BACKEND"],
    bio: "Leads the BASSIANA data architecture and coordinates with field teams across the IMAS-Ichkeul cycle." },
  { initials: "AH", name: "Ahmed Hamza",      role: "Senior Backend Engineer",
    color: "#2a8b9c", joined: "2021", commits: "986",  focus: ["API", "DB"],
    bio: "Designs ingestion pipelines for long-term ecological observations and maintains the central data warehouse." },
  { initials: "LM", name: "Leila Mansouri",   role: "GIS / Frontend Developer",
    color: "#c4a572", joined: "2022", commits: "742",  focus: ["MAPS", "REACT"],
    bio: "Builds the spatial analysis tools and interactive cartographic interfaces used by partner institutions." },
  { initials: "KT", name: "Karim Trabelsi",   role: "Data Engineer · Modelling",
    color: "#5fb6c4", joined: "2023", commits: "418",  focus: ["ETL", "MODEL"],
    bio: "Owns the modelling stack — hydrodynamic, nutrient-flux, and statistical estimation across ecosystem types." },
];

const ADMINS = [
  { initials: "SK", name: "Sonia Khouaja", role: "Programme Coordinator · INSTM",
    color: "#f5b94a", joined: "2020", projects: "12",
    focus: ["OPS", "PARTNERSHIPS"],
    bio: "Coordinates the PEER Cycle 8 programme between INSTM, USAID and the National Academy of Sciences." },
  { initials: "ME", name: "Mohamed Ennouri", role: "Database Administrator · Security",
    color: "#f5b94a", joined: "2020", projects: "06",
    focus: ["INFRA", "ACCESS"],
    bio: "Manages user access, backups, and data-quality assurance across the BASSIANA infrastructure stack." },
];

// ── Atoms ───────────────────────────────────────────────────────────────────

function Dot() { return <span className="dot" />; }

function FadeUp({ children, delay = 0, as: As = "div", ...rest }) {
  const ref = React.useRef(null);
  const [seen, setSeen] = React.useState(false);
  React.useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setSeen(true); io.disconnect(); }
    }, { threshold: 0.08, rootMargin: "0px 0px -40px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <As ref={ref} className={`fade-up ${seen ? 'in' : ''}`} style={{ transitionDelay: `${delay}ms` }} {...rest}>{children}</As>;
}

// ── Nav ─────────────────────────────────────────────────────────────────────

function Nav() {
  const [active, setActive] = React.useState("home");
  React.useEffect(() => {
    const ids = ["home","about","geodatabase","projects","team"];
    const els = ids.map(i => document.getElementById(i)).filter(Boolean);
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id); });
    }, { rootMargin: "-40% 0px -50% 0px" });
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);
  const link = (id, label) => (
    <a className={`nav-link ${active===id?'active':''}`}
       onClick={e => { e.preventDefault(); document.getElementById(id)?.scrollIntoView({ behavior:'smooth', block:'start' }); }}
       href={`#${id}`}>{label}</a>
  );
  const [t, setT] = React.useState(new Date());
  React.useEffect(() => { const i = setInterval(() => setT(new Date()), 1000); return () => clearInterval(i); }, []);
  const tStr = t.toISOString().slice(11,19) + " UTC";

  return (
    <nav className="nav">
      <div className="nav-inner">
        <div className="brand">
          <div className="brand-mark">B</div>
          <div>
            <div className="brand-name">BASSIANA</div>
            <div className="brand-sub">Marine Ecosystems DB</div>
          </div>
        </div>
        <div className="nav-links">
          {link("home","Overview")}
          {link("about","About")}
          {link("geodatabase","Geodatabase")}
          {link("projects","Projects")}
          {link("team","Team")}
        </div>
        <div className="nav-meta">
          <span><Dot /> <span style={{ marginLeft: 8 }}>online</span></span>
          <span>{tStr}</span>
        </div>
      </div>
    </nav>
  );
}

// ── Hero ────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section id="home" className="hero">
      <FadeUp>
        <div className="hero-tag">
          <span className="label label-accent">// portal v2.4</span>
          <span className="hero-tag-line" />
          <span className="label">PEER · CYCLE 08 · IMAS-ICKEUL</span>
        </div>
      </FadeUp>

      <FadeUp delay={80}>
        <h1 className="hero-title">
          Marine ecosystems,<br/>
          <em>monitored at scale.</em>
        </h1>
      </FadeUp>

      <FadeUp delay={160}>
        <div className="hero-row">
          <p className="hero-sub">
            BASSIANA is the centralized long-term observation database for marine, coastal,
            lagoon and freshwater ecosystems across the southern Mediterranean — built to
            help researchers, policy makers and ecosystem managers understand how
            ecosystems respond to change.
          </p>
          <div className="hero-actions">
            <a className="btn btn-primary" href="#projects">
              Browse Projects <span className="arrow"></span>
            </a>
            <a className="btn btn-ghost" href="#geodatabase">Open Geodatabase</a>
          </div>
        </div>
      </FadeUp>

      <FadeUp delay={240}>
        <div className="stats">
          {STATS.map((s, i) => (
            <div className="stat" key={i}>
              <div className="stat-value">
                {s.value}
              </div>
              <div className="label stat-label">{s.label}</div>
              <div className="stat-delta">{s.delta}</div>
            </div>
          ))}
        </div>
      </FadeUp>
    </section>
  );
}

// ── About + Mission ─────────────────────────────────────────────────────────

const MISSION = [
  { t: "Aggregate", d: "Gather data spanning biological, chemical, physical, physico-chemical, sedimentological and fishery domains." },
  { t: "Centralize", d: "Maintain a single, accessible repository for long-term ecological observations across institutions." },
  { t: "Analyze",   d: "Derive spatial and temporal insights on ecosystem status using harmonized statistical & numerical tooling." },
  { t: "Distribute",d: "Provide structured, vetted access to policy makers, environmental managers, researchers and stakeholders." },
];

function About() {
  return (
    <section id="about" className="section">
      <FadeUp>
        <div className="section-head">
          <span className="section-num">/ 01</span>
          <h2 className="section-title">BASSIANA overview</h2>
          <span className="label">est. 2026</span>
        </div>
      </FadeUp>

      <div className="about-grid">
        <FadeUp delay={60}>
          <article className="card about-card">
            <div className="card-head">
              <div className="card-head-l">
                <span className="ico ico-globe" style={{ color:'var(--accent)' }}></span>
                <h3>About BASSIANA</h3>
              </div>
              <span className="card-id">DOC-01 / EN</span>
            </div>
            <p>
              <strong>Understanding ecosystem response to change</strong> — at local, regional, and global
              scales — requires sustainable management, governance of the services ecosystems provide,
              and clear assessment of the socio-environmental implications for future development.
            </p>
            <p>
              The BASSIANA Marine Ecosystems Database was created in <strong>2020</strong> to collect long-term
              data and centralize information related to marine, coastal, lagoon and freshwater ecosystems.
            </p>
            <p>
              Funded by <strong>USAID</strong> through the IMAS-Ichkeul project (AID-OAA-A-11-00012) and managed by
              the <strong>National Academy of Sciences</strong> under the PEER Cycle 8 programme,
              BASSIANA is coordinated by Tunisia's <strong>National Institute of Marine Sciences and Technologies (INSTM)</strong>.
            </p>
            <p>
              The platform structures vast amounts of high-quality data with efficient access — covering
              over 50 environmental parameters across biological, chemical, physical, physico-chemical,
              sedimentological and fishery dimensions.
            </p>
          </article>
        </FadeUp>

        <FadeUp delay={120}>
          <article className="card">
            <div className="card-head">
              <div className="card-head-l">
                <span className="ico ico-target" style={{ color:'var(--accent)' }}></span>
                <h3>Our mission</h3>
              </div>
              <span className="card-id">04 GOALS</span>
            </div>
            <ul className="mission-list">
              {MISSION.map((m, i) => (
                <li key={i}>
                  <span className="mission-num">{String(i+1).padStart(2,'0')}</span>
                  <span><b>{m.t}</b>{m.d}</span>
                </li>
              ))}
            </ul>
          </article>
        </FadeUp>
      </div>
    </section>
  );
}

// ── Geodatabase ─────────────────────────────────────────────────────────────

function Geodatabase() {
  return (
    <section id="geodatabase" className="section">
      <FadeUp>
        <div className="section-head">
          <span className="section-num">/ 02</span>
          <h2 className="section-title">Geodatabase</h2>
          <span className="label">geospatial analysis · 04 zones</span>
        </div>
      </FadeUp>

      <FadeUp delay={80}>
        <div className="card geo-card">
          <div className="geo-head">
            <div>
              <h3>Coverage across ecosystem types</h3>
              <p>Sampling sites span open ocean, coastal beaches, lagoons and mangrove fringes. Each zone supports its own parameter set and sampling cadence.</p>
            </div>
            <a className="btn btn-ghost" href="#">Open Atlas <span className="arrow"></span></a>
          </div>
          <div className="geo-grid">
            {GEO_TILES.map((tile, i) => (
              <div className="geo-tile" key={i}>
                <div className="geo-tile-img" style={{ background: tile.bg }}>
                  {/* subtle pattern overlay */}
                  <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity: 0.18 }} preserveAspectRatio="none" viewBox="0 0 100 100">
                    <defs>
                      <pattern id={`p${i}`} width="6" height="6" patternUnits="userSpaceOnUse">
                        <path d="M0 6 L6 0" stroke="white" strokeWidth="0.3" />
                      </pattern>
                    </defs>
                    <rect width="100" height="100" fill={`url(#p${i})`} />
                  </svg>
                </div>
                <div className="geo-tile-overlay" />
                <div className="geo-tile-meta">
                  <div>
                    <div className="label">{tile.region}</div>
                    <h4>{tile.name}</h4>
                  </div>
                  <span className="geo-tile-coord">{tile.coord}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </FadeUp>
    </section>
  );
}

// ── Projects ────────────────────────────────────────────────────────────────

function Projects() {
  return (
    <section id="projects" className="section">
      <FadeUp>
        <div className="section-head">
          <span className="section-num">/ 03</span>
          <h2 className="section-title">Active projects</h2>
          <span className="label">{String(PROJECTS.length).padStart(2,'0')} initiatives</span>
        </div>
      </FadeUp>

      <div className="projects-grid">
        {PROJECTS.map((p, i) => (
          <FadeUp delay={i * 60} key={p.id}>
            <article className="project">
              <div className="project-img" style={{ background: p.bg }}>
                <span className="project-status"><Dot /> {p.status}</span>
                <span className="project-id">{p.id}</span>
                <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity: 0.15 }} preserveAspectRatio="none" viewBox="0 0 100 60">
                  <defs>
                    <pattern id={`pp${i}`} width="4" height="4" patternUnits="userSpaceOnUse">
                      <path d="M0 4 L4 0" stroke="white" strokeWidth="0.25" />
                    </pattern>
                  </defs>
                  <rect width="100" height="60" fill={`url(#pp${i})`} />
                </svg>
              </div>
              <div className="project-body">
                <div className="label" style={{ color:'var(--accent)', marginBottom: 6 }}>{p.code}</div>
                <h3 className="project-title">{p.title}</h3>
                <p className="project-desc">{p.desc}</p>
                <div className="project-foot">
                  <div>
                    <div>COORDINATOR</div>
                    <div className="project-coord">{p.coord}</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div>{p.region}</div>
                    <div style={{ color:'var(--accent)' }}>{p.cycle}</div>
                  </div>
                  <div className="project-arrow">
                    <span className="arrow" style={{ width: 12, height: 12 }}></span>
                  </div>
                </div>
              </div>
            </article>
          </FadeUp>
        ))}
      </div>
    </section>
  );
}

// ── Team ────────────────────────────────────────────────────────────────────

function MemberCard({ m, kind, onOpen }) {
  return (
    <article className="member" onClick={() => onOpen(m, kind)}>
      {kind === 'admin' && <span className="admin-badge">ADMIN</span>}
      <div className="avatar" style={{ background: `linear-gradient(135deg, ${m.color}, ${m.color}aa)` }}>
        {m.initials}
      </div>
      <h4 className="member-name">{m.name}</h4>
      <p className="member-role">{m.role}</p>
      <div className="member-meta">
        <span>JOINED <span className="label-accent">{m.joined}</span></span>
        <span>{kind==='admin' ? `${m.projects} PROJECTS` : `${m.commits} COMMITS`}</span>
      </div>
    </article>
  );
}

function Team({ onOpen }) {
  return (
    <section id="team" className="section">
      <FadeUp>
        <div className="section-head">
          <span className="section-num">/ 04</span>
          <h2 className="section-title">Team</h2>
          <span className="label">06 members · INSTM</span>
        </div>
      </FadeUp>

      <FadeUp delay={60}>
        <div style={{ display:'flex', alignItems:'center', gap: 12, margin:'8px 0 16px' }}>
          <span className="label label-accent">// developers</span>
          <span style={{ flex: 1, height: 1, background:'var(--line)' }}></span>
          <span className="label">04 engineers</span>
        </div>
      </FadeUp>

      <div className="team-grid">
        {DEVELOPERS.map((m, i) => (
          <FadeUp delay={i * 50} key={m.initials}>
            <MemberCard m={m} kind="dev" onOpen={onOpen} />
          </FadeUp>
        ))}
      </div>

      <FadeUp delay={120}>
        <div style={{ display:'flex', alignItems:'center', gap: 12, margin:'48px 0 16px' }}>
          <span className="label label-accent">// administrators</span>
          <span style={{ flex: 1, height: 1, background:'var(--line)' }}></span>
          <span className="label">02 admins</span>
        </div>
      </FadeUp>

      <div className="team-grid admins">
        {ADMINS.map((m, i) => (
          <FadeUp delay={i * 60} key={m.initials}>
            <MemberCard m={m} kind="admin" onOpen={onOpen} />
          </FadeUp>
        ))}
      </div>
    </section>
  );
}

// ── Modal ───────────────────────────────────────────────────────────────────

function MemberModal({ data, onClose }) {
  React.useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  if (!data) return null;
  const { m, kind } = data;
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        <div className="modal-head">
          <div className="avatar" style={{ background:`linear-gradient(135deg, ${m.color}, ${m.color}aa)` }}>{m.initials}</div>
          <div>
            <h3 className="modal-name">{m.name}</h3>
            <p className="modal-role">{m.role}</p>
          </div>
        </div>

        <div className="modal-stats">
          <div className="modal-stat">
            <div className="label">Joined</div>
            <div className="modal-stat-v">{m.joined}</div>
          </div>
          <div className="modal-stat">
            <div className="label">{kind==='admin' ? 'Projects' : 'Commits'}</div>
            <div className="modal-stat-v">{kind==='admin' ? m.projects : m.commits}</div>
          </div>
        </div>

        <p className="modal-bio">{m.bio}</p>

        <div className="modal-foot">
          {m.focus.map(tag => <span className="modal-tag" key={tag}>{tag}</span>)}
        </div>
      </div>
    </div>
  );
}

// ── App ─────────────────────────────────────────────────────────────────────

function App() {
  const [t, setT] = useTweaks(TWEAK_DEFAULTS);
  const [modal, setModal] = React.useState(null);
  const onOpen = (m, kind) => setModal({ m, kind });

  React.useEffect(() => {
    document.documentElement.dataset.density = t.density;
    document.documentElement.dataset.dividers = t.dividers;
    document.documentElement.dataset.font = t.font;
  }, [t.density, t.dividers, t.font]);

  return (
    <>
      <div className="grid-lines" />
      <Nav />
      <div className="shell" style={{ position:'relative', zIndex: 1 }}>
        <Hero />
        <div className="section-divider" style={{ marginTop: 48 }} />
        <About />
        <div className="section-divider" style={{ marginTop: 80 }} />
        <Geodatabase />
        <div className="section-divider" style={{ marginTop: 80 }} />
        <Projects />
        <div className="section-divider" style={{ marginTop: 80 }} />
        <Team onOpen={onOpen} />
        <footer>
          <span>© 2026 BASSIANA · INSTM · PEER Cycle 08</span>
          <span>v2.4.0 · made for marine research</span>
        </footer>
      </div>

      {modal && <MemberModal data={modal} onClose={() => setModal(null)} />}

      <TweaksPanel title="Tweaks">
        <TweakSection label="Layout">
          <TweakRadio label="Density"
            value={t.density}
            options={[
              { value:'compact', label:'Compact' },
              { value:'comfortable', label:'Comfortable' },
            ]}
            onChange={v => setT('density', v)} />
          <TweakRadio label="Dividers"
            value={t.dividers}
            options={[
              { value:'on', label:'On' },
              { value:'off', label:'Off' },
            ]}
            onChange={v => setT('dividers', v)} />
        </TweakSection>

        <TweakSection label="Type">
          <TweakSelect label="Font pairing"
            value={t.font}
            options={[
              { value:'geist',     label:'Geist + JetBrains Mono' },
              { value:'manrope',   label:'Manrope + Space Mono' },
              { value:'editorial', label:'Instrument Serif + Plex Mono' },
            ]}
            onChange={v => setT('font', v)} />
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
