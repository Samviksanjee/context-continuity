/* Signal Atlas: editorial systems design, warm paper + ink + signal orange, asymmetric narrative layouts. */
import { useState, type CSSProperties } from "react";
import { ArrowDownRight, ArrowUpRight, ChevronRight, CircleHelp, LockKeyhole, Menu, MoveRight, Network, Play, ScanLine, Sparkles, Timer, X } from "lucide-react";

const layers = [
  { key: "perceive", label: "01 / Perceive", title: "Notice what is happening", copy: "Camera, screen, voice and documents become structured signals — without asking you to narrate the obvious.", icon: ScanLine, color: "#DDE8E2" },
  { key: "remember", label: "02 / Remember", title: "Keep the thread", copy: "A private context graph connects people, tasks, deadlines and evidence across the moments that created them.", icon: Network, color: "#F3E3C8" },
  { key: "reason", label: "03 / Reason", title: "Understand why it matters", copy: "On-device intelligence compares new information with what already exists, then surfaces the useful relationship.", icon: Sparkles, color: "#DCE6EF" },
  { key: "action", label: "04 / Take action", title: "Move the work forward", copy: "A clear, permission-based next step appears when the system has enough context to make one worth considering.", icon: MoveRight, color: "#F6D7CB" },
];

const moments = [
  ["MON", "Poster photographed", "A hackathon enters the graph."],
  ["TUE", "Problem statement read", "The PDF becomes evidence."],
  ["WED", "Rahul gets the backend", "A responsibility finds its owner."],
  ["THU", "Presentation created", "The deck joins the project."],
  ["FRI", "State reconstructed", "“You’re missing the prototype demo.”"],
];

const memorySpaces = [
  { key: "work-review", label: "Tomorrow’s client review", cue: "Calendar + slide draft + chat", status: "ACTIVE THREAD", color: "#F26B3A", source: "Q2_client_review.pptx", relationship: "Aisha → budget slide", memory: "Slide 7 is still missing the approved Q2 numbers for tomorrow’s 9:00 AM review.", why: "The calendar invite, shared slide draft, and Aisha’s message all point to the same client review. The deadline is within 18 hours.", action: "Why this is in focus", confidence: "94%", nodes: ["Calendar", "Slides", "Aisha", "Finance", "Client"] },
  { key: "move-in", label: "New flat move-in", cue: "Lease + delivery + landlord chat", status: "PAUSED THREAD", color: "#799E92", source: "IKEA_delivery_9821.pdf", relationship: "Key handover → 2:00 PM", memory: "Your bed delivery overlaps with the key handover on Saturday afternoon.", why: "The lease confirmation, furniture delivery window, and landlord chat share the same address and Saturday date.", action: "Why this is in focus", confidence: "91%", nodes: ["Lease", "Keys", "Delivery", "Landlord", "Address"] },
  { key: "weekend-trip", label: "Mysuru weekend train", cue: "E-ticket + maps + family chat", status: "BACKGROUND THREAD", color: "#7998B6", source: "IRCTC_eTicket_8843.pdf", relationship: "Cab pickup → 6:10 AM", memory: "Leave home 30 minutes earlier: rain is forecast before your train to Mysuru.", why: "The train e-ticket, saved station route, and family chat reference the same Saturday-morning departure.", action: "Why this is in focus", confidence: "87%", nodes: ["Train", "Cab", "Weather", "Family", "Station"] },
];

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function Home() {
  const [activeLayer, setActiveLayer] = useState("remember");
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeMemoryKey, setActiveMemoryKey] = useState("work-review");
  const [showEvidence, setShowEvidence] = useState(false);
  const active = layers.find((layer) => layer.key === activeLayer) ?? layers[1];
  const activeMemory = memorySpaces.find((memory) => memory.key === activeMemoryKey) ?? memorySpaces[0];

  return (
    <div className="site-shell">
      <header className="topbar">
        <button className="brand" onClick={() => scrollToId("top")} aria-label="Back to top">
          <img src="/manus-storage/context-logo_28ea51ee.png" alt="" className="brand-mark" />
          <span>CONTEXT<span className="brand-slash">/</span>CONTINUITY</span>
        </button>
        <nav className={menuOpen ? "nav-links nav-open" : "nav-links"} aria-label="Main navigation">
          <button onClick={() => { scrollToId("thesis"); setMenuOpen(false); }}>The thesis</button>
          <button onClick={() => { scrollToId("memory-demo"); setMenuOpen(false); }}>Demo</button>
          <button onClick={() => { scrollToId("architecture"); setMenuOpen(false); }}>Architecture</button>
          <button onClick={() => { scrollToId("trust"); setMenuOpen(false); }}>Trust</button>
        </nav>
        <button className="menu-toggle" aria-label="Toggle menu" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={18} /> : <Menu size={18} />}</button>
        <button className="nav-cta" onClick={() => scrollToId("architecture")}>Explore the layer <ArrowUpRight size={15} /></button>
      </header>

      <aside className="atlas-rail" aria-label="Atlas index">
        <span className="atlas-title">ATLAS / 05</span>
        <div className="atlas-track" />
        {[['01', 'thesis', 'THESIS'], ['02', 'story', 'THREAD'], ['03', 'memory-demo', 'SWITCH'], ['04', 'architecture', 'SYSTEM'], ['05', 'trust', 'TRUST']].map(([index, target, label]) => <button key={target} onClick={() => scrollToId(target)}><i /><span>{index}</span><small>{label}</small></button>)}
      </aside>

      <main id="top">
        <section className="hero section-pad">
          <div className="hero-copy">
            <div className="eyebrow"><span className="signal-dot" /> A proposal for iQOO / OriginOS</div>
            <h1>The intelligence<br /><em>between</em> moments.</h1>
            <p className="hero-lede">ContextOS understands what is happening around you. <strong>Context Continuity remembers why it matters</strong> — and carries that understanding across apps, devices, time and tasks.</p>
            <div className="hero-actions">
              <button className="primary-button" onClick={() => scrollToId("thesis")}>See the missing layer <ArrowDownRight size={17} /></button>
              <button className="text-button" onClick={() => scrollToId("story")}><Play size={14} fill="currentColor" /> Follow one project</button>
            </div>
            <div className="hero-meta"><span>CONCEPT / 01</span><span>PRIVATE BY DEFAULT</span><span>EDGE-FIRST</span></div>
          </div>
          <div className="hero-visual">
            <div className="visual-caption caption-top">A living map of what matters</div>
            <img src="/manus-storage/context-hero_607ec187.png" alt="Abstract context network with connected signal nodes" />
            <div className="hero-callout"><span className="callout-line" /><div><span className="micro-label">SIGNAL DETECTED</span><strong>“This belongs<br />to your project.”</strong></div></div>
            <div className="visual-caption caption-bottom">The interface is not the intelligence.<br />The continuity is.</div>
          </div>
        </section>

        <section id="thesis" className="thesis section-pad">
          <div className="section-kicker">01 / The missing layer</div>
          <div className="thesis-grid">
            <h2>iQOO already has<br /><span>the moments.</span></h2>
            <div className="thesis-body"><p>Origin Island. AI Search. Copy &amp; Go. Office Kit. Phone-to-PC handoff. The pieces are already there.</p><p className="large-note">We propose the layer that turns those <strong>isolated contextual moments</strong> into one persistent, private intelligence.</p><button className="underlined-button" onClick={() => scrollToId("architecture")}>Unify the pieces <ChevronRight size={16} /></button></div>
          </div>
          <div className="comparison-strip"><div><span>Today</span><strong>Feature → feature</strong><small>Useful in the moment. Forgotten after.</small></div><div className="strip-arrow">→</div><div className="highlight-cell"><span>ContextOS</span><strong>Moment → meaning</strong><small>Connected across time, apps, devices.</small></div></div>
        </section>

        <section id="story" className="story section-pad">
          <div className="story-intro"><div className="section-kicker">02 / Context continuity</div><h2>One project.<br /><em>Five days.</em></h2><p>Most apps remember an interaction. Context Continuity reconstructs the reason behind it.</p></div>
          <div className="timeline-panel">
            <img src="/manus-storage/context-timeline_9413ddfd.png" alt="Abstract connected timeline" className="timeline-art" />
            <div className="timeline-list">{moments.map(([day, title, copy], index) => <div className={index === moments.length - 1 ? "moment moment-last" : "moment"} key={day}><span className="moment-day">{day}</span><span className="moment-node" /><div><strong>{title}</strong><p>{copy}</p></div></div>)}</div>
          </div>
        </section>

        <section id="memory-demo" className="memory-demo section-pad" aria-labelledby="memory-demo-heading">
          <div className="memory-demo-head"><div><div className="section-kicker">03 / Interactive demo</div><h2 id="memory-demo-heading">Switch the memory.<br /><em>Keep the meaning.</em></h2></div><p>On a normal weekday, a phone may hold a work review, a move-in, and a family trip at once. The useful behavior is not remembering more — it is keeping each thread separate and bringing the right one forward.</p></div>
          <div className="memory-workbench">
            <div className="memory-selector" role="tablist" aria-label="Choose a context thread">
              <span className="micro-label">AVAILABLE CONTEXTS</span>
              {memorySpaces.map((memory, index) => <button key={memory.key} role="tab" aria-selected={activeMemory.key === memory.key} className={activeMemory.key === memory.key ? "memory-choice active" : "memory-choice"} onClick={() => { setActiveMemoryKey(memory.key); setShowEvidence(false); }}><span className="choice-index">0{index + 1}</span><span className="choice-copy"><strong>{memory.label}</strong><small>{memory.cue}</small></span><span className="choice-status" style={{ backgroundColor: memory.color }} /></button>)}
              <div className="selector-note"><span className="signal-dot" /> Only the active thread can shape the next suggestion.</div>
            </div>
            <div className="memory-stage" role="tabpanel" aria-live="polite" aria-label={`${activeMemory.label} context details`}>
              <div className="stage-top"><div><span className="micro-label">NOW IN FOCUS</span><h3>{activeMemory.label}</h3></div><span className="stage-status" style={{ color: activeMemory.color }}><i style={{ backgroundColor: activeMemory.color }} /> {activeMemory.status}</span></div>
              <div className="memory-graph" style={{ "--memory-color": activeMemory.color } as CSSProperties}>
                <div className="graph-spoke spoke-a" /><div className="graph-spoke spoke-b" /><div className="graph-spoke spoke-c" /><div className="graph-spoke spoke-d" />
                {activeMemory.nodes.map((node, index) => <span key={node} className={`memory-node memory-node-${index}`}>{node}</span>)}
                <div className="memory-core"><Network size={17} /><span>CONTEXT<br />GRAPH</span></div>
              </div>
              <div className="memory-evidence"><div><span className="micro-label">EVIDENCE</span><strong>{activeMemory.source}</strong></div><div><span className="micro-label">RELATIONSHIP</span><strong>{activeMemory.relationship}</strong></div><div><span className="micro-label">CONFIDENCE</span><strong>{activeMemory.confidence}</strong></div></div>
              <div className="memory-suggestion"><span className="micro-label">CONTEXTOS SAYS</span><p>“{activeMemory.memory}”</p><button onClick={() => setShowEvidence(!showEvidence)} aria-expanded={showEvidence}>{activeMemory.action} <ArrowUpRight size={14} /></button>{showEvidence && <div className="memory-reasoning"><span className="micro-label">WHY CONTEXTOS SWITCHED</span><p>{activeMemory.why}</p></div>}</div>
            </div>
          </div>
        </section>

        <section id="architecture" className="architecture section-pad">
          <div className="architecture-head"><div><div className="section-kicker">04 / The architecture</div><h2>Perceive.<br />Remember.<br /><em>Reason.</em></h2></div><p>ContextOS is not another AI feature. It is the connective tissue beneath the features you already use.</p></div>
          <div className="architecture-layout">
            <div className="layer-tabs">{layers.map((layer) => { const Icon = layer.icon; return <button key={layer.key} className={activeLayer === layer.key ? "layer-tab active" : "layer-tab"} onClick={() => setActiveLayer(layer.key)}><span><Icon size={16} /> {layer.label}</span><ChevronRight size={15} /></button>; })}</div>
            <div className="layer-detail" style={{ backgroundColor: active.color }}><div className="detail-top"><span className="micro-label">CONTEXTOS / LAYER</span><span className="layer-number">{layers.findIndex((l) => l.key === active.key) + 1} / 04</span></div><active.icon size={30} strokeWidth={1.5} /><h3>{active.title}</h3><p>{active.copy}</p><div className="detail-rule" /><div className="detail-footer"><span>LOCAL PROCESSING</span><span>USER CONTROLLED</span></div></div>
            <div className="graph-card"><img src="/manus-storage/context-graph_7b67326b.png" alt="Context graph connecting project entities" /><div className="graph-label label-project">PROJECT</div><div className="graph-label label-task">TASK</div><div className="graph-label label-deadline">DEADLINE</div><div className="graph-label label-person">PERSON</div></div>
          </div>
        </section>

        <section id="trust" className="trust section-pad"><div className="trust-copy"><div className="section-kicker">05 / A memory you can govern</div><h2>Useful because<br /><em>you’re in control.</em></h2><p>Context is powerful only when it is legible. Every surfaced insight carries its source, its confidence, and a clear way to correct or forget it.</p><div className="trust-points"><div><LockKeyhole size={18} /><span><strong>Private by default</strong>On-device first. Cloud only when you choose.</span></div><div><Timer size={18} /><span><strong>Time-aware</strong>Old context can fade. Nothing is permanent by accident.</span></div><div><CircleHelp size={18} /><span><strong>Explainable</strong>See why the system made the connection.</span></div></div></div><div className="privacy-visual"><img src="/manus-storage/context-privacy_86c3a403.png" alt="Abstract private on-device intelligence symbol" /><span className="privacy-tag tag-source">SOURCE / PDF</span><span className="privacy-tag tag-memory">MEMORY / TASK</span><span className="privacy-tag tag-action">ACTION / YOUR CALL</span></div></section>

        <section className="closing section-pad"><div className="closing-index">CONTEXTOS<br /><span>THE OPERATING LAYER FOR MEANING</span></div><h2>Stop starting<br /><em>from zero.</em></h2><p>The best assistant is not the one that says more. It is the one that already understands the thread.</p><button className="primary-button" onClick={() => scrollToId("top")}>Revisit the proposition <ArrowUpRight size={17} /></button></section>
      </main>
      <footer><span>CONTEXT<span className="brand-slash">/</span>CONTINUITY</span><span>CONCEPT STUDY / 2026</span><span>BUILT FOR THE NEXT MOMENT <ArrowUpRight size={13} /></span></footer>
    </div>
  );
}
