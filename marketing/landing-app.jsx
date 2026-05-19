/* AutoMart Landing — single-file React app */
const { useEffect, useRef, useState, useMemo } = React;

/* ------------------------------------------------------------
   Lazy / pause-when-offscreen video helper.
   - preload="metadata" so we don't pull megabytes upfront
   - IntersectionObserver pauses the video when scrolled out of
     view (huge CPU/decoder savings when several videos are on the page)
   - Optional `freezeFirstFrame` mode: shows the first decoded frame
     and never plays again. Used for the side echoes of the why-bmw
     stage so we only pay for ONE active decoder, not three.
   ------------------------------------------------------------ */
function LazyVideo({ src, freezeFirstFrame = false, eagerLoad = true, rootMargin = '400px', className, style, ...rest }) {
  const ref = useRef(null);
  useEffect(() => {
    const v = ref.current; if (!v) return;
    // Force-start ASAP
    const kick = () => v.play().catch(()=>{});
    v.addEventListener('loadedmetadata', kick, { once:true });
    v.addEventListener('canplay', kick, { once:true });
    if (v.readyState >= 1) kick();

    if (freezeFirstFrame) {
      const onSeek = () => v.pause();
      const onLoaded = () => { try { v.currentTime = 0.01; } catch(e){} };
      v.addEventListener('loadedmetadata', onLoaded, { once:true });
      v.addEventListener('seeked', onSeek, { once:true });
      return;
    }
    // Pause only when fully offscreen (CPU savings, no effect on first play)
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) v.play().catch(()=>{});
      else v.pause();
    }, { threshold: 0.01 });
    io.observe(v);
    return () => io.disconnect();
  }, [src, freezeFirstFrame]);

  return (
    <video
      ref={ref}
      src={src}
      muted
      playsInline
      autoPlay={!freezeFirstFrame}
      loop={!freezeFirstFrame}
      preload="auto"
      className={className}
      style={style}
      {...rest}
    />
  );
}

/* ============================================================
   SVG: Stylized sedan (front-3-quarter view) — original artwork
   ============================================================ */
function CarApproach() {
  return (
    <svg viewBox="0 0 1200 600" className="w-full h-auto" aria-hidden="true">
      <defs>
        <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a2238"/>
          <stop offset="55%" stopColor="#0a0e1a"/>
          <stop offset="100%" stopColor="#05070d"/>
        </linearGradient>
        <linearGradient id="windowGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1d4ed8" stopOpacity="0.55"/>
          <stop offset="50%" stopColor="#0a0e1a" stopOpacity="0.85"/>
          <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.4"/>
        </linearGradient>
        <radialGradient id="head" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff"/>
          <stop offset="40%" stopColor="#bfd4ff"/>
          <stop offset="100%" stopColor="rgba(96,165,250,0)"/>
        </radialGradient>
        <radialGradient id="rim" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#3a4666"/>
          <stop offset="80%" stopColor="#1a2238"/>
          <stop offset="100%" stopColor="#05070d"/>
        </radialGradient>
        <linearGradient id="hoodHi" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(96,165,250,0.6)"/>
          <stop offset="100%" stopColor="rgba(96,165,250,0)"/>
        </linearGradient>
        <filter id="glow"><feGaussianBlur stdDeviation="14"/></filter>
      </defs>

      {/* Underglow */}
      <ellipse cx="600" cy="540" rx="500" ry="40" fill="rgba(37,99,235,0.4)" filter="url(#glow)"/>

      {/* Headlight halos */}
      <circle cx="320" cy="370" r="180" fill="url(#head)" opacity="0.85"/>
      <circle cx="880" cy="370" r="180" fill="url(#head)" opacity="0.85"/>

      {/* Body — main mass */}
      <path d="M180,420
               L210,330
               Q260,250 380,230
               L820,230
               Q940,250 990,330
               L1020,420
               Q1020,470 980,480
               L220,480
               Q180,470 180,420 Z"
            fill="url(#bodyGrad)" stroke="rgba(96,165,250,0.25)" strokeWidth="1.5"/>

      {/* Hood highlight */}
      <path d="M210,330 Q260,260 380,242 L820,242 Q940,260 990,330 L900,330 Q860,290 800,282 L400,282 Q340,290 300,330 Z"
            fill="url(#hoodHi)" opacity="0.5"/>

      {/* Windshield */}
      <path d="M345,330 Q400,275 470,265 L730,265 Q800,275 855,330 L800,330 Q760,300 720,295 L480,295 Q440,300 400,330 Z"
            fill="url(#windowGrad)"/>

      {/* Grille */}
      <rect x="500" y="380" width="200" height="36" rx="6" fill="#05070d" stroke="rgba(96,165,250,0.3)"/>
      {[0,1,2,3,4].map(i => (
        <rect key={i} x={508 + i*38} y={388} width={26} height={20} rx={2} fill="rgba(96,165,250,0.18)"/>
      ))}

      {/* Brand bar (original — three-line monogram) */}
      <g transform="translate(580,360)">
        <rect x="0" y="0" width="40" height="14" rx="3" fill="#0a0e1a" stroke="rgba(96,165,250,0.5)"/>
        <text x="20" y="11" textAnchor="middle" fontFamily="Inter" fontWeight="800" fontSize="9" fill="#60a5fa">AM</text>
      </g>

      {/* Headlights */}
      <ellipse cx="320" cy="370" rx="56" ry="22" fill="#ffffff" opacity="0.95"/>
      <ellipse cx="320" cy="370" rx="56" ry="22" fill="url(#head)"/>
      <ellipse cx="880" cy="370" rx="56" ry="22" fill="#ffffff" opacity="0.95"/>
      <ellipse cx="880" cy="370" rx="56" ry="22" fill="url(#head)"/>

      {/* Lower bumper line */}
      <path d="M220,440 L980,440" stroke="rgba(96,165,250,0.2)" strokeWidth="1"/>

      {/* Wheels */}
      <g>
        <circle cx="340" cy="480" r="58" fill="#05070d"/>
        <circle cx="340" cy="480" r="44" fill="url(#rim)"/>
        <circle cx="340" cy="480" r="10" fill="#0a0e1a" stroke="rgba(96,165,250,0.4)"/>
        {[0,1,2,3,4].map(i => (
          <rect key={i} x="338" y="442" width="4" height="34" rx="2"
                fill="#1a2238" transform={`rotate(${i*72} 340 480)`}/>
        ))}
      </g>
      <g>
        <circle cx="860" cy="480" r="58" fill="#05070d"/>
        <circle cx="860" cy="480" r="44" fill="url(#rim)"/>
        <circle cx="860" cy="480" r="10" fill="#0a0e1a" stroke="rgba(96,165,250,0.4)"/>
        {[0,1,2,3,4].map(i => (
          <rect key={i} x="858" y="442" width="4" height="34" rx="2"
                fill="#1a2238" transform={`rotate(${i*72} 860 480)`}/>
        ))}
      </g>

      {/* Plate */}
      <rect x="560" y="430" width="80" height="20" rx="3" fill="#f1f5f9" opacity="0.9"/>
      <text x="600" y="445" textAnchor="middle" fontFamily="Geist Mono" fontWeight="600" fontSize="12" fill="#0a0e1a">LEH-2026</text>
    </svg>
  );
}

/* ============================================================
   Top Nav
   ============================================================ */
function TopNav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <header
      data-screen-label="Top Nav"
      className={`fixed top-0 inset-x-0 z-50 nav-blur transition-colors ${scrolled ? 'bg-ink-950/70 border-b border-white/5' : 'bg-transparent'}`}
    >
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_4px_14px_rgba(37,99,235,0.5)]">
            <span className="font-black text-white text-sm">A</span>
            <span className="absolute -right-0.5 -bottom-0.5 w-2 h-2 rounded-full bg-ok"/>
          </div>
          <div className="leading-none">
            <div className="font-black tracking-tight text-white text-[17px]">AutoMart</div>
            <div className="font-mono text-[9px] tracking-[0.18em] text-white/50 mt-0.5">PK · TRUST-FIRST</div>
          </div>
        </div>
        <nav className="hidden md:flex items-center gap-1 text-sm">
          {['Browse','Sell a car','Verified sellers','AI insights','Help'].map(item => (
            <a key={item} href="#" className="px-3 py-2 rounded-lg text-white/75 hover:text-white hover:bg-white/5 transition-colors">{item}</a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <a href="../app/login.html" className="hidden sm:inline-flex h-9 px-4 rounded-lg text-sm font-medium text-white/80 hover:bg-white/5">Sign in</a>
          <a href="../app/signup.html" className="btn-primary h-9 px-4 rounded-lg text-sm font-semibold text-white">Post a listing</a>
        </div>
      </div>
    </header>
  );
}

/* ============================================================
   HERO — video-driven 3-stage cinematic reveal
   ============================================================ */
function Hero() {
  const videoRef = useRef(null);
  const [stage, setStage] = useState(2);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    try { v.playbackRate = 1.0; } catch(e){}
    v.play().catch(()=>{});
    const t2 = setTimeout(() => setStage(3), 7000);
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) v.play().catch(()=>{});
      else v.pause();
    }, { threshold: 0.01 });
    io.observe(v);
    return () => { clearTimeout(t2); io.disconnect(); };
  }, []);

  const line1 = [{t:'Buy'},{t:'your'},{t:'next'},{t:'car'}];
  const line2 = [{t:'without', italic:true},{t:'getting'},{t:'fooled.'}];
  let wi = 0;

  return (
    <section data-screen-label="01 Hero" className="hero-stage" data-stage={stage}>
      <video
        ref={videoRef}
        className="hero-video"
        src="media/hero-car.mp4"
        muted
        loop
        playsInline
        preload="auto"
        autoPlay
      />
      <div className="hero-grade"/>
      <div className="hero-darken"/>

      {/* Ambient loop layers */}
      <div className="lens-flare one"/>
      <div className="lens-flare two"/>
      <div className="smoke">
        <div className="puff"/><div className="puff"/><div className="puff"/><div className="puff"/><div className="puff"/>
      </div>
      <div className="hero-grain"/>

      {/* Top ribbon */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 stage-fade" style={{transitionDelay:'1.1s'}}>
        <div className="inline-flex items-center gap-2 h-8 px-3 rounded-full bg-white/8 border border-white/15 backdrop-blur-md text-[12px] text-white/85">
          <span className="pulse-dot"/>
          <span className="font-medium">12,438 verified listings live across Pakistan</span>
          <span className="text-white/40">·</span>
          <span className="font-mono text-[11px] text-white/55">UPDATED 2 MIN AGO</span>
        </div>
      </div>

      {/* Headline */}
      <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-10 min-h-screen flex flex-col items-center justify-center text-center">
        <h1 className="font-black tracking-[-0.045em] text-white text-[clamp(48px,8.5vw,128px)] leading-[0.92] drop-shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
          <div>
            {line1.map((w,i) => (
              <span key={'a'+i} className={`word ${w.italic?'serif':''}`} style={{animationDelay: `${0.05 + (wi++)*0.13}s`}}>
                {w.t}{i < line1.length-1 ? '\u00A0' : ''}
              </span>
            ))}
          </div>
          <div>
            {line2.map((w,i) => (
              <span
                key={'b'+i}
                className={`word ${w.italic?'serif':''}`}
                style={{
                  animationDelay: `${0.05 + (wi++)*0.13}s`,
                  fontSize: w.italic ? '1.15em' : undefined,
                }}
              >
                {w.t}{i < line2.length-1 ? '\u00A0' : ''}
              </span>
            ))}
          </div>
        </h1>

        <p className="stage-fade mt-7 text-white/80 text-lg md:text-xl max-w-[60ch] leading-relaxed" style={{transitionDelay:'1.5s'}}>
          Pakistan's first marketplace where every seller is ID-verified,
          every price is checked by AI, and every offer happens on the record.
        </p>

        {/* Trust strip */}
        <div className="stage-fade mt-12 grid grid-cols-2 md:grid-cols-4 gap-px bg-white/10 rounded-2xl overflow-hidden border border-white/15 max-w-[920px] w-full backdrop-blur-md" style={{transitionDelay:'1.8s'}}>
          {[
            ['12,438','Verified listings'],
            ['4.92','Avg seller rating'],
            ['68','Cities covered'],
            ['<6min','Median reply time'],
          ].map(([n,l]) => (
            <div key={l} className="bg-ink-900/55 px-5 py-4">
              <div className="font-black text-white text-2xl tracking-tight">{n}</div>
              <div className="font-mono text-[10px] tracking-wider uppercase text-white/60 mt-1">{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll cue */}
      <div className="stage-fade absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/55 text-[11px] font-mono tracking-widest scroll-cue" style={{transitionDelay:'2.1s'}}>
        <span>SCROLL TO BROWSE</span>
        <svg width="14" height="20" viewBox="0 0 14 20" fill="none"><path d="M7 1v15m0 0l-5-5m5 5l5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
      </div>
    </section>
  );
}

/* Sticky search slides down once hero is past */
function StickySearch() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.7);
    window.addEventListener('scroll', onScroll, { passive:true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <div className={`sticky-search ${visible?'visible':''}`}>
      <div className="mx-auto max-w-[1400px] px-6 lg:px-10 py-2.5">
        <div className="rounded-xl bg-ink-900/85 border border-white/10 backdrop-blur-xl p-1.5 flex items-center gap-1.5 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.7)]">
          <div className="flex items-center gap-2 px-3 h-10 flex-1 rounded-lg bg-white/5 border border-white/10">
            <Icon name="search" className="w-4 h-4 text-white/60"/>
            <input className="bg-transparent flex-1 text-white placeholder-white/40 outline-none text-sm" placeholder="Search Toyota Corolla, Honda City…"/>
          </div>
          <select className="hidden md:block appearance-none px-3 h-10 rounded-lg bg-white/5 border border-white/10 text-white text-sm">
            {['Karachi','Lahore','Islamabad','Rawalpindi','Faisalabad','Multan'].map(c=> <option key={c} className="bg-ink-900">{c}</option>)}
          </select>
          <select className="hidden md:block appearance-none px-3 h-10 rounded-lg bg-white/5 border border-white/10 text-white text-sm">
            <option className="bg-ink-900">Any budget</option>
            <option className="bg-ink-900">Under 15L</option>
            <option className="bg-ink-900">Under 30L</option>
            <option className="bg-ink-900">30–60L</option>
            <option className="bg-ink-900">60L–1Cr</option>
          </select>
          <button className="btn-primary h-10 px-4 rounded-lg text-white text-sm font-semibold">Search</button>
        </div>
      </div>
    </div>
  );
}

/* Ambient driving SVG car */
function DrivingCar({ delay = 0, scale = 1 }) {
  return (
    <svg className="drive-car" style={{animationDelay: `${delay}s`, width: 220*scale}} viewBox="0 0 220 80" fill="none">
      <ellipse cx="110" cy="74" rx="90" ry="4" fill="rgba(37,99,235,0.25)"/>
      <path d="M14,52 L24,32 Q36,18 56,15 L150,15 Q172,18 188,32 L206,52 Q206,62 196,64 L24,64 Q14,62 14,52 Z" fill="#0a0e1a" stroke="rgba(96,165,250,0.45)" strokeWidth="1"/>
      <path d="M40,32 Q54,20 70,17 L142,17 Q160,20 174,32 L160,32 Q150,24 138,22 L74,22 Q60,24 52,32 Z" fill="rgba(37,99,235,0.55)"/>
      <ellipse cx="200" cy="44" rx="6" ry="2.5" fill="#fff"/>
      <ellipse cx="22" cy="44" rx="3" ry="2" fill="#ef4444"/>
      <circle className="wheel" cx="56" cy="62" r="11" fill="#05070d"/>
      <circle cx="56" cy="62" r="6" fill="#1a2238"/>
      <rect x="55" y="52" width="2" height="20" fill="#2a3450" className="wheel"/>
      <circle className="wheel" cx="164" cy="62" r="11" fill="#05070d"/>
      <circle cx="164" cy="62" r="6" fill="#1a2238"/>
      <rect x="163" y="52" width="2" height="20" fill="#2a3450" className="wheel"/>
    </svg>
  );
}

/* ============================================================
   WHY AUTOMART — scroll-pinned, video center, cards crossfade
   ============================================================ */
const WHY_CARDS = [
  {
    pill: 'REASON 01 / VERIFIED',
    title: ['Every seller, ', {it:'verified by hand'}, '.'],
    body: 'CNIC + biometric selfie. Manually approved by our trust team in under 24 hours. No bots. No fake numbers. No "uncle from Lahore" with a stolen photo.',
    stat: { n: '100%', l: 'sellers ID-verified' },
    icon: 'shield',
  },
  {
    pill: 'REASON 02 / FAIR PRICE',
    title: ['AI tells you ', {it:'if it’s a deal'}, '.'],
    body: 'Every listing is cross-checked against 240,000+ recent transactions. You see whether the asking price is below, fair, or above market — with the reasoning, in plain English or Urdu.',
    stat: { n: '240k+', l: 'sale records · daily retrain' },
    icon: 'sparkle',
  },
  {
    pill: 'REASON 03 / ON THE RECORD',
    title: ['Offers happen ', {it:'inside the chat'}, '.'],
    body: 'No screenshots. No "sir aap ne kaha tha 18 lakh." Make Offer, Counter, Accept, Reject — structured cards that become permanent receipts of the deal.',
    stat: { n: '0', l: 'he-said-she-said disputes' },
    icon: 'chat',
  },
  {
    pill: 'REASON 04 / INSPECTION',
    title: ['Trained mechanics, ', {it:'on demand'}, '.'],
    body: 'Schedule a third-party inspection from the listing page. 280-point check, photographed, signed, and delivered as a PDF — before you transfer a single rupee.',
    stat: { n: '24h', l: 'median inspection turnaround' },
    icon: 'wrench',
  },
  {
    pill: 'REASON 05 / SAFETY NET',
    title: ['One strike. ', {it:'You’re out.'}],
    body: 'Fake listing? Permanent ban. Unpaid commission? Permanent ban. Verified buyer disputes are mediated by our team — and platform fees are refunded if a deal goes bad.',
    stat: { n: '4.92', l: 'avg buyer satisfaction · 8,200+ deals' },
    icon: 'gavel',
  },
];

function WhyAutoMart() {
  const sectionRef = useRef(null);
  const [active, setActive] = useState(0);
  const [segP, setSegP] = useState(0); // 0..1 within current step
  const total = WHY_CARDS.length;

  // Only the center pane plays — left/right echoes are static frames.
  useEffect(() => {
    const vids = Array.from(document.querySelectorAll('.why-pin .why-pane.center video'));
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) vids.forEach(v => v.play().catch(()=>{}));
        else vids.forEach(v => v.pause());
      });
    }, { threshold: 0.05 });
    if (sectionRef.current) io.observe(sectionRef.current);
    return () => io.disconnect();
  }, []);

  // rAF-throttled scroll handler — only setState when values actually change
  useEffect(() => {
    let ticking = false;
    let lastIdx = -1, lastP = -1;
    const compute = () => {
      ticking = false;
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const totalScroll = el.offsetHeight - vh;
      const passed = Math.min(Math.max(-rect.top, 0), totalScroll);
      const progress = totalScroll > 0 ? passed / totalScroll : 0;
      const exact = progress * total;
      const idx = Math.min(total - 1, Math.floor(exact * 0.999));
      const p = Math.min(1, Math.max(0, exact - idx));
      if (idx !== lastIdx) { lastIdx = idx; setActive(idx); }
      // Quantize segP to 5% steps to avoid render storms
      const pq = Math.round(p * 20) / 20;
      if (pq !== lastP) { lastP = pq; setSegP(pq); }
    };
    const onScroll = () => {
      if (!ticking) { ticking = true; requestAnimationFrame(compute); }
    };
    window.addEventListener('scroll', onScroll, { passive:true });
    compute();
    return () => window.removeEventListener('scroll', onScroll);
  }, [total]);

  const sectionStyle = { height: `${(total * 0.35 + 0.3) * 100}vh` };
  const card = WHY_CARDS[active];

  // Word-by-word reveal — re-key on active so it replays
  const headlineWords = useMemo(() => {
    const out = [];
    card.title.forEach((part, i) => {
      const text = typeof part === 'string' ? part : part.it;
      const italic = typeof part !== 'string';
      text.split(/(\s+)/).forEach((w, j) => {
        if (!w) return;
        if (/^\s+$/.test(w)) { out.push({sp:true}); return; }
        out.push({ w, italic });
      });
    });
    return out;
  }, [card]);

  // Body words for staggered reveal
  const bodyWords = useMemo(() => card.body.split(' '), [card]);

  return (
    <section ref={sectionRef} data-screen-label="02 Why" className="why-section" style={sectionStyle} data-step={active}>
      <div className="why-pin">
        {/* Atmospheric backdrop — CSS gradient (perf) */}
        <div className="why-bg-css"/>
        <div className="why-grade"/>

        {/* Bokeh dots */}
        {[...Array(8)].map((_,i) => (
          <span key={i} className="bokeh"
            style={{
              left: `${10 + i*11}%`,
              bottom: '-10%',
              width: 14 + (i%3)*8,
              height: 14 + (i%3)*8,
              animationDelay: `${-i*2}s`,
              animationDuration: `${16 + (i%4)*3}s`,
            }}
          />
        ))}

        <div className="why-floor"/>

        {/* SECTION HEADER */}
        <div className="absolute top-0 inset-x-0 pt-24 lg:pt-28 px-6 lg:px-10 z-30 pointer-events-none">
          <div className="max-w-[1400px] mx-auto flex items-end justify-between flex-wrap gap-4">
            <div>
              <div className="font-mono text-[11px] tracking-[0.22em] text-brand-400 uppercase">/ why automart</div>
              <h2 className="font-bold text-white text-3xl md:text-4xl xl:text-5xl mt-2 tracking-[-0.02em] leading-[1.05]">
                Five reasons. <span className="font-serif italic font-normal text-brand-300">No competition.</span>
              </h2>
            </div>
            <div className="font-mono text-[11px] tracking-widest text-white/55">
              {String(active+1).padStart(2,'0')} <span className="text-white/25">/ {String(total).padStart(2,'0')}</span> &nbsp;·&nbsp; KEEP SCROLLING
            </div>
          </div>
        </div>

        {/* 3D STAGE — three video panes */}
        <div className="absolute inset-0 why-stage z-10">
          <div className="why-display absolute inset-0">
            {/* left echo — poster image (no extra video decoder) */}
            <div className="why-pane left">
              <img src="media/why-bmw-poster.jpg" alt="" loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover"/>
              <div className="scrim"/>
            </div>
            {/* center hero pane — the only active video */}
            <div className="why-pane center">
              <video src="media/why-bmw.mp4" autoPlay loop muted playsInline preload="auto" poster="media/why-bmw-poster.jpg"/>
              <div className="scrim"/>
            </div>
            {/* right echo — poster image */}
            <div className="why-pane right">
              <img src="media/why-bmw-poster.jpg" alt="" loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover"/>
              <div className="scrim"/>
            </div>
          </div>
        </div>

        {/* EDITORIAL COPY — flanks the center video, never overlaps */}
        <div className="absolute inset-x-0 bottom-0 pb-20 lg:pb-24 px-6 lg:px-10 z-20 pointer-events-none">
          <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_clamp(280px,24vw,360px)_minmax(0,1fr)] items-end gap-8">
            {/* LEFT: pill + headline + body */}
            <div className="why-copy pointer-events-auto" key={'l'+active}>
              <div className="font-mono text-[11px] tracking-[0.22em] text-brand-300 uppercase mb-3">
                {card.pill}
              </div>
              <h3 className="why-headline text-white font-bold text-3xl md:text-4xl xl:text-[44px] tracking-[-0.025em] leading-[1.05] max-w-[18ch]">
                {headlineWords.map((part, i) => part.sp
                  ? <span key={i}>&nbsp;</span>
                  : <span
                      key={i}
                      className={`word2 ${part.italic ? 'font-serif italic font-normal text-brand-300' : ''}`}
                      style={{animationDelay: `${i*0.06}s`, fontSize: part.italic ? '1.05em' : undefined}}
                    >{part.w}</span>
                )}
              </h3>
              <p className="text-white/85 text-[14px] md:text-[15px] leading-relaxed mt-5 max-w-[40ch]">
                {bodyWords.map((w, i) => (
                  <span key={i} className="word2 inline-block" style={{animationDelay: `${0.4 + i*0.012}s`}}>
                    {w}{i < bodyWords.length-1 ? '\u00A0' : ''}
                  </span>
                ))}
              </p>
            </div>

            {/* CENTER: empty spacer reserving room for video */}
            <div aria-hidden className="hidden lg:block"/>

            {/* RIGHT: hero stat + icon */}
            <div className="why-copy pointer-events-auto lg:text-right" key={'r'+active}>
              <div className={`flex items-end gap-5 lg:justify-end`}>
                <div className="lg:order-2">
                  <div className="font-mono text-[10px] tracking-widest uppercase text-white/55">{card.stat.l}</div>
                  <div className="font-black text-white text-5xl xl:text-6xl tracking-[-0.03em] mt-1 leading-none">{card.stat.n}</div>
                </div>
                <div className="lg:order-1 w-12 h-12 rounded-xl bg-brand-600/25 border border-brand-500/40 flex items-center justify-center text-brand-200 flex-shrink-0">
                  <Icon name={card.icon} className="w-5 h-5"/>
                </div>
              </div>
            </div>
          </div>

          {/* Step rail */}
          <div className="max-w-[1400px] mx-auto mt-10 pointer-events-auto">
            <div className="why-steps">
              {WHY_CARDS.map((c,i) => {
                const cls = i < active ? 'done' : i === active ? 'active' : '';
                return (
                  <div key={i}>
                    <div className={`seg ${cls}`} style={i===active ? {'--p': segP} : {}}>
                      <div className="fill"/>
                    </div>
                    <div className={`label ${i===active?'active':''}`}>0{i+1} · {flatTitle(c.title).replace(/[.,]/g,'').split(' ').slice(0,3).join(' ')}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
function flatTitle(parts) {
  return parts.map(p => typeof p === 'string' ? p : p.it).join('');
}

/* ============================================================
   Filter chip marquee
   ============================================================ */
function ChipsMarquee() {
  const filters = [
    {k:'price', t:'Under 30 Lakh'},
    {k:'trans', t:'Automatic only'},
    {k:'city', t:'Karachi'},
    {k:'make', t:'Toyota'},
    {k:'verified', t:'✓ Verified sellers', live:true},
    {k:'fuel', t:'Petrol'},
    {k:'year', t:'2018 or newer'},
    {k:'body', t:'Sedan'},
    {k:'mileage', t:'< 80,000 km'},
    {k:'assembly', t:'Local assembled'},
    {k:'owner', t:'1st owner'},
    {k:'price', t:'Under 1 Crore'},
    {k:'make', t:'Honda'},
    {k:'city', t:'Lahore'},
    {k:'condition', t:'Excellent'},
    {k:'body', t:'Hatchback'},
    {k:'fuel', t:'Hybrid'},
    {k:'price', t:'15L – 25L'},
    {k:'make', t:'Suzuki'},
    {k:'verified', t:'AI price-checked', live:true},
  ];
  const row1 = [...filters, ...filters];
  const row2 = [...filters.slice().reverse(), ...filters.slice().reverse()];
  return (
    <section className="ticker-bar py-8">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 mb-6 flex items-end justify-between">
        <div>
          <div className="font-mono text-[11px] tracking-[0.2em] text-brand-400 uppercase">/ live filters</div>
          <h2 className="text-white font-bold text-2xl mt-1">Find exactly what you want</h2>
        </div>
        <div className="text-white/50 text-sm">8,420 results match your defaults</div>
      </div>
      <div className="marquee-mask space-y-3">
        <div className="marquee">
          {row1.map((f,i) => <Chip key={i} f={f}/>)}
        </div>
        <div className="marquee reverse">
          {row2.map((f,i) => <Chip key={i} f={f}/>)}
        </div>
      </div>
    </section>
  );
}
function Chip({f}) {
  return (
    <span className={`chip ${f.live ? 'live' : ''}`}>
      {f.live && <span className="pulse-dot" style={{background:'#60a5fa'}}/>}
      {f.t}
    </span>
  );
}

/* ============================================================
   Featured listings
   ============================================================ */
const LISTINGS = [
  {
    id:1, title:'Toyota Corolla Altis Grande', year:2022, km:'34,000 km', city:'Karachi',
    price:'58,50,000', verified:true, ai:'fair', body:'Sedan', trans:'Auto', fuel:'Hybrid',
    tag:'Editor\u2019s pick', img:'media/toyota-corolla.png', accent:'#dc2626',
  },
  {
    id:2, title:'BMW 5 Series 530d xDrive', year:2022, km:'42,000 km', city:'Lahore',
    price:'2,85,00,000', verified:true, ai:'below', body:'Sedan', trans:'Auto', fuel:'Diesel',
    tag:'Hot deal', img:'media/bmw-530d.jpg', accent:'#0ea5e9', objectPosition:'center 28%',
  },
  {
    id:3, title:'Mercedes-AMG GT 63 S', year:2023, km:'12,500 km', city:'Islamabad',
    price:'7,90,00,000', verified:true, ai:'fair', body:'Coupe', trans:'Auto', fuel:'Petrol',
    tag:'Performance', img:'media/mercedes-amg-gt.jpg', accent:'#22c55e',
  },
  {
    id:4, title:'Audi A6 C6 3.0 TDI', year:2010, km:'1,12,000 km', city:'Rawalpindi',
    price:'48,50,000', verified:false, ai:'below', body:'Sedan', trans:'Auto', fuel:'Diesel',
    tag:'Classic', img:'media/audi-a6.png', accent:'#94a3b8',
  },
];
function transformListing(l) {
  const pkr = (l.price_minor || 0) / 100;
  return {
    id: l.id,
    title: `${l.year} ${l.make} ${l.model}${l.variant ? ' ' + l.variant : ''}`,
    year: l.year, km: `${(l.mileage||0).toLocaleString('en-PK')} km`,
    city: l.city || '', price: pkr >= 100000 ? (pkr/100000).toFixed(1)+'L' : pkr.toLocaleString('en-PK'),
    verified: false, ai: 'fair', body: l.body_type || 'Sedan',
    trans: l.transmission || 'Auto', fuel: l.fuel_type || 'Petrol',
    tag: null, img: l.primary_photo_url || null, accent: '#2563eb',
  };
}
function FeaturedListings() {
  const [listings, setListings] = useState(LISTINGS);
  useEffect(() => {
    const p = window._featuredListingsPromise;
    if (p) p.then(data => { if (data?.length) setListings(data.map(transformListing)); });
  }, []);
  return (
    <section data-screen-label="03 Featured" className="bg-paper-50 text-ink-900 py-28 relative overflow-hidden">
      {/* decorative bg */}
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-brand-500/5 blur-3xl pointer-events-none"/>
      <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-emerald-500/5 blur-3xl pointer-events-none"/>

      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 relative">
        <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
          <div>
            <div className="font-mono text-[11px] tracking-[0.2em] text-brand-600 uppercase">/ featured today</div>
            <h2 className="text-ink-900 font-bold text-4xl md:text-5xl mt-2 tracking-[-0.02em] leading-[1.05]">
              Hand-picked, <span className="font-serif italic font-normal text-brand-600">AI price-checked</span>.
            </h2>
            <p className="text-ink-700/65 mt-3 max-w-[60ch] leading-relaxed">Every listing is reviewed in 24 hours. Sellers who fail our checks never make it to the feed.</p>
          </div>
          <a href="#" className="group inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-ink-900 text-white text-sm font-semibold hover:bg-ink-800 transition">
            See all 12,438 listings
            <Icon name="arrow-right" className="w-4 h-4 group-hover:translate-x-0.5 transition-transform"/>
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 perspective">
          {listings.map(l => <ListingCard key={l.id} l={l}/>)}
        </div>
      </div>
    </section>
  );
}

function ListingCard({l}) {
  const aiMap = {
    below: { label:'Below market', bg:'bg-emerald-500', text:'text-white', soft:'bg-emerald-50 text-emerald-700' },
    fair:  { label:'Fair price', bg:'bg-brand-600', text:'text-white', soft:'bg-blue-50 text-blue-700' },
    above: { label:'Above market', bg:'bg-amber-500', text:'text-white', soft:'bg-amber-50 text-amber-700' },
  }[l.ai];
  return (
    <article
      className="group relative bg-white rounded-[22px] border border-paper-200 overflow-hidden transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_30px_60px_-25px_rgba(15,23,42,0.35)] hover:border-paper-200/60"
      style={{'--accent': l.accent}}
    >
      {/* IMAGE */}
      <div className="relative aspect-[4/3] overflow-hidden bg-ink-900">
        <img
          src={l.img}
          alt={l.title}
          loading="lazy"
          style={{objectPosition: l.objectPosition || 'center'}}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(.2,.8,.2,1)] group-hover:scale-[1.06]"
        />
        {/* subtle gradient for image readability only */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent"/>
        {/* photo count, bottom-right only */}
        <span className="absolute bottom-3 right-3 z-10 inline-flex items-center gap-1 px-2 h-7 rounded-full bg-black/55 backdrop-blur text-white text-[10px] font-mono tracking-wider">
          <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3"><rect x="3" y="6" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="13" r="3" stroke="currentColor" strokeWidth="1.8"/><path d="M8 6l1.5-2h5L16 6" stroke="currentColor" strokeWidth="1.8"/></svg>
          12
        </span>
      </div>

      {/* INFO */}
      <div className="p-5">
        {/* Top row: tag + verified moved here */}
        <div className="flex items-center justify-between gap-2 mb-3">
          {l.tag ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 h-6 rounded-full bg-paper-100 text-ink-900 text-[10px] font-bold tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full" style={{background:l.accent}}/>
              {l.tag}
            </span>
          ) : <span/>}
          {l.verified ? (
            <span className="inline-flex items-center gap-1 px-2 h-6 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold tracking-wider">
              <Icon name="check" className="w-3 h-3"/> VERIFIED
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 h-6 rounded-full bg-paper-100 text-ink-700/60 text-[10px] font-bold tracking-wider">
              UNVERIFIED
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono tracking-[0.18em] text-ink-700/45 uppercase mb-1.5">
          <span>{l.year}</span><span className="text-paper-200">·</span>
          <span>{l.body}</span><span className="text-paper-200">·</span>
          <span>{l.trans}</span>
        </div>
        <h3 className="text-ink-900 font-bold text-[17px] tracking-tight leading-tight truncate">{l.title}</h3>

        {/* Price + AI insight inline */}
        <div className="mt-4 flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-[10px] text-ink-700/50 tracking-wider">PKR</span>
            <span className="font-black text-[24px] tracking-[-0.02em] leading-none" style={{color:'#1d4ed8'}}>{l.price}</span>
          </div>
          <span className={`inline-flex items-center gap-1 px-2 h-6 rounded-full ${aiMap.soft} text-[10px] font-bold tracking-wider`}>
            <Icon name="sparkle" className="w-3 h-3"/>
            {aiMap.label.toUpperCase()}
          </span>
        </div>

        {/* Spec strip */}
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          {[
            ['pin', l.city],
            ['gauge', l.km],
            ['fuel', l.fuel],
          ].map(([icon, val]) => (
            <div key={icon} className="rounded-lg bg-paper-50 border border-paper-200/60 py-2 px-1">
              <Icon name={icon} className="w-3.5 h-3.5 text-ink-700/55 mx-auto"/>
              <div className="text-[11px] font-semibold text-ink-900 mt-1 truncate">{val}</div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button className="mt-4 w-full h-10 rounded-xl bg-ink-900 text-white text-sm font-semibold flex items-center justify-center gap-1.5 group/btn hover:bg-brand-600 transition-colors">
          View details
          <Icon name="arrow-right" className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform"/>
        </button>
      </div>

      {/* accent line */}
      <span
        className="absolute left-0 right-0 bottom-0 h-[3px] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"
        style={{background:`linear-gradient(90deg, ${l.accent}, transparent)`}}
      />
    </article>
  );
}

/* ============================================================
   AI Price Insight
   ============================================================ */
// Plays a video clipped to [start, end] and loops just that window.
function LoopVideo({ src, start = 0, end, className, style }) {
  const ref = useRef(null);
  useEffect(() => {
    const v = ref.current; if (!v) return;
    let inView = true;
    const goStart = () => { try { v.currentTime = start; } catch(e){} };
    const tryPlay = () => { if (inView) v.play().catch(()=>{}); };
    const onLoaded = () => { goStart(); tryPlay(); };
    const onCanPlay = () => { tryPlay(); };
    const onTime = () => {
      const stop = (end ?? v.duration) - 0.05;
      if (v.currentTime >= stop || v.currentTime < start - 0.1) { goStart(); tryPlay(); }
    };
    v.addEventListener('loadedmetadata', onLoaded);
    v.addEventListener('canplay', onCanPlay);
    v.addEventListener('timeupdate', onTime);
    if (v.readyState >= 1) onLoaded();
    const io = new IntersectionObserver(([e]) => {
      inView = e.isIntersecting;
      if (inView) tryPlay();
      else v.pause();
    }, { threshold: 0.01 });
    io.observe(v);
    return () => {
      v.removeEventListener('loadedmetadata', onLoaded);
      v.removeEventListener('canplay', onCanPlay);
      v.removeEventListener('timeupdate', onTime);
      io.disconnect();
    };
  }, [src, start, end]);
  return (
    <video
      ref={ref}
      src={src}
      autoPlay muted playsInline preload="auto"
      className={className}
      style={style}
    />
  );
}

function AIPriceInsight() {
  const sectionRef = useRef(null);
  const [progress, setProgress] = useState(0); // 0..1 across whole section
  const STEPS = [
    {
      kicker: 'Step 01 · Vehicle scan',
      title: 'Scanning the vehicle.',
      body: 'We read the photos, registration, and trim — automatically. No forms to fill, no guessing.',
      chips: ['Body: Sedan', 'Trim: 530d xDrive', 'Year: 2022', 'Mileage: 42,000 km', 'Engine: 3.0L I6', 'Color: Frozen Grey'],
    },
    {
      kicker: 'Step 02 · Market comparison',
      title: 'Compared to 240,000+ recent deals.',
      body: 'Live transactions across 68 Pakistani cities — weighted by trim, year, mileage band, and assembly.',
      chips: ['Karachi · 12 deals', 'Lahore · 9 deals', 'Islamabad · 7 deals', 'Median: 2,98,00,000', 'Range: 2.6Cr–3.4Cr'],
    },
    {
      kicker: 'Step 03 · Condition adjustments',
      title: 'Mileage, ownership, and docs factored in.',
      body: 'Lower mileage, single ownership, complete file — each adjusts the fair-value band by a precise margin.',
      chips: ['Mileage −12% vs median', '1st owner +3%', 'Complete docs +2%', 'Imported (CBU) +5%'],
    },
    {
      kicker: 'Step 04 · Verdict',
      title: 'Below market — strong deal.',
      body: 'Verified, explained, and dated. Make a structured offer right from the listing — every step recorded.',
      chips: ['Listed: 2,85,00,000', 'Fair: 2,98,00,000', '−4.4% below median', 'Confidence: 94%'],
    },
  ];
  useEffect(() => {
    const onScroll = () => {
      const el = sectionRef.current; if (!el) return;
      const r = el.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      const p = Math.max(0, Math.min(1, -r.top / total));
      setProgress(p);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive:true });
    window.addEventListener('resize', onScroll);
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); };
  }, []);
  const segs = STEPS.length;
  const seg = Math.min(segs - 1, Math.floor(progress * segs * 0.999));
  const within = Math.max(0, Math.min(1, progress * segs - seg));
  const step = STEPS[seg];

  // gauge progress: 0 → 0.36 (below)
  const gaugeP = 0.10 + Math.min(progress, 1) * 0.30;
  const verdictOn = seg === 3;

  return (
    <section
      ref={sectionRef}
      data-screen-label="04 AI Insight"
      className="relative text-white"
      style={{ height: `${segs * 90 + 30}vh`, background: 'radial-gradient(ellipse 70% 55% at 28% 35%, #0d1b2e 0%, #070d18 45%, #03060c 100%)' }}
    >
      {/* atmosphere — cool AI-scanner tones to match the dark-blue sedan */}
      <div className="absolute inset-0 pointer-events-none cta-grid opacity-[0.14]"/>
      <div className="absolute inset-0 pointer-events-none" style={{background:'radial-gradient(ellipse 55% 40% at 28% 55%, rgba(56,189,248,0.18), transparent 70%), radial-gradient(ellipse 50% 35% at 80% 80%, rgba(37,99,235,0.20), transparent 70%)'}}/>

      <div className="sticky top-0 h-screen overflow-hidden">
        {/* pinned title bar */}
        <div className="absolute top-6 left-0 right-0 z-30 px-6 lg:px-10 flex items-center justify-between text-white/70">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-600/20 border border-brand-500/40 flex items-center justify-center">
              <Icon name="sparkle" className="w-4 h-4 text-brand-400"/>
            </div>
            <div>
              <div className="font-mono text-[10px] tracking-[0.22em] text-brand-400 uppercase">/ ai price insight</div>
              <div className="font-semibold text-white text-sm mt-0.5">Know if a price is fair — in 0.4s.</div>
            </div>
          </div>
          <div className="font-mono text-[11px] tracking-[0.22em] text-white/50">
            <span className="text-white">{String(seg+1).padStart(2,'0')}</span>
            <span className="text-white/30"> / {String(segs).padStart(2,'0')}</span>
            <span className="ml-3 hidden md:inline text-white/40">KEEP SCROLLING</span>
          </div>
        </div>

        <div className="absolute inset-0 grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-10 items-center px-6 lg:px-12 pt-24 pb-20 max-w-[1500px] mx-auto">
          {/* LEFT: BMW video stage */}
          <div className="relative h-full flex items-center justify-center">
            {/* blueprint backdrop */}
            <div className="absolute inset-6 rounded-[28px] border border-white/10 overflow-hidden"
                 style={{background:
                   'linear-gradient(180deg, rgba(13,27,46,0.85), rgba(3,6,12,0.95)),'+
                   'radial-gradient(ellipse 70% 50% at 50% 100%, rgba(56,189,248,0.28), transparent 70%)'
                 }}>
              <div className="absolute inset-0 opacity-30"
                   style={{backgroundImage:'linear-gradient(rgba(125,211,252,0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(125,211,252,0.16) 1px, transparent 1px)', backgroundSize:'48px 48px', maskImage:'radial-gradient(ellipse 70% 60% at 50% 50%, black, transparent)'}}/>
            </div>
            {/* glow rings */}
            <div className="absolute w-[80%] aspect-square rounded-full" style={{background:'radial-gradient(circle, rgba(56,189,248,0.22), transparent 60%)', filter:'blur(40px)'}}/>
            {/* Video frame — wider crop to fit the side-profile sedan */}
            <div className="relative w-[92%] max-w-[620px] aspect-[5/4] rounded-[24px] overflow-hidden border border-white/15 shadow-[0_40px_120px_-30px_rgba(56,189,248,0.45),inset_0_1px_0_rgba(255,255,255,0.1)]"
                 style={{background:'radial-gradient(ellipse 75% 55% at 50% 60%, #0a1628 0%, #03060c 75%)'}}>
              <video
                src="media/price-insight.mp4"
                autoPlay loop muted playsInline preload="auto"
                className="absolute inset-0 w-full h-full object-contain"
                style={{ transform:'scale(0.92)' }}
              />
              {/* watermark mask — heavy bottom gradient to hide any leftover stock watermark */}
              <div className="absolute left-0 right-0 bottom-0 h-[24%]" style={{background:'linear-gradient(180deg, transparent 0%, rgba(3,6,12,0.55) 50%, rgba(3,6,12,0.95) 100%)'}}/>
              {/* top vignette */}
              <div className="absolute inset-0 pointer-events-none" style={{background:'linear-gradient(180deg, rgba(3,6,12,0.45) 0%, transparent 25%, transparent 70%, rgba(3,6,12,0.6) 100%)'}}/>
              {/* corner badges */}
              <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-black/55 backdrop-blur-md border border-white/15 text-[10px] font-mono tracking-[0.18em] text-white/85">
                <span className="pulse-dot" style={{background:'#38bdf8'}}/> SUBJECT VEHICLE
              </div>
              <div className="absolute top-3 right-3 inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-black/55 backdrop-blur-md border border-white/15 text-[10px] font-mono tracking-[0.18em] text-white/85">
                LIVE 360°
              </div>
              {/* AutoMart corner stamp covering watermark area */}
              <div className="absolute right-3 bottom-3 z-10 inline-flex items-center gap-2 h-7 px-2.5 rounded-full bg-black/70 backdrop-blur-md border border-white/15">
                <div className="w-4 h-4 rounded-sm bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
                  <span className="text-white text-[8px] font-black">A</span>
                </div>
                <span className="font-mono text-[10px] tracking-[0.2em] text-white/85">AUTOMART · ANALYZING</span>
              </div>
              {/* scanning line — cyan, matches AI-scanner theme */}
              <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-300 to-transparent" style={{top:`${20 + (within*60)}%`, boxShadow:'0 0 24px rgba(103,232,249,0.7)'}}/>
              {/* corner brackets */}
              {[['tl','top-3 left-3'],['tr','top-3 right-3'],['bl','bottom-3 left-3'],['br','bottom-3 right-3']].map(([k]) => (
                <span key={k} className={`absolute w-5 h-5 border-cyan-300/70 ${k==='tl'?'top-2 left-2 border-t-2 border-l-2':k==='tr'?'top-2 right-2 border-t-2 border-r-2':k==='bl'?'bottom-2 left-2 border-b-2 border-l-2':'bottom-2 right-2 border-b-2 border-r-2'}`}/>
              ))}
            </div>
            {/* floor reflection */}
            <div className="absolute left-1/2 -translate-x-1/2 bottom-[8%] w-[60%] h-16 rounded-[100%]" style={{background:'radial-gradient(ellipse, rgba(56,189,248,0.45), transparent 70%)', filter:'blur(20px)'}}/>
          </div>

          {/* RIGHT: scroll-driven content */}
          <div className="relative">
            <div className="font-mono text-[10px] tracking-[0.22em] text-brand-400 uppercase mb-3">{step.kicker}</div>
            <h2 key={`t-${seg}`} className="font-bold text-4xl md:text-5xl tracking-[-0.02em] leading-[1.05]" style={{animation:'revealUp 0.7s cubic-bezier(.22,.7,.2,1) both'}}>
              {step.title.split(' ').map((w,i) => (
                <span key={i} className="inline-block mr-[0.25em]" style={{animation:`revealUp 0.6s cubic-bezier(.22,.7,.2,1) ${i*0.04}s both`, filter:'blur(0)'}}>{w}</span>
              ))}
            </h2>
            <p key={`b-${seg}`} className="text-white/70 mt-5 text-lg max-w-[52ch] leading-relaxed" style={{animation:'revealUp 0.7s cubic-bezier(.22,.7,.2,1) 0.15s both'}}>{step.body}</p>

            {/* chips */}
            <div key={`c-${seg}`} className="mt-7 flex flex-wrap gap-2">
              {step.chips.map((c,i) => (
                <span key={c} className="inline-flex items-center gap-2 h-9 px-3.5 rounded-full bg-white/5 border border-white/10 backdrop-blur text-[12px] font-medium text-white/85"
                  style={{animation:`revealUp 0.5s cubic-bezier(.22,.7,.2,1) ${0.2 + i*0.05}s both`}}>
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-400"/>{c}
                </span>
              ))}
            </div>

            {/* gauge — always visible, fills with progress */}
            <div className="mt-10 rounded-2xl bg-white/5 border border-white/10 backdrop-blur p-5">
              <div className="flex items-center justify-between text-sm mb-3">
                <div>
                  <div className="text-white/55 text-[10px] font-mono tracking-[0.18em] uppercase">This listing</div>
                  <div className="text-white font-black text-2xl mt-0.5 tracking-tight">PKR 2,85,00,000</div>
                </div>
                <div className="text-right">
                  <div className="text-white/55 text-[10px] font-mono tracking-[0.18em] uppercase">Market median</div>
                  <div className="text-white/85 font-bold text-xl mt-0.5">2,98,00,000</div>
                </div>
              </div>
              <div className="gauge" style={{'--p': gaugeP}}/>
              <div className="mt-2 flex justify-between text-[10px] font-mono tracking-[0.18em] text-white/50">
                <span>BELOW</span><span>FAIR</span><span>ABOVE</span>
              </div>
              <div className={`mt-4 inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-xs font-bold transition-all ${verdictOn?'bg-emerald-500/20 text-emerald-300':'bg-white/5 text-white/40'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${verdictOn?'bg-emerald-400':'bg-white/30'}`}/>
                {verdictOn?'4.4% below market — strong deal':'Calculating verdict…'}
              </div>
            </div>

            {/* progress rail */}
            <div className="mt-10">
              <div className="flex gap-1.5">
                {STEPS.map((s,i) => {
                  const filled = i < seg ? 1 : i === seg ? within : 0;
                  return (
                    <div key={i} className="flex-1 h-[3px] rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-brand-500 to-brand-400" style={{width:`${filled*100}%`, transition:'width 0.2s linear'}}/>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 grid grid-cols-4 gap-1.5 text-[10px] font-mono tracking-[0.18em] text-white/40">
                {['SCAN','MARKET','CONDITION','VERDICT'].map((l,i) => (
                  <div key={l} className={`truncate ${i===seg?'text-brand-400':''}`}>{l}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   How it works — Vertical TREE / LADDER, branches reveal on scroll
   ============================================================ */
function HowItWorks() {
  const sectionRef = useRef(null);
  const [trunkProgress, setTrunkProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const el = sectionRef.current; if (!el) return;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const start = vh * 0.7;
      const end = -r.height + vh * 0.4;
      const p = Math.max(0, Math.min(1, (start - r.top) / (start - end)));
      setTrunkProgress(p);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive:true });
    window.addEventListener('resize', onScroll);
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); };
  }, []);

  const branches = [
    {
      n:'01', kicker:'BROWSE & FILTER', t:'Find with confidence.',
      d:'Filter by trim, city, budget, transmission. Every car is photo-checked and price-scored before it hits your feed.',
      stat:['12,438','live verified listings'],
      side:'left',
      visual:'discover',
    },
    {
      n:'02', kicker:'STRUCTURED OFFERS', t:'Negotiate on the record.',
      d:'Make structured offers, counter, and accept inside the chat. No screenshots, no he-said-she-said, no awkward calls.',
      stat:['<6 min','median seller reply'],
      side:'right',
      visual:'negotiate',
    },
    {
      n:'03', kicker:'INSPECT & TRANSFER', t:'Drive away. Paperwork done.',
      d:'Schedule a third-party inspection. We pre-fill transfer documents. You collect the keys and drive home.',
      stat:['9 days','avg. time to close'],
      side:'left',
      visual:'driveaway',
    },
  ];

  return (
    <section
      ref={sectionRef}
      data-screen-label="05 How"
      className="relative bg-paper-50 text-ink-900 py-28 md:py-36 overflow-hidden"
    >
      {/* atmospheric bg */}
      <div className="absolute inset-0 pointer-events-none opacity-50"
           style={{backgroundImage:'radial-gradient(rgba(37,99,235,0.07) 1px, transparent 1px)', backgroundSize:'40px 40px', maskImage:'radial-gradient(ellipse 80% 80% at 50% 40%, black, transparent)'}}/>
      <div className="absolute -top-40 left-1/4 w-[700px] h-[700px] rounded-full pointer-events-none" style={{background:'radial-gradient(circle, rgba(37,99,235,0.08), transparent 65%)', filter:'blur(20px)'}}/>

      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 relative">
        {/* HEADING */}
        <div className="max-w-[760px] mx-auto text-center mb-20">
          <div className="font-mono text-[11px] tracking-[0.22em] text-brand-600 uppercase">/ how it works</div>
          <h2 className="font-bold text-4xl md:text-6xl mt-3 tracking-[-0.025em] leading-[1.02]">
            From a search bar{' '}
            <span className="font-serif italic font-normal text-brand-600">to keys in your hand.</span>
          </h2>
          <p className="text-ink-700/65 mt-5 text-lg leading-relaxed max-w-[58ch] mx-auto">
            Three branches grow out of every AutoMart deal. Discover, negotiate, drive away — each one on the record.
          </p>
        </div>

        {/* TREE */}
        <div className="relative max-w-[1100px] mx-auto pt-6">
          {/* TRUNK — runs down the center */}
          <div aria-hidden className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-[3px] z-0">
            {/* base track */}
            <div className="absolute inset-0 rounded-full bg-paper-200"/>
            {/* progress fill */}
            <div className="absolute left-0 right-0 top-0 rounded-full bg-gradient-to-b from-brand-500 via-brand-600 to-brand-700 transition-[height] duration-200"
                 style={{height: `${trunkProgress * 100}%`, boxShadow:'0 0 24px rgba(37,99,235,0.4)'}}/>
            {/* growing tip */}
            <div className="absolute left-1/2 -translate-x-1/2 transition-[top] duration-200"
                 style={{top: `${trunkProgress * 100}%`}}>
              <span className="block w-3 h-3 rounded-full bg-brand-600 -translate-y-1/2 shadow-[0_0_0_6px_rgba(37,99,235,0.18),0_0_24px_rgba(37,99,235,0.6)]"/>
            </div>
          </div>

          {/* SEED — top crown that "starts" the tree */}
          <div className="relative z-10 flex justify-center -mt-6 mb-12">
            <div className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-white border border-paper-200 shadow-[0_10px_30px_-10px_rgba(15,23,42,0.15)]">
              <span className="pulse-dot"/>
              <span className="font-mono text-[11px] tracking-[0.22em] uppercase text-ink-700/70">Start your search</span>
            </div>
          </div>

          {/* BRANCHES */}
          <div className="space-y-24 md:space-y-32 pb-20">
            {branches.map((b,i) => (
              <Branch key={b.n} b={b} i={i} totalProgress={trunkProgress}/>
            ))}
          </div>

          {/* ROOTS — bottom CTA */}
          <div className="relative z-10 flex justify-center pt-2">
            <div className="rounded-2xl bg-white border border-paper-200 shadow-[0_30px_60px_-20px_rgba(15,23,42,0.18)] px-6 py-5 flex items-center gap-4 flex-wrap justify-center">
              <div className="text-left">
                <div className="font-mono text-[11px] tracking-[0.22em] text-ink-700/50 uppercase">End of journey</div>
                <div className="font-bold text-ink-900">Ready to start yours?</div>
              </div>
              <button className="btn-primary h-11 px-5 rounded-xl font-semibold text-sm text-white inline-flex items-center gap-2">
                Browse 12,438 cars <Icon name="arrow-right" className="w-4 h-4"/>
              </button>
              <button className="h-11 px-5 rounded-xl font-semibold text-sm text-ink-900 border border-paper-200 bg-white hover:border-brand-300 hover:text-brand-600">
                List your car
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Branch({ b, i, totalProgress }) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) setInView(true);
    }, { threshold: 0.35 });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);

  const left = b.side === 'left';

  return (
    <div ref={ref} className="relative">
      {/* Horizontal branch line growing out from trunk */}
      <span aria-hidden
        className={`hidden md:block absolute top-[44px] h-[3px] bg-gradient-to-r transition-[width,opacity] duration-700 ease-out
          ${left
            ? 'right-1/2 from-transparent to-brand-600'
            : 'left-1/2 from-brand-600 to-transparent'}`}
        style={{ width: inView ? '46%' : '0%', opacity: inView ? 1 : 0 }}/>

      {/* Branch tip leaf — small dot at end of branch */}
      <span aria-hidden
        className={`hidden md:block absolute top-[44px] -translate-y-1/2 w-2 h-2 rounded-full bg-brand-600 transition-opacity duration-700
          ${left ? 'left-[4%]' : 'right-[4%]'}`}
        style={{ opacity: inView ? 1 : 0, transitionDelay: '0.5s', boxShadow:'0 0 0 4px rgba(37,99,235,0.15)' }}/>

      {/* Numeral node — sits on the trunk */}
      <div className="relative z-20 mx-auto -mb-4 md:mb-0 md:absolute md:left-1/2 md:top-0 md:-translate-x-1/2 w-[88px] h-[88px] rounded-full flex items-center justify-center">
        <span className={`relative w-[88px] h-[88px] rounded-full flex items-center justify-center font-black text-2xl tracking-tight transition-all duration-700 border-4 border-paper-50
          ${inView
            ? 'bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-[0_15px_40px_-10px_rgba(37,99,235,0.6)]'
            : 'bg-white text-ink-700/40 shadow-[0_8px_20px_-8px_rgba(15,23,42,0.12)]'}
        `}>
          {inView && <span className="absolute inset-0 rounded-full" style={{boxShadow:'0 0 0 8px rgba(37,99,235,0.12)'}}/>}
          {inView && <span className="absolute inset-0 rounded-full animate-ping" style={{background:'rgba(37,99,235,0.2)', animationDuration:'2.5s'}}/>}
          <span className="relative z-10">{b.n}</span>
        </span>
      </div>

      {/* TWO-COLUMN: copy on one side, floating fragments on the other */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center pt-8 md:pt-0">
        {/* COPY */}
        <div className={`${left ? 'md:order-1 md:text-right md:pr-20' : 'md:order-2 md:pl-20'}
          transition-all duration-700 ease-out`}
          style={{
            opacity: inView ? 1 : 0,
            transform: inView ? 'translateY(0)' : 'translateY(24px)',
            transitionDelay: '0.2s'
          }}>
          <div className="font-mono text-[11px] tracking-[0.22em] text-brand-600 uppercase">{b.kicker}</div>
          <h3 className="mt-2 font-bold text-3xl md:text-5xl tracking-[-0.025em] leading-[1.04]">
            {b.t}
          </h3>
          <p className="mt-4 text-ink-700/65 text-[17px] leading-relaxed max-w-[44ch] md:inline-block">
            {b.d}
          </p>
          <div className={`mt-7 inline-flex items-end gap-4 ${left ? 'md:flex-row-reverse' : ''}`}>
            <div>
              <div className="font-black text-3xl tracking-tight text-ink-900">{b.stat[0]}</div>
              <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink-700/50 mt-0.5">{b.stat[1]}</div>
            </div>
          </div>
        </div>

        {/* FLOATING FRAGMENTS */}
        <div className={`relative h-[380px] md:h-[420px] ${left ? 'md:order-2' : 'md:order-1'}
          transition-all duration-700 ease-out`}
          style={{
            opacity: inView ? 1 : 0,
            transform: inView ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.96)',
            transitionDelay: '0.35s'
          }}>
          {b.visual === 'discover' && <DiscoverFragments inView={inView}/>}
          {b.visual === 'negotiate' && <NegotiateFragments inView={inView}/>}
          {b.visual === 'driveaway' && <DriveAwayFragments inView={inView}/>}
        </div>
      </div>
    </div>
  );
}

function DiscoverFragments({ inView }) {
  return (
    <div className="absolute inset-0">
      <div className="absolute top-[2%] left-[2%] right-[6%] h-14 px-5 rounded-2xl bg-white shadow-[0_30px_60px_-20px_rgba(15,23,42,0.18)] border border-paper-200/70 flex items-center gap-3"
           style={{animation: inView ? 'revealUp 0.7s cubic-bezier(.22,.7,.2,1) 0.4s both' : 'none'}}>
        <Icon name="search" className="w-5 h-5 text-ink-700/50"/>
        <span className="text-[15px] text-ink-900 font-medium">Toyota Corolla Altis</span>
        <span className="inline-block w-[2px] h-4 bg-brand-600 align-middle" style={{animation:'blink 1s step-end infinite'}}/>
        <span className="ml-auto px-2.5 py-1 rounded-md bg-brand-600 text-white text-[11px] font-bold tracking-wide">8,420 results</span>
      </div>

      {[
        {t:'Toyota', x:'2%', y:'26%', d:0.55},
        {t:'Under 30L', x:'24%', y:'24%', d:0.65},
        {t:'Karachi', x:'48%', y:'27%', d:0.75},
        {t:'Automatic', x:'2%', y:'40%', d:0.85},
        {t:'✓ Verified', x:'30%', y:'42%', d:0.95, ok:true},
        {t:'2018+', x:'58%', y:'40%', d:1.05},
      ].map((c,k)=>(
        <span key={k} className={`absolute px-3 py-1.5 rounded-full text-[12px] font-semibold border shadow-sm ${c.ok?'bg-emerald-50 border-emerald-200 text-emerald-700':'bg-white border-paper-200 text-ink-900'}`}
              style={{left:c.x, top:c.y, animation: inView ? `revealUp 0.6s cubic-bezier(.22,.7,.2,1) ${c.d}s both` : 'none'}}>
          {c.t}
        </span>
      ))}

      {[
        {make:'Corolla Altis', yr:'2022', price:'58,50,000', x:'2%', y:'58%', d:0.9},
        {make:'Civic Oriel', yr:'2021', price:'72,00,000', x:'34%', y:'58%', d:1.05, hot:true},
        {make:'Yaris ATIV', yr:'2023', price:'48,80,000', x:'66%', y:'58%', d:1.2},
      ].map((r,k)=>(
        <div key={k} className="absolute w-[30%] rounded-2xl overflow-hidden bg-white shadow-[0_30px_60px_-20px_rgba(15,23,42,0.18)] border border-paper-200/70"
             style={{left:r.x, top:r.y, animation: inView ? `revealUp 0.7s cubic-bezier(.22,.7,.2,1) ${r.d}s both` : 'none'}}>
          <div className="aspect-[4/3] relative bg-gradient-to-br from-ink-700 to-ink-900">
            <svg viewBox="0 0 200 140" className="absolute inset-0 w-full h-full">
              <ellipse cx="100" cy="115" rx="80" ry="6" fill="rgba(37,99,235,0.3)"/>
              <path d="M30,100 L40,75 Q55,55 80,52 L120,52 Q145,55 160,75 L170,100 Q170,112 160,114 L40,114 Q30,112 30,100 Z" fill="#0a0e1a" stroke="rgba(96,165,250,0.4)"/>
              <path d="M55,75 Q70,58 88,55 L112,55 Q130,58 145,75" fill="#1d4ed8" opacity="0.5"/>
              <circle cx="60" cy="111" r="11" fill="#05070d"/>
              <circle cx="60" cy="111" r="6" fill="#1a2238"/>
              <circle cx="140" cy="111" r="11" fill="#05070d"/>
              <circle cx="140" cy="111" r="6" fill="#1a2238"/>
            </svg>
            {r.hot && <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-amber-500 text-white text-[10px] font-bold tracking-wide">HOT</span>}
            <span className="absolute top-2 right-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500 text-white text-[10px] font-bold tracking-wide">
              <Icon name="check" className="w-2.5 h-2.5"/>
            </span>
          </div>
          <div className="p-2.5">
            <div className="font-mono text-[9px] tracking-wider text-ink-700/50 uppercase">{r.yr}</div>
            <div className="font-bold text-[12px] text-ink-900 truncate">{r.make}</div>
            <div className="mt-1 text-brand-600 font-black text-sm tracking-tight">PKR {r.price}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function NegotiateFragments({ inView }) {
  return (
    <div className="absolute inset-0 px-2">
      <div className="absolute left-[2%] top-[4%] max-w-[62%] px-4 py-2.5 rounded-2xl rounded-bl-md bg-white shadow-[0_20px_40px_-16px_rgba(15,23,42,0.15)] border border-paper-200 text-[14px] text-ink-900"
           style={{animation: inView ? 'revealUp 0.6s cubic-bezier(.22,.7,.2,1) 0.4s both' : 'none'}}>
        Asalam o Alaikum. Is the price negotiable?
        <div className="mt-1 font-mono text-[9px] tracking-wider text-ink-700/40">10:42 AM · BUYER</div>
      </div>

      <div className="absolute right-[2%] top-[20%] max-w-[62%] px-4 py-2.5 rounded-2xl rounded-br-md bg-brand-600 shadow-[0_20px_40px_-16px_rgba(37,99,235,0.4)] text-[14px] text-white"
           style={{animation: inView ? 'revealUp 0.6s cubic-bezier(.22,.7,.2,1) 0.6s both' : 'none'}}>
        Walaikum Asalam. Yes — make me a fair offer 👇
        <div className="mt-1 font-mono text-[9px] tracking-wider text-white/70">10:43 AM · IMRAN Q.</div>
      </div>

      <div className="absolute left-[4%] top-[40%] right-[10%] rounded-3xl bg-white shadow-[0_40px_80px_-24px_rgba(15,23,42,0.25)] border border-paper-200 p-5"
           style={{animation: inView ? 'revealUp 0.7s cubic-bezier(.22,.7,.2,1) 0.85s both' : 'none'}}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-md bg-brand-600/10 border border-brand-200 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-brand-600" fill="none"><path d="M3 12h18M12 3v18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            </span>
            <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink-700/60">Structured Offer</span>
          </div>
          <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-[10px] font-bold tracking-wide">PENDING</span>
        </div>
        <div className="mt-3 flex items-baseline gap-1.5">
          <span className="font-mono text-[11px] text-ink-700/50">PKR</span>
          <span className="font-black text-[40px] text-brand-600 tracking-tight leading-none">2,68,00,000</span>
        </div>
        <div className="mt-1 text-ink-700/65 text-[13px]">12L below asking · Expires in 24h</div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <button className="h-10 rounded-xl bg-emerald-600 text-white text-[13px] font-bold shadow-[0_8px_20px_-6px_rgba(16,185,129,0.5)]">Accept</button>
          <button className="h-10 rounded-xl bg-white border border-paper-200 text-ink-900 text-[13px] font-bold">Counter</button>
          <button className="h-10 rounded-xl bg-white border border-paper-200 text-ink-700/70 text-[13px] font-bold">Reject</button>
        </div>
      </div>

      <div className="absolute right-[2%] bottom-[2%] max-w-[44%] px-4 py-2.5 rounded-2xl rounded-br-md bg-emerald-50 shadow-[0_20px_40px_-16px_rgba(16,185,129,0.3)] border border-emerald-200 text-[14px] text-emerald-700 font-semibold"
           style={{animation: inView ? 'revealUp 0.6s cubic-bezier(.22,.7,.2,1) 1.15s both' : 'none'}}>
        ✓ Accepted at 2.68 Cr
      </div>
    </div>
  );
}

function DriveAwayFragments({ inView }) {
  return (
    <div className="absolute inset-0">
      <div className="absolute left-[2%] top-[4%]"
           style={{animation: inView ? 'revealUp 0.6s cubic-bezier(.22,.7,.2,1) 0.4s both' : 'none'}}>
        <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink-700/50 mb-3">280-pt Inspection</div>
        <ul className="space-y-2.5">
          {['Engine & transmission','Body, paint & frame','Brakes, tires & suspension','Electronics & A/C','Documents & VIN match'].map((t,k) => (
            <li key={t} className="flex items-center gap-3"
                style={{animation: inView ? `revealUp 0.5s cubic-bezier(.22,.7,.2,1) ${0.55 + k*0.12}s both` : 'none'}}>
              <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-[0_8px_20px_-6px_rgba(16,185,129,0.5)]">
                <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3"><path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round"/></svg>
              </span>
              <span className="text-[14px] text-ink-900 font-medium">{t}</span>
              <span className="font-mono text-[10px] tracking-wider text-emerald-600 font-bold">OK</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="absolute right-[2%] top-[6%] w-[44%] rotate-[3deg] rounded-2xl bg-white shadow-[0_30px_60px_-20px_rgba(15,23,42,0.25)] border border-paper-200 p-4"
           style={{animation: inView ? 'revealUp 0.7s cubic-bezier(.22,.7,.2,1) 0.7s both' : 'none'}}>
        <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink-700/50">Transfer Letter</div>
        <div className="mt-3 space-y-1.5">
          <div className="h-1.5 rounded bg-paper-200 w-[90%]"/>
          <div className="h-1.5 rounded bg-paper-200 w-[72%]"/>
          <div className="h-1.5 rounded bg-paper-200 w-[80%]"/>
          <div className="h-1.5 rounded bg-paper-200 w-[58%]"/>
          <div className="h-1.5 rounded bg-paper-200 w-[68%]"/>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-paper-50 border border-paper-200 p-2">
            <div className="font-mono text-[9px] tracking-wider text-ink-700/50 uppercase">Engine</div>
            <div className="font-mono text-[11px] text-ink-900 font-bold mt-0.5">2ZR-7M3X891</div>
          </div>
          <div className="rounded-lg bg-paper-50 border border-paper-200 p-2">
            <div className="font-mono text-[9px] tracking-wider text-ink-700/50 uppercase">Chassis</div>
            <div className="font-mono text-[11px] text-ink-900 font-bold mt-0.5">NZE181-7012</div>
          </div>
        </div>
      </div>

      <div className="absolute right-[14%] top-[58%] w-24 h-24 rounded-full border-4 border-emerald-500 flex items-center justify-center -rotate-12 bg-white/80 backdrop-blur"
           style={{animation: inView ? 'revealUp 0.7s cubic-bezier(.22,.7,.2,1) 1s both' : 'none'}}>
        <div className="text-center">
          <div className="font-mono text-[10px] tracking-[0.18em] text-emerald-600 font-black">VERIFIED</div>
          <div className="font-black text-emerald-600 text-xl leading-none mt-0.5">2026</div>
          <div className="font-mono text-[8px] tracking-wider text-emerald-600/70 mt-0.5">AUTOMART</div>
        </div>
      </div>

      <div className="absolute right-[2%] bottom-[2%] flex items-center gap-3 rounded-2xl bg-ink-900 px-4 py-3 shadow-[0_20px_40px_-12px_rgba(15,23,42,0.5)]"
           style={{animation: inView ? 'revealUp 0.7s cubic-bezier(.22,.7,.2,1) 1.15s both' : 'none'}}>
        <span className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center">
          <Icon name="key" className="w-5 h-5 text-white"/>
        </span>
        <div>
          <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-white/60">Keys delivered</div>
          <div className="text-white font-bold text-[14px]">Wed · 2 Jul, 4:30 PM</div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Verified Sellers (trust)
   ============================================================ */
function VerifiedSellers() {
  const sellers = [
    { n:'Imran Q.', city:'Karachi · DHA', r:4.9, deals:24, tag:'Top dealer' },
    { n:'Nadia M.', city:'Lahore · Gulberg', r:5.0, deals:7, tag:'Private seller' },
    { n:'Hassan A.', city:'Islamabad · F-7', r:4.8, deals:51, tag:'Showroom' },
  ];
  const pillars = [
    { code:'A·T', n:'01', t:'Government-ID + biometric selfie match', d:'CNIC OCR + face liveness check, cross-referenced with NADRA records.' },
    { code:'C·G', n:'02', t:'Manual review by trust team within 24h', d:'A real human at AutoMart approves every seller before any listing goes live.' },
    { code:'T·A', n:'03', t:'Per-deal ratings with chat receipts', d:'Buyers rate after every closed deal — chat history and photos travel with the rating.' },
    { code:'G·C', n:'04', t:'One-strike rule for fake listings', d:'Mismatched VINs, stolen photos, fake docs — permanent ban, no appeal.' },
  ];
  return (
    <section data-screen-label="06 Trust" className="relative text-white py-32 overflow-hidden"
      style={{background:'radial-gradient(ellipse 70% 50% at 30% 30%, #0a1f1a 0%, #051114 45%, #04080d 100%)'}}>
      {/* atmosphere */}
      <div className="absolute inset-0 pointer-events-none opacity-25"
           style={{backgroundImage:'linear-gradient(rgba(16,185,129,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.12) 1px, transparent 1px)', backgroundSize:'56px 56px', maskImage:'radial-gradient(ellipse 70% 70% at 50% 50%, black, transparent)'}}/>
      <div className="absolute -top-40 right-0 w-[600px] h-[600px] rounded-full pointer-events-none" style={{background:'radial-gradient(circle, rgba(16,185,129,0.15), transparent 65%)', filter:'blur(40px)'}}/>
      <div className="absolute bottom-0 -left-40 w-[500px] h-[500px] rounded-full pointer-events-none" style={{background:'radial-gradient(circle, rgba(37,99,235,0.12), transparent 65%)', filter:'blur(40px)'}}/>

      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 relative">
        {/* Heading */}
        <div className="max-w-[860px] mb-16">
          <div className="font-mono text-[11px] tracking-[0.22em] text-emerald-400 uppercase">/ verified sellers</div>
          <h2 className="font-bold text-4xl md:text-6xl mt-3 tracking-[-0.025em] leading-[1.02]">
            Real names. Real CNICs.<br/>
            <span className="font-serif italic font-normal text-emerald-400">Reviewed by humans.</span>
          </h2>
          <p className="text-white/70 mt-5 text-lg max-w-[58ch] leading-relaxed">
            The DNA of trust on AutoMart — four strands woven through every seller before they meet a buyer.
          </p>
        </div>

        {/* Helix + pillars + sellers */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_320px] gap-10 lg:gap-14 items-stretch">
          {/* DNA HELIX */}
          <div className="relative h-[640px] hidden lg:block">
            <DNAHelix count={pillars.length}/>
          </div>

          {/* PILLARS LADDER */}
          <ol className="relative space-y-5">
            <span aria-hidden className="absolute left-7 top-3 bottom-3 w-px bg-gradient-to-b from-emerald-500/0 via-emerald-500/40 to-emerald-500/0 lg:hidden"/>
            {pillars.map((p,i) => (
              <li key={p.n} className="group relative rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-5 pl-7 lg:pl-6 hover:border-emerald-400/40 transition-colors"
                  style={{animation:`revealUp 0.7s cubic-bezier(.22,.7,.2,1) ${i*0.12}s both`}}>
                {/* base-pair badge */}
                <span className="absolute -left-4 top-5 lg:top-6 inline-flex items-center justify-center w-9 h-9 rounded-full bg-ink-900 border border-emerald-400/40 font-mono text-[10px] tracking-wider text-emerald-300 shadow-[0_0_24px_rgba(16,185,129,0.25)]">
                  {p.code}
                </span>
                <div className="flex items-center justify-between gap-4">
                  <div className="font-mono text-[10px] tracking-[0.22em] text-emerald-400/80 uppercase">PILLAR {p.n}</div>
                  <span className="inline-flex items-center gap-1 px-2 h-5 rounded-full bg-emerald-500/15 text-emerald-300 text-[9px] font-bold tracking-wider">
                    <span className="w-1 h-1 rounded-full bg-emerald-400"/>VERIFIED
                  </span>
                </div>
                <h3 className="font-bold text-[18px] mt-2 tracking-tight">{p.t}</h3>
                <p className="text-white/65 mt-1.5 text-[14px] leading-relaxed">{p.d}</p>
              </li>
            ))}
          </ol>

          {/* SELLER CARDS */}
          <div className="space-y-4">
            <div className="font-mono text-[10px] tracking-[0.22em] text-white/45 uppercase mb-2 flex items-center gap-2">
              <span className="pulse-dot" style={{background:'#10b981'}}/>Live verified · Today
            </div>
            {sellers.map((s,i) => (
              <div key={s.n} className="rounded-2xl bg-white/[0.04] border border-white/10 p-5 backdrop-blur-md hover:border-emerald-400/40 transition-all hover:-translate-y-0.5"
                   style={{animation:`revealUp 0.7s cubic-bezier(.22,.7,.2,1) ${0.3 + i*0.1}s both`}}>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-700 border border-white/20 flex items-center justify-center font-black text-white text-sm">
                      {s.n.split(' ').map(p=>p[0]).join('')}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-ink-900 flex items-center justify-center">
                      <Icon name="check" className="w-2 h-2 text-white"/>
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[15px]">{s.n}</div>
                    <div className="text-white/55 text-[12px] mt-0.5 truncate">{s.city} · {s.tag}</div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-amber-300 font-bold text-[14px]">
                      <Icon name="star" className="w-3.5 h-3.5 fill-amber-300"/>{s.r}
                    </div>
                    <div className="text-white/45 text-[10px] font-mono tracking-wider mt-0.5">{s.deals} DEALS</div>
                  </div>
                </div>
                <div className="mt-3.5 pt-3.5 border-t border-white/10 flex items-center justify-between text-[11px]">
                  <span className="inline-flex items-center gap-1 text-white/55"><span className="pulse-dot"/>Online · 4 min</span>
                  <button className="font-semibold text-emerald-300 hover:text-emerald-200">View listings →</button>
                </div>
              </div>
            ))}
            {/* trust meter */}
            <div className="rounded-2xl bg-emerald-500/8 border border-emerald-400/20 p-4 mt-5">
              <div className="flex items-center justify-between text-[11px] font-mono tracking-wider text-emerald-200/80 uppercase">
                <span>Trust score</span>
                <span className="text-emerald-200">96.4%</span>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-emerald-500/15 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-300" style={{width:'96.4%', boxShadow:'0 0 16px rgba(16,185,129,0.6)'}}/>
              </div>
              <div className="text-[11px] text-emerald-100/70 mt-2">Cross-checked across 12,438 active listings.</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function DNAHelix({ count = 4 }) {
  // vertical helix SVG with rotating base pairs
  const H = 640;
  const W = 220;
  const cx = W/2;
  const turns = 2.2;
  const pts = 60;
  const amp = 64;
  const path = (phase) => {
    let d = '';
    for (let i = 0; i <= pts; i++) {
      const t = i / pts;
      const x = cx + Math.sin(t * Math.PI * 2 * turns + phase) * amp;
      const y = t * H;
      d += (i ? ' L ' : 'M ') + x.toFixed(1) + ' ' + y.toFixed(1);
    }
    return d;
  };
  const rungs = Array.from({length: 14}, (_, i) => {
    const t = (i + 0.5) / 14;
    const phase = 0;
    const x1 = cx + Math.sin(t * Math.PI * 2 * turns + phase) * amp;
    const x2 = cx + Math.sin(t * Math.PI * 2 * turns + phase + Math.PI) * amp;
    const y = t * H;
    return { x1, x2, y, t };
  });
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div className="absolute inset-0" style={{background:'radial-gradient(ellipse 60% 70% at 50% 50%, rgba(16,185,129,0.15), transparent 70%)', filter:'blur(20px)'}}/>
      <svg viewBox={`0 0 ${W} ${H}`} className="relative w-full max-w-[260px] h-full" aria-hidden="true">
        <defs>
          <linearGradient id="strandA" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981"/>
            <stop offset="50%" stopColor="#34d399"/>
            <stop offset="100%" stopColor="#10b981"/>
          </linearGradient>
          <linearGradient id="strandB" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6"/>
            <stop offset="50%" stopColor="#60a5fa"/>
            <stop offset="100%" stopColor="#3b82f6"/>
          </linearGradient>
          <filter id="dnaGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3"/>
          </filter>
        </defs>

        {/* glow strands */}
        <path d={path(0)} fill="none" stroke="url(#strandA)" strokeWidth="6" strokeLinecap="round" opacity="0.35" filter="url(#dnaGlow)">
          <animate attributeName="d" dur="8s" repeatCount="indefinite"
                   values={`${path(0)};${path(Math.PI/4)};${path(Math.PI/2)};${path(0.75*Math.PI)};${path(Math.PI)};${path(1.25*Math.PI)};${path(1.5*Math.PI)};${path(1.75*Math.PI)};${path(2*Math.PI)}`}/>
        </path>
        <path d={path(Math.PI)} fill="none" stroke="url(#strandB)" strokeWidth="6" strokeLinecap="round" opacity="0.35" filter="url(#dnaGlow)">
          <animate attributeName="d" dur="8s" repeatCount="indefinite"
                   values={`${path(Math.PI)};${path(1.25*Math.PI)};${path(1.5*Math.PI)};${path(1.75*Math.PI)};${path(2*Math.PI)};${path(2.25*Math.PI)};${path(2.5*Math.PI)};${path(2.75*Math.PI)};${path(3*Math.PI)}`}/>
        </path>

        {/* solid strands */}
        <path d={path(0)} fill="none" stroke="url(#strandA)" strokeWidth="2.2" strokeLinecap="round">
          <animate attributeName="d" dur="8s" repeatCount="indefinite"
                   values={`${path(0)};${path(Math.PI/4)};${path(Math.PI/2)};${path(0.75*Math.PI)};${path(Math.PI)};${path(1.25*Math.PI)};${path(1.5*Math.PI)};${path(1.75*Math.PI)};${path(2*Math.PI)}`}/>
        </path>
        <path d={path(Math.PI)} fill="none" stroke="url(#strandB)" strokeWidth="2.2" strokeLinecap="round">
          <animate attributeName="d" dur="8s" repeatCount="indefinite"
                   values={`${path(Math.PI)};${path(1.25*Math.PI)};${path(1.5*Math.PI)};${path(1.75*Math.PI)};${path(2*Math.PI)};${path(2.25*Math.PI)};${path(2.5*Math.PI)};${path(2.75*Math.PI)};${path(3*Math.PI)}`}/>
        </path>

        {/* rungs */}
        {rungs.map((r,i) => {
          const phases = ['0','PI/4','PI/2','3PI/4','PI','5PI/4','3PI/2','7PI/4','2PI'];
          const xa = phases.map(ph => {
            const v = ph==='0'?0:ph==='PI/4'?Math.PI/4:ph==='PI/2'?Math.PI/2:ph==='3PI/4'?0.75*Math.PI:ph==='PI'?Math.PI:ph==='5PI/4'?1.25*Math.PI:ph==='3PI/2'?1.5*Math.PI:ph==='7PI/4'?1.75*Math.PI:2*Math.PI;
            return (cx + Math.sin(r.t * Math.PI * 2 * turns + v) * amp).toFixed(1);
          }).join(';');
          const xb = phases.map(ph => {
            const v = ph==='0'?0:ph==='PI/4'?Math.PI/4:ph==='PI/2'?Math.PI/2:ph==='3PI/4'?0.75*Math.PI:ph==='PI'?Math.PI:ph==='5PI/4'?1.25*Math.PI:ph==='3PI/2'?1.5*Math.PI:ph==='7PI/4'?1.75*Math.PI:2*Math.PI;
            return (cx + Math.sin(r.t * Math.PI * 2 * turns + v + Math.PI) * amp).toFixed(1);
          }).join(';');
          return (
            <g key={i}>
              <line x1={r.x1} y1={r.y} x2={r.x2} y2={r.y} stroke="rgba(255,255,255,0.18)" strokeWidth="1" strokeDasharray="2 3">
                <animate attributeName="x1" dur="8s" repeatCount="indefinite" values={xa}/>
                <animate attributeName="x2" dur="8s" repeatCount="indefinite" values={xb}/>
              </line>
              <circle cx={r.x1} cy={r.y} r="3.5" fill="#10b981">
                <animate attributeName="cx" dur="8s" repeatCount="indefinite" values={xa}/>
              </circle>
              <circle cx={r.x2} cy={r.y} r="3.5" fill="#3b82f6">
                <animate attributeName="cx" dur="8s" repeatCount="indefinite" values={xb}/>
              </circle>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ============================================================
   Browse by body — On-brand modern editorial (light)
   ============================================================ */
function BodyTypes() {
  const types = [
    { t:'Sedan',              n:'4,128', tag:'Most listed', popular:['Corolla','Civic','City','Verna'],     price:'18L – 1.2Cr', img:'assets/body-verna.jpeg',    sub:'Hyundai Verna · Reference' },
    { t:'Hatchback',          n:'3,402', tag:'Best value',  popular:['Cultus','Alto','Baleno','Swift'],     price:'14L – 65L',   img:'assets/body-baleno.jpeg',   sub:'Suzuki Baleno · Reference' },
    { t:'SUV / Crossover',    n:'2,116', tag:'Trending',    popular:['Sportage','Tucson','Victoris','X5'],  price:'45L – 4Cr',   img:'assets/body-victoris.jpeg', sub:'Suzuki Victoris · Reference' },
    { t:'Luxury / Performance', n:'1,286', tag:'Premium',   popular:['Purosangue','GT 63','M5','Cayenne'],  price:'1.4Cr – 12Cr', img:'assets/body-ferrari.jpeg', sub:'Ferrari Purosangue · Reference' },
    { t:'Van / MPV',          n:'894',   tag:'Family',      popular:['Hiace','BR-V','Transit','APV'],       price:'22L – 1.4Cr', img:'assets/body-transit.jpeg',  sub:'Ford Transit Custom · Reference' },
    { t:'Pickup',             n:'612',   tag:'Workhorse',   popular:['Hilux','Revo','Bolero','Ranger'],     price:'35L – 2.2Cr', img:'assets/body-pickup.jpeg',   sub:'Mahindra Bolero Pickup · Reference' },
  ];
  const [active, setActive] = useState(0);
  const a = types[active];

  return (
    <section data-screen-label="07 Body" className="relative bg-paper-50 text-ink-900 py-28 overflow-hidden">
      {/* subtle brand wash */}
      <div className="absolute inset-0 pointer-events-none opacity-50" style={{background:'radial-gradient(ellipse 60% 40% at 80% 20%, rgba(37,99,235,0.06), transparent 60%), radial-gradient(ellipse 40% 30% at 10% 80%, rgba(37,99,235,0.04), transparent 60%)'}}/>

      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 relative">
        {/* Header — matches other sections */}
        <div className="flex items-end justify-between flex-wrap gap-4 mb-14">
          <div className="max-w-[640px]">
            <div className="font-mono text-[11px] tracking-[0.2em] text-brand-600 uppercase">/ browse by body</div>
            <h2 className="font-bold text-4xl md:text-5xl mt-2 tracking-[-0.02em] leading-[1.05] text-ink-900">
              What are you in the mood for?
            </h2>
            <p className="text-ink-700/70 mt-4 text-lg leading-relaxed">
              Six categories, twelve thousand listings — every car verified before it goes live.
            </p>
          </div>
          <a href="#" className="text-sm font-semibold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1.5">
            All categories <Icon name="arrow-right" className="w-4 h-4"/>
          </a>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-8 lg:gap-12">
          {/* LEFT — clean typographic list */}
          <ol className="relative bg-white rounded-2xl border border-paper-200 overflow-hidden">
            {/* moving brand bar on left */}
            <span aria-hidden className="absolute left-0 top-0 bottom-0 w-1 bg-paper-100"/>
            <span aria-hidden className="absolute left-0 w-1 bg-brand-600 transition-all duration-500 rounded-r"
                  style={{ top: `${(active/types.length) * 100}%`, height: `${(1/types.length) * 100}%` }}/>

            {types.map((b, i) => {
              const isActive = i === active;
              return (
                <li key={b.t}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => setActive(i)}
                    className={`group relative pl-8 pr-5 py-5 border-b border-paper-200 last:border-b-0 cursor-pointer transition-colors
                      ${isActive ? 'bg-brand-50/60' : 'hover:bg-paper-50'}`}>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <span className={`font-mono text-[11px] tracking-[0.18em] transition-colors
                        ${isActive ? 'text-brand-600' : 'text-ink-700/35'}`}>
                        0{i+1}
                      </span>
                      <h3 className={`font-bold tracking-[-0.02em] transition-all duration-300
                        ${isActive ? 'text-brand-700 text-2xl md:text-3xl' : 'text-ink-900 text-xl md:text-2xl'}`}>
                        {b.t}
                      </h3>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right hidden sm:block">
                        <div className="font-bold text-ink-900 text-base">{b.n}</div>
                        <div className="font-mono text-[9px] tracking-[0.18em] uppercase text-ink-700/50">listings</div>
                      </div>
                      <span className={`hidden md:flex w-9 h-9 rounded-full items-center justify-center transition-all
                        ${isActive ? 'bg-brand-600 text-white shadow-[0_8px_20px_-6px_rgba(37,99,235,0.5)]' : 'bg-paper-100 text-ink-700/50 group-hover:bg-paper-200'}`}>
                        <Icon name="arrow-right" className="w-4 h-4"/>
                      </span>
                    </div>
                  </div>

                  {/* expanded info */}
                  <div className={`grid transition-all duration-500 overflow-hidden ${isActive ? 'grid-rows-[1fr] opacity-100 mt-4' : 'grid-rows-[0fr] opacity-0'}`}>
                    <div className="min-h-0 pl-8">
                      <div className="flex items-center gap-2 flex-wrap mb-3">
                        {b.popular.map(p => (
                          <span key={p} className="px-2.5 py-1 rounded-full bg-white border border-paper-200 text-[12px] font-medium text-ink-900">{p}</span>
                        ))}
                      </div>
                      <div className="flex items-center gap-3 text-[12px]">
                        <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink-700/50">Range</span>
                        <span className="font-semibold text-ink-900">PKR {b.price}</span>
                        {b.tag && (
                          <span className="ml-auto inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-brand-50 border border-brand-100 text-brand-700 text-[10px] font-bold uppercase tracking-wide">
                            {b.tag}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>

          {/* RIGHT — light photographic showcase (uses real product photos) */}
          <div className="relative lg:sticky lg:top-28 self-start h-[480px] md:h-[600px] rounded-2xl overflow-hidden border border-paper-200 bg-white shadow-[0_30px_60px_-30px_rgba(15,23,42,0.25)]">
            {/* light photo stage */}
            <div className="relative h-[78%] overflow-hidden"
                 style={{background:'radial-gradient(ellipse 80% 80% at 50% 50%, #ffffff 0%, #eef3fb 60%, #dde6f4 100%)'}}>
              {/* subtle grid */}
              <div className="absolute inset-0 opacity-[0.5] pointer-events-none"
                   style={{backgroundImage:'linear-gradient(rgba(37,99,235,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.08) 1px, transparent 1px)', backgroundSize:'48px 48px', maskImage:'radial-gradient(ellipse 70% 70% at 50% 60%, black, transparent)'}}/>
              {/* brand color wash */}
              <div className="absolute -top-32 -right-20 w-[420px] h-[420px] rounded-full pointer-events-none"
                   style={{background:'radial-gradient(circle, rgba(37,99,235,0.18), transparent 65%)', filter:'blur(40px)'}}/>
              <div className="absolute -bottom-32 -left-20 w-[360px] h-[360px] rounded-full pointer-events-none"
                   style={{background:'radial-gradient(circle, rgba(96,165,250,0.18), transparent 65%)', filter:'blur(40px)'}}/>

              {/* top label row */}
              <div className="absolute top-5 left-5 right-5 flex items-center justify-between gap-2 z-10">
                <span className="inline-flex items-center gap-2 h-7 px-3 rounded-full bg-white/85 border border-paper-200 backdrop-blur-md text-[10px] font-mono tracking-[0.2em] uppercase text-ink-900 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-600" style={{boxShadow:'0 0 8px rgba(37,99,235,0.8)'}}/>
                  {String(active+1).padStart(2,'0')}/06 · Featured
                </span>
                {a.tag && (
                  <span className="inline-flex items-center h-7 px-2.5 rounded-full bg-brand-600 text-white text-[10px] font-bold uppercase tracking-[0.12em] shadow-[0_8px_20px_-6px_rgba(37,99,235,0.6)]">
                    {a.tag}
                  </span>
                )}
              </div>

              {/* huge ghost word */}
              <div key={a.t+'bg'} className="absolute inset-0 flex items-center justify-center" style={{animation:'revealUp 0.5s cubic-bezier(.22,.7,.2,1) both'}}>
                <span className="font-black text-ink-900/[0.05] tracking-[-0.04em] select-none pointer-events-none whitespace-nowrap"
                      style={{fontSize:'clamp(120px, 18vw, 220px)'}}>
                  {a.t.split(' ')[0]}
                </span>
              </div>

              {/* product photo */}
              <div key={a.t+'img'} className="absolute inset-0 flex items-center justify-center px-8 pt-4"
                   style={{animation:'revealUp 0.6s cubic-bezier(.22,.7,.2,1) 0.05s both'}}>
                <img src={a.img} alt={a.sub}
                     loading="lazy" decoding="async"
                     className="max-w-[88%] max-h-[88%] w-auto h-auto object-contain drop-shadow-[0_30px_40px_rgba(15,23,42,0.18)]"
                     style={{mixBlendMode:'multiply'}}/>
              </div>

              {/* floor reflection ellipse */}
              <div className="absolute left-1/2 bottom-3 -translate-x-1/2 w-[72%] h-[28px] rounded-full pointer-events-none"
                   style={{background:'radial-gradient(ellipse 50% 50% at 50% 0%, rgba(15,23,42,0.18), transparent 70%)', filter:'blur(10px)'}}/>

              {/* reference badge */}
              <div className="absolute bottom-4 left-5 z-10">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 border border-paper-200 text-[10px] font-mono tracking-wider uppercase text-ink-700/60 shadow-sm backdrop-blur">
                  <span className="w-1 h-1 rounded-full bg-ink-700/40"/>{a.sub}
                </span>
              </div>
            </div>

            {/* bottom info strip — light, on-brand */}
            <div className="px-6 py-5 grid grid-cols-3 gap-4 items-center border-t border-paper-200">
              <div>
                <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink-700/50">Listings</div>
                <div className="font-bold text-2xl tracking-tight text-ink-900 mt-0.5">{a.n}</div>
              </div>
              <div>
                <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink-700/50">Price range</div>
                <div className="font-semibold text-base tracking-tight text-ink-900 mt-0.5">PKR {a.price}</div>
              </div>
              <button className="btn-primary h-11 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-1.5">
                Explore <Icon name="arrow-right" className="w-4 h-4"/>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function BodyTypeSilhouette({ type }) {
  const w = 520, h = 240;
  const common = (
    <ellipse cx={w/2} cy={h-12} rx={w*0.42} ry={10} fill="rgba(37,99,235,0.35)" filter="blur(2px)"/>
  );
  const stroke = "rgba(96,165,250,0.5)";
  const accent = "rgba(96,165,250,0.55)";
  const body = "#0a0e1a";
  const window = "rgba(29,78,216,0.55)";

  if (type.startsWith('SUV')) {
    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="w-[78%] h-auto">
        {common}
        <path d="M60,200 L75,150 Q95,90 150,82 L370,82 Q425,90 445,150 L460,200 Q460,220 440,222 L80,222 Q60,220 60,200 Z"
              fill={body} stroke={stroke} strokeWidth="1.5"/>
        <path d="M105,150 Q130,98 170,90 L350,90 Q390,98 415,150" fill={window}/>
        <circle cx="130" cy="218" r="26" fill="#000"/><circle cx="130" cy="218" r="14" fill="#1a2238"/><circle cx="130" cy="218" r="6" fill={accent}/>
        <circle cx="390" cy="218" r="26" fill="#000"/><circle cx="390" cy="218" r="14" fill="#1a2238"/><circle cx="390" cy="218" r="6" fill={accent}/>
        <ellipse cx="78" cy="180" rx="14" ry="6" fill="#fff" opacity="0.95"/>
        <ellipse cx="442" cy="180" rx="14" ry="6" fill="#fff" opacity="0.95"/>
      </svg>
    );
  }
  if (type === 'Pickup') {
    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="w-[80%] h-auto">
        {common}
        <path d="M50,200 L65,160 Q85,110 140,102 L240,102 L260,150 L470,150 L470,200 Q470,220 450,222 L70,222 Q50,220 50,200 Z"
              fill={body} stroke={stroke} strokeWidth="1.5"/>
        <path d="M90,160 Q115,118 155,110 L228,110" fill={window}/>
        <rect x="270" y="155" width="195" height="55" rx="4" fill="#1a2238" stroke={accent}/>
        <circle cx="135" cy="218" r="24" fill="#000"/><circle cx="135" cy="218" r="13" fill="#1a2238"/><circle cx="135" cy="218" r="5" fill={accent}/>
        <circle cx="395" cy="218" r="24" fill="#000"/><circle cx="395" cy="218" r="13" fill="#1a2238"/><circle cx="395" cy="218" r="5" fill={accent}/>
        <ellipse cx="68" cy="184" rx="12" ry="5" fill="#fff" opacity="0.95"/>
      </svg>
    );
  }
  if (type === 'Hatchback') {
    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="w-[68%] h-auto">
        {common}
        <path d="M70,200 L85,160 Q105,118 155,110 L370,110 Q400,120 410,160 L420,200 Q420,220 400,222 L90,222 Q70,220 70,200 Z"
              fill={body} stroke={stroke} strokeWidth="1.5"/>
        <path d="M115,160 Q138,122 175,116 L355,118 Q380,124 395,160" fill={window}/>
        <circle cx="135" cy="218" r="22" fill="#000"/><circle cx="135" cy="218" r="12" fill="#1a2238"/><circle cx="135" cy="218" r="5" fill={accent}/>
        <circle cx="355" cy="218" r="22" fill="#000"/><circle cx="355" cy="218" r="12" fill="#1a2238"/><circle cx="355" cy="218" r="5" fill={accent}/>
        <ellipse cx="80" cy="180" rx="12" ry="5" fill="#fff" opacity="0.95"/>
      </svg>
    );
  }
  if (type.startsWith('Hybrid')) {
    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="w-[72%] h-auto">
        {common}
        <path d="M55,200 L72,160 Q102,108 175,98 L345,98 Q418,108 448,160 L465,200 Q465,220 445,222 L75,222 Q55,220 55,200 Z"
              fill={body} stroke={stroke} strokeWidth="1.5"/>
        <path d="M115,160 Q145,114 195,106 L325,106 Q375,114 405,160" fill={window}/>
        <circle cx="140" cy="218" r="22" fill="#000"/><circle cx="140" cy="218" r="12" fill="#1a2238"/><circle cx="140" cy="218" r="5" fill={accent}/>
        <circle cx="380" cy="218" r="22" fill="#000"/><circle cx="380" cy="218" r="12" fill="#1a2238"/><circle cx="380" cy="218" r="5" fill={accent}/>
        <path d="M260 130 L248 158 L262 158 L256 178 L274 150 L260 150 Z" fill="#10b981"/>
        <ellipse cx="68" cy="184" rx="12" ry="5" fill="#fff" opacity="0.95"/>
      </svg>
    );
  }
  if (type.startsWith('Van')) {
    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="w-[78%] h-auto">
        {common}
        <path d="M55,200 L65,108 Q70,90 110,90 L420,90 Q450,98 460,140 L470,200 Q470,220 450,222 L75,222 Q55,220 55,200 Z"
              fill={body} stroke={stroke} strokeWidth="1.5"/>
        <rect x="110" y="100" width="280" height="55" rx="6" fill={window}/>
        <circle cx="140" cy="218" r="22" fill="#000"/><circle cx="140" cy="218" r="12" fill="#1a2238"/><circle cx="140" cy="218" r="5" fill={accent}/>
        <circle cx="385" cy="218" r="22" fill="#000"/><circle cx="385" cy="218" r="12" fill="#1a2238"/><circle cx="385" cy="218" r="5" fill={accent}/>
        <ellipse cx="68" cy="180" rx="10" ry="5" fill="#fff" opacity="0.95"/>
      </svg>
    );
  }
  // Sedan
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-[74%] h-auto">
      {common}
      <path d="M55,200 L75,150 Q105,98 175,90 L345,90 Q415,98 445,150 L465,200 Q465,220 445,222 L75,222 Q55,220 55,200 Z"
            fill={body} stroke={stroke} strokeWidth="1.5"/>
      <path d="M115,150 Q145,102 195,94 L325,94 Q375,102 405,150" fill={window}/>
      <circle cx="140" cy="218" r="22" fill="#000"/><circle cx="140" cy="218" r="12" fill="#1a2238"/><circle cx="140" cy="218" r="5" fill={accent}/>
      <circle cx="380" cy="218" r="22" fill="#000"/><circle cx="380" cy="218" r="12" fill="#1a2238"/><circle cx="380" cy="218" r="5" fill={accent}/>
      <ellipse cx="68" cy="180" rx="12" ry="5" fill="#fff" opacity="0.95"/>
      <ellipse cx="452" cy="180" rx="12" ry="5" fill="#fff" opacity="0.95"/>
    </svg>
  );
}

/* ============================================================
   Sell CTA
   ============================================================ */
function SellCTA() {
  return (
    <section data-screen-label="08 CTA" className="relative overflow-hidden bg-ink-950 text-white">
      {/* Video backdrop */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <video
          src="sell-cta.mp4"
          autoPlay loop muted playsInline preload="auto"
          className="absolute inset-0 w-full h-full object-cover"
          style={{filter:'brightness(0.85) saturate(1.1) contrast(1.08)', transform:'scale(1.0)', transformOrigin:'center center'}}
        />
        {/* Lighter, left-heavy darkening so the right side stays clear */}
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(90deg, rgba(5,7,13,0.86) 0%, rgba(5,7,13,0.55) 38%, rgba(5,7,13,0.15) 62%, rgba(5,7,13,0.35) 100%)'
        }}/>
        {/* Subtle top + bottom feathering only */}
        <div className="absolute inset-0" style={{
          background:'linear-gradient(180deg, rgba(5,7,13,0.45) 0%, transparent 14%, transparent 86%, rgba(5,7,13,0.7) 100%)'
        }}/>
        {/* Soft brand tint, low opacity so the video stays visible */}
        <div className="absolute inset-0 mix-blend-soft-light opacity-30" style={{
          background:'radial-gradient(ellipse 50% 60% at 25% 50%, rgba(37,99,235,0.4), transparent 60%)'
        }}/>
        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-15" style={{
          backgroundImage:'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)',
          backgroundSize:'72px 72px',
          maskImage:'radial-gradient(ellipse 80% 80% at 50% 50%, black, transparent)'
        }}/>
        {/* Grain */}
        <div className="absolute inset-0 opacity-[0.08] pointer-events-none mix-blend-overlay" style={{
          backgroundImage:'radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px)',
          backgroundSize:'3px 3px'
        }}/>
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-10 py-32 lg:py-40 grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-12 items-center">
        <div>
          <div className="inline-flex items-center gap-2 px-3 h-7 rounded-full bg-white/8 border border-white/15 text-[11px] font-mono tracking-[0.22em] uppercase backdrop-blur-md">
            <span className="pulse-dot" style={{background:'#60a5fa'}}/>
            <span className="text-white/85">For sellers</span>
          </div>
          <h2 className="font-bold text-4xl md:text-6xl lg:text-7xl mt-5 tracking-[-0.02em] leading-[1.0]">
            List your car.<br/>
            <span className="text-white/95">Sell in </span>
            <span className="text-brand-400">9 days</span>
            <span className="text-white/95">,<br/>on average.</span>
          </h2>
          <p className="text-white/75 mt-6 text-lg leading-relaxed max-w-[54ch]">
            Our AI fills in the boring fields. You upload photos. We bring serious, verified buyers — not tire-kickers.
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <button className="btn-primary h-12 px-7 rounded-xl text-white font-semibold text-[15px]">
              Post a listing — free
            </button>
            <button className="h-12 px-6 rounded-xl bg-white/8 border border-white/20 backdrop-blur-md font-semibold text-[15px] text-white hover:bg-white/15">
              See seller dashboard
            </button>
          </div>

          <div className="mt-9 flex items-center gap-6 text-sm text-white/70 flex-wrap">
            <div className="flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-brand-500/20 border border-brand-400/40 flex items-center justify-center"><Icon name="check" className="w-3 h-3 text-brand-300"/></span>Free to list</div>
            <div className="flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-brand-500/20 border border-brand-400/40 flex items-center justify-center"><Icon name="check" className="w-3 h-3 text-brand-300"/></span>AI-generated description</div>
            <div className="flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-brand-500/20 border border-brand-400/40 flex items-center justify-center"><Icon name="check" className="w-3 h-3 text-brand-300"/></span>Real buyers only</div>
          </div>
        </div>

        {/* Stat card cluster */}
        <div className="relative h-[400px] hidden lg:block">
          <div className="absolute top-0 left-0 w-64 rounded-2xl bg-white/[0.06] backdrop-blur-xl border border-white/15 p-5 float shadow-[0_30px_60px_-20px_rgba(0,0,0,0.5)]">
            <div className="font-mono text-[10px] tracking-[0.22em] text-white/55 uppercase">Avg time to sell</div>
            <div className="font-black text-4xl mt-1 tracking-tight text-white">9 days</div>
            <div className="text-white/65 text-sm mt-2">vs. 31 days on classifieds</div>
          </div>
          <div className="absolute top-24 right-0 w-72 rounded-2xl bg-white/[0.08] backdrop-blur-xl border border-white/20 p-5 float shadow-[0_30px_60px_-20px_rgba(0,0,0,0.5)]" style={{animationDelay:'1s'}}>
            <div className="font-mono text-[10px] tracking-[0.22em] text-white/60 uppercase">Buyer reach</div>
            <div className="font-black text-4xl mt-1 tracking-tight text-white">412k <span className="text-2xl text-white/60">/ mo</span></div>
            <div className="text-white/70 text-sm mt-2">verified, intent-scored buyers</div>
          </div>
          <div className="absolute bottom-0 left-12 w-72 rounded-2xl bg-white/[0.06] backdrop-blur-xl border border-white/15 p-5 float shadow-[0_30px_60px_-20px_rgba(0,0,0,0.5)]" style={{animationDelay:'2s'}}>
            <div className="font-mono text-[10px] tracking-[0.22em] text-white/55 uppercase">Seller satisfaction</div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="font-black text-4xl tracking-tight text-white">4.92</span>
              <span className="text-white/55 text-sm">/ 5</span>
            </div>
            <div className="text-white/65 text-sm mt-2">across 8,200+ closed deals</div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   Press strip / FAQ teaser / Footer
   ============================================================ */
function FAQTeaser() {
  const qs = [
    { c:'Pricing',      q:'Is AutoMart actually free?',          a:'Posting and browsing are free. We only charge an optional inspection or document handling fee if you want it — never a hidden cut from your sale.' },
    { c:'Trust',        q:'How does seller verification work?',  a:'Sellers upload CNIC + a biometric selfie. Our trust team manually verifies — usually in under 24 hours — before any listing goes live.' },
    { c:'Safety',       q:'What if a deal goes wrong?',          a:'Every chat is logged. Disputes are reviewed by our team and can result in seller bans plus a refund of any platform fees you paid.' },
    { c:'Coverage',     q:'Where do you operate?',               a:'68 cities across all 4 provinces, AJK, and GB — with the largest inventory in Karachi, Lahore, and Islamabad.' },
    { c:'AI',           q:'How accurate is the AI Price Insight?', a:'Trained on 240,000+ recent transactions across Pakistan, retrained daily. Median accuracy is within 4% of final sale price.' },
    { c:'Inspections',  q:'Do you offer third-party inspections?', a:'Yes — a 280-point inspection across 68 cities, scheduled in-app. Booked from the listing page in two taps, results delivered in 24h.' },
  ];
  const [open, setOpen] = useState(0);
  const [filter, setFilter] = useState('All');
  const cats = ['All', ...Array.from(new Set(qs.map(x=>x.c)))];
  const visible = filter==='All' ? qs : qs.filter(x=>x.c===filter);
  return (
    <section data-screen-label="09 FAQ" className="relative bg-paper-50 text-ink-900 py-28 overflow-hidden">
      {/* subtle brand wash to relate with rest of light sections */}
      <div className="absolute inset-0 pointer-events-none opacity-60" style={{background:'radial-gradient(ellipse 50% 40% at 85% 10%, rgba(37,99,235,0.07), transparent 60%), radial-gradient(ellipse 40% 35% at 5% 90%, rgba(37,99,235,0.05), transparent 60%)'}}/>

      <div className="max-w-[1280px] mx-auto px-6 lg:px-10 relative">
        {/* Header — same pattern as other sections */}
        <div className="text-center max-w-[760px] mx-auto mb-14">
          <div className="font-mono text-[11px] tracking-[0.2em] text-brand-600 uppercase">/ common questions</div>
          <h2 className="font-bold text-4xl md:text-5xl mt-2 tracking-[-0.02em] leading-[1.05] text-ink-900">
            Things we get asked.
          </h2>
          <p className="text-ink-700/70 mt-4 text-lg leading-relaxed">
            Quick answers. If you don't find what you need, our team replies in under <span className="text-brand-600 font-semibold">6 minutes</span> on weekdays.
          </p>

          {/* Category chips */}
          <div className="mt-7 flex flex-wrap justify-center gap-2">
            {cats.map(c => (
              <button key={c} onClick={()=>{setFilter(c); setOpen(0);}}
                className={`h-9 px-4 rounded-full text-sm font-medium transition ${filter===c ? 'bg-ink-900 text-white shadow-[0_8px_20px_-6px_rgba(15,23,42,0.4)]' : 'bg-white text-ink-700/75 border border-paper-200 hover:bg-paper-100'}`}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* FAQ + sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-6">
          {/* Accordion */}
          <div className="bg-white rounded-2xl border border-paper-200 overflow-hidden shadow-[0_30px_60px_-40px_rgba(15,23,42,0.2)]">
            {visible.map((item,i) => {
              const isOpen = open===i;
              return (
                <div key={item.q} className={`border-b border-paper-200 last:border-b-0 transition-colors ${isOpen ? 'bg-brand-50/40' : ''}`}>
                  <button onClick={()=>setOpen(isOpen?-1:i)} className="w-full text-left px-6 py-5 flex items-center justify-between gap-5">
                    <div className="flex items-center gap-4 min-w-0">
                      <span className={`font-mono text-[11px] tracking-[0.18em] transition-colors ${isOpen ? 'text-brand-600' : 'text-ink-700/35'}`}>0{i+1}</span>
                      <div className="min-w-0">
                        <div className="font-semibold text-ink-900 text-[16px] md:text-[17px] truncate">{item.q}</div>
                        <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink-700/40 mt-0.5">{item.c}</div>
                      </div>
                    </div>
                    <span className={`w-9 h-9 rounded-full flex items-center justify-center text-base flex-shrink-0 transition-all ${isOpen ? 'bg-brand-600 text-white rotate-0 shadow-[0_8px_20px_-6px_rgba(37,99,235,0.5)]' : 'bg-paper-100 text-ink-700/60'}`}>
                      <svg viewBox="0 0 12 12" className={`w-3 h-3 transition-transform ${isOpen?'rotate-45':''}`}><path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                    </span>
                  </button>
                  <div className={`grid transition-all duration-500 overflow-hidden ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                    <div className="min-h-0">
                      <div className="px-6 pb-6 pl-[68px] text-ink-700/80 leading-relaxed">
                        {item.a}
                        <div className="mt-4 flex items-center gap-3 text-[12px]">
                          <button className="text-brand-600 hover:text-brand-700 font-semibold inline-flex items-center gap-1.5">Read full guide <Icon name="arrow-right" className="w-3.5 h-3.5"/></button>
                          <span className="text-ink-700/30">·</span>
                          <span className="text-ink-700/55">Was this helpful?</span>
                          <button className="px-2 py-0.5 rounded-md bg-paper-100 hover:bg-paper-200 text-ink-700/70 font-medium">👍</button>
                          <button className="px-2 py-0.5 rounded-md bg-paper-100 hover:bg-paper-200 text-ink-700/70 font-medium">👎</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Side modules */}
          <div className="lg:sticky lg:top-28 self-start space-y-4">
            {/* Trust report */}
            <div className="rounded-2xl bg-ink-900 text-white p-6 overflow-hidden relative">
              <div aria-hidden className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-brand-600/30 blur-3xl"/>
              <div aria-hidden className="absolute inset-0 opacity-[0.08]" style={{backgroundImage:'linear-gradient(rgba(96,165,250,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(96,165,250,0.5) 1px, transparent 1px)', backgroundSize:'48px 48px', maskImage:'radial-gradient(ellipse 80% 80% at 50% 50%, black, transparent)'}}/>
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-brand-300">/ trust report</div>
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-mono tracking-wider uppercase text-emerald-300">
                    <span className="pulse-dot" style={{background:'#34d399'}}/>Live
                  </span>
                </div>
                <h3 className="text-2xl font-bold mt-3 tracking-tight">By the numbers.</h3>
                <p className="text-white/55 mt-2 text-[13px] leading-relaxed">A real-time pulse of the marketplace — updated continuously.</p>

                <div className="mt-5 space-y-3">
                  {[
                    ['Verified listings', '12,438', '+184 this week'],
                    ['Avg seller rating', '4.92', 'across 8,200+ deals'],
                    ['Median sale time', '9 days', 'vs. 31 elsewhere'],
                    ['Disputes resolved', '98%', 'in under 48 hrs'],
                  ].map(([k,v,sub]) => (
                    <div key={k} className="flex items-center justify-between gap-3 pb-3 border-b border-white/8 last:border-b-0 last:pb-0">
                      <div className="min-w-0">
                        <div className="text-[13px] text-white/80 font-medium">{k}</div>
                        <div className="font-mono text-[10px] tracking-wider uppercase text-white/40 mt-0.5">{sub}</div>
                      </div>
                      <div className="font-black text-2xl tracking-tight text-white">{v}</div>
                    </div>
                  ))}
                </div>

                <a href="#" className="mt-5 inline-flex items-center gap-1.5 text-brand-300 hover:text-brand-200 text-sm font-semibold">
                  Read full trust report <Icon name="arrow-right" className="w-4 h-4"/>
                </a>
              </div>
            </div>

            {/* AI price check teaser */}
            <div className="rounded-2xl bg-white border border-paper-200 p-5 relative overflow-hidden">
              <div aria-hidden className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-brand-100/60 blur-2xl"/>
              <div className="relative">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600">
                    <Icon name="sparkle" className="w-5 h-5"/>
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-ink-900 text-sm">Quick AI price check</div>
                    <div className="text-ink-700/60 text-xs">Free · 0.4s · powered by 240k records</div>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 px-3 h-11 rounded-lg bg-paper-50 border border-paper-200">
                  <Icon name="search" className="w-4 h-4 text-ink-700/50 shrink-0"/>
                  <input className="flex-1 bg-transparent outline-none text-sm text-ink-900 placeholder-ink-700/40" placeholder="e.g. 2021 Civic Oriel"/>
                </div>
                <button className="btn-primary mt-3 w-full h-10 rounded-lg text-white font-semibold text-sm">
                  Check fair price →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const [email, setEmail] = useState('');
  return (
    <footer className="relative bg-ink-950 text-white overflow-hidden border-t border-white/5">
      {/* atmospheric backdrop */}
      <div aria-hidden className="absolute -top-40 left-1/4 w-[800px] h-[800px] rounded-full pointer-events-none" style={{background:'radial-gradient(circle, rgba(37,99,235,0.18), transparent 60%)', filter:'blur(40px)'}}/>
      <div aria-hidden className="absolute inset-0 opacity-[0.06] pointer-events-none" style={{backgroundImage:'linear-gradient(rgba(96,165,250,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(96,165,250,0.4) 1px, transparent 1px)', backgroundSize:'72px 72px', maskImage:'radial-gradient(ellipse 80% 100% at 50% 0%, black, transparent)'}}/>

      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 relative">
        {/* Newsletter strip */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-10 py-16 border-b border-white/8">
          <div>
            <div className="font-mono text-[11px] tracking-[0.2em] uppercase text-brand-400">/ stay in the loop</div>
            <h3 className="font-bold text-3xl md:text-4xl mt-2 tracking-[-0.02em] leading-[1.1]">
              Hand-picked deals,<br/>delivered every Friday.
            </h3>
            <p className="text-white/60 mt-3 max-w-[48ch]">The 10 best new listings of the week, plus a market pulse for your city. No spam. Unsubscribe anytime.</p>
          </div>
          <form onSubmit={(e)=>{e.preventDefault();}} className="self-end w-full">
            <div className="rounded-2xl bg-white/5 border border-white/10 p-2 backdrop-blur-md flex items-center gap-2">
              <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@gmail.com" className="flex-1 bg-transparent px-3 h-12 outline-none placeholder-white/40 text-white text-[15px]"/>
              <button className="btn-primary h-12 px-5 rounded-xl font-semibold text-sm">Subscribe</button>
            </div>
            <div className="mt-3 flex items-center gap-3 text-[12px] text-white/45">
              <span className="inline-flex items-center gap-1.5"><Icon name="check" className="w-3.5 h-3.5 text-emerald-400"/>Free</span>
              <span>·</span>
              <span className="inline-flex items-center gap-1.5"><Icon name="check" className="w-3.5 h-3.5 text-emerald-400"/>One email / week</span>
              <span>·</span>
              <span className="inline-flex items-center gap-1.5"><Icon name="check" className="w-3.5 h-3.5 text-emerald-400"/>32k subscribers</span>
            </div>
          </form>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-10 py-16">
          <div className="col-span-2 md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_8px_20px_rgba(37,99,235,0.4)]">
                <span className="font-black text-white text-base">A</span>
              </div>
              <div>
                <div className="font-black text-white text-lg leading-none">AutoMart</div>
                <div className="font-mono text-[10px] tracking-[0.18em] text-white/50 mt-1">PK · TRUST-FIRST</div>
              </div>
            </div>
            <p className="text-white/60 max-w-[44ch] leading-relaxed text-[14px]">
              The first car marketplace in Pakistan where every seller is verified and every price is checked. Built in Karachi, made for the whole country.
            </p>

            {/* live status */}
            <div className="mt-5 inline-flex items-center gap-2 px-3 h-8 rounded-full bg-emerald-500/10 border border-emerald-400/25 text-[12px]">
              <span className="pulse-dot" style={{background:'#34d399'}}/>
              <span className="text-emerald-300/95 font-medium">All systems operational</span>
            </div>

            {/* App download */}
            <div className="mt-5 flex flex-wrap gap-2">
              <button className="h-10 px-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 inline-flex items-center gap-2 text-left">
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white"><path d="M17.5 12.5c0-2.6 2.1-3.8 2.2-3.9-1.2-1.8-3.1-2-3.7-2-1.6-.2-3.1.9-3.9.9-.8 0-2-.9-3.4-.9-1.7 0-3.3 1-4.2 2.6-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.3 2.6 1.3-.1 1.8-.9 3.4-.9 1.6 0 2 .9 3.4.9 1.4 0 2.3-1.3 3.2-2.5 1-1.4 1.4-2.8 1.4-2.9 0 0-2.7-1-2.7-4.1zM15 4.5c.7-.9 1.2-2.1 1.1-3.4-1 .1-2.3.7-3 1.6-.7.8-1.3 2-1.1 3.2 1.1.1 2.3-.5 3-1.4z"/></svg>
                <div className="leading-none">
                  <div className="text-[9px] text-white/55">Download on</div>
                  <div className="text-[12px] font-bold text-white mt-0.5">App Store</div>
                </div>
              </button>
              <button className="h-10 px-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 inline-flex items-center gap-2 text-left">
                <svg viewBox="0 0 24 24" className="w-5 h-5"><path d="M3 3l11 9L3 21V3z" fill="#60a5fa"/><path d="M3 3l11 9L3 21V3z" fill="#34d399" opacity=".6"/></svg>
                <div className="leading-none">
                  <div className="text-[9px] text-white/55">Get it on</div>
                  <div className="text-[12px] font-bold text-white mt-0.5">Google Play</div>
                </div>
              </button>
            </div>
          </div>

          {[
            ['Marketplace', ['Browse cars','Sell a car','Verified sellers','AI Price Insight','Inspection']],
            ['Company',     ['About','Trust & safety','Careers','Press','Contact']],
            ['Resources',   ['How it works','Pricing','FAQ','Buyer guide','Seller guide']],
            ['Cities',      ['Karachi','Lahore','Islamabad','Rawalpindi','Faisalabad']],
          ].map(([title, links]) => (
            <div key={title}>
              <div className="font-mono text-[11px] tracking-[0.2em] text-white/45 uppercase mb-4">{title}</div>
              <ul className="space-y-3">
                {links.map(l => (
                  <li key={l}>
                    <a href="#" className="group inline-flex items-center gap-1 text-white/75 hover:text-white text-[14px]">
                      <span>{l}</span>
                      <span className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-brand-400 text-xs">→</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Massive wordmark */}
        <div className="py-10 border-t border-white/8 overflow-hidden">
          <div className="font-black tracking-[-0.06em] text-white/[0.04] select-none pointer-events-none whitespace-nowrap leading-none" style={{fontSize:'clamp(110px, 19vw, 240px)'}}>
            AUTOMART · PK
          </div>
        </div>

        {/* Bottom strip */}
        <div className="py-7 border-t border-white/8 flex items-center justify-between flex-wrap gap-4 text-white/50 text-[13px]">
          <div className="flex items-center gap-4 flex-wrap">
            <span>© 2026 AutoMart Technologies (Pvt) Ltd.</span>
            <span className="hidden sm:inline text-white/20">·</span>
            <span className="inline-flex items-center gap-2 px-2.5 h-7 rounded-full pak-ribbon border border-white/15 text-[11px] text-white/95" style={{animation:'shine 6s linear infinite'}}>
              <span>🇵🇰</span><span className="font-medium">Made in Pakistan</span>
            </span>
          </div>
          <div className="flex items-center gap-5 text-[13px]">
            <a href="#" className="hover:text-white/85">Privacy</a>
            <a href="#" className="hover:text-white/85">Terms</a>
            <a href="#" className="hover:text-white/85">Cookies</a>
            <span className="hidden md:inline text-white/20">·</span>
            <div className="hidden md:flex items-center gap-1 bg-white/5 border border-white/10 rounded-full p-1">
              <button className="px-2.5 h-6 rounded-full bg-white/15 text-white text-[11px] font-semibold">EN</button>
              <button className="px-2.5 h-6 rounded-full text-white/55 hover:text-white text-[11px] font-semibold">اردو</button>
            </div>
            <div className="hidden md:flex items-center gap-2">
              {[
                ['x', <svg key="s" viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current"><path d="M17.5 3h3l-7 8 8.5 10h-6.5l-5-6.3L4.5 21H1.5l7.5-8.5L1 3h6.6l4.5 5.9L17.5 3z"/></svg>],
                ['ig', <svg key="s" viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17" cy="7" r="0.8" fill="currentColor"/></svg>],
                ['yt', <svg key="s" viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current"><path d="M22 7.5c-.3-1.6-1.3-2.4-2.8-2.6C16.5 4.5 12 4.5 12 4.5s-4.5 0-7.2.4C3.3 5.1 2.3 5.9 2 7.5c-.3 1.6-.3 4.5-.3 4.5s0 2.9.3 4.5c.3 1.6 1.3 2.4 2.8 2.6 2.7.4 7.2.4 7.2.4s4.5 0 7.2-.4c1.5-.2 2.5-1 2.8-2.6.3-1.6.3-4.5.3-4.5s0-2.9-.3-4.5zM10 15.5v-7l6 3.5-6 3.5z"/></svg>],
                ['li', <svg key="s" viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current"><path d="M4.5 3.5a2.5 2.5 0 110 5 2.5 2.5 0 010-5zM3 9.5h3V21H3V9.5zM9 9.5h2.9v1.6h.04c.4-.7 1.4-1.6 3-1.6 3.2 0 3.8 2.1 3.8 4.8V21H15.7v-5.3c0-1.3 0-2.9-1.8-2.9s-2 1.4-2 2.8V21H9V9.5z"/></svg>],
              ].map(([k, svg]) => (
                <a key={k} href="#" className="w-8 h-8 rounded-full bg-white/5 border border-white/10 hover:bg-brand-600 hover:border-brand-500 flex items-center justify-center text-white/70 hover:text-white transition-all">{svg}</a>
              ))}
            </div>
            <span className="font-mono text-[11px] tracking-wider text-white/30">v 2026.05</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ============================================================
   Inline icon set
   ============================================================ */
function Icon({ name, className='' }) {
  const c = className;
  switch(name) {
    case 'shield': return <svg viewBox="0 0 24 24" fill="none" className={c}><path d="M12 3l8 3v6c0 5-3.5 8.5-8 9.5C7.5 20.5 4 17 4 12V6l8-3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/><path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;
    case 'wrench': return <svg viewBox="0 0 24 24" fill="none" className={c}><path d="M14.7 6.3a4 4 0 015.5 5.5l-3 3-7 7-3-3 7-7 3-3 -2.5-2.5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/><circle cx="7" cy="17" r="1" fill="currentColor"/></svg>;
    case 'gavel': return <svg viewBox="0 0 24 24" fill="none" className={c}><path d="M14 6l4 4-2 2-4-4 2-2zm-1 5l-7 7 2 2 7-7-2-2zM4 21h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>;
    case 'search': return <svg viewBox="0 0 24 24" fill="none" className={c}><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8"/><path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;
    case 'arrow-right': return <svg viewBox="0 0 24 24" fill="none" className={c}><path d="M5 12h14m0 0l-5-5m5 5l-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;
    case 'check': return <svg viewBox="0 0 24 24" fill="none" className={c}><path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
    case 'pin': return <svg viewBox="0 0 24 24" fill="none" className={c}><path d="M12 21s-7-7.5-7-12a7 7 0 1114 0c0 4.5-7 12-7 12z" stroke="currentColor" strokeWidth="1.6"/><circle cx="12" cy="9.5" r="2.4" stroke="currentColor" strokeWidth="1.6"/></svg>;
    case 'gauge': return <svg viewBox="0 0 24 24" fill="none" className={c}><path d="M3 13a9 9 0 0118 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/><path d="M12 13l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="12" cy="13" r="1.4" fill="currentColor"/></svg>;
    case 'sparkle': return <svg viewBox="0 0 24 24" fill="none" className={c}><path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3z" fill="currentColor"/><path d="M19 15l.7 1.8L21.5 17.5l-1.8.7L19 20l-.7-1.8L16.5 17.5l1.8-.7L19 15z" fill="currentColor" opacity="0.7"/></svg>;
    case 'chat': return <svg viewBox="0 0 24 24" fill="none" className={c}><path d="M4 7a3 3 0 013-3h10a3 3 0 013 3v7a3 3 0 01-3 3H10l-5 4v-4H7a3 3 0 01-3-3V7z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></svg>;
    case 'key': return <svg viewBox="0 0 24 24" fill="none" className={c}><circle cx="8" cy="14" r="4" stroke="currentColor" strokeWidth="1.6"/><path d="M11 14h10m-3-3v6m-3-3v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>;
    case 'star': return <svg viewBox="0 0 24 24" className={c}><path d="M12 3.5l2.6 5.6 6 .8-4.4 4.2 1.1 6.1L12 17.4l-5.3 2.8 1.1-6.1L3.4 9.9l6-.8L12 3.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/></svg>;
    case 'fuel': return <svg viewBox="0 0 24 24" fill="none" className={c}><path d="M5 4a1 1 0 011-1h7a1 1 0 011 1v17H5V4z" stroke="currentColor" strokeWidth="1.6"/><path d="M5 11h9" stroke="currentColor" strokeWidth="1.4"/><path d="M14 8l3 2v8a2 2 0 002 2v-8l-2-2-3-2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/></svg>;
    default: return null;
  }
}

/* ============================================================
   App
   ============================================================ */
function App() {
  // basic scroll-reveal
  useEffect(() => {
    const els = document.querySelectorAll('.scroll-reveal');
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in'); });
    }, { threshold: 0.12 });
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);
  return (
    <div className="bg-ink-950">
      <TopNav/>
      <StickySearch/>
      <Hero/>
      <ChipsMarquee/>
      <WhyAutoMart/>
      <FeaturedListings/>
      <AIPriceInsight/>
      <HowItWorks/>
      <VerifiedSellers/>
      <BodyTypes/>
      <SellCTA/>
      <FAQTeaser/>
      <Footer/>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
