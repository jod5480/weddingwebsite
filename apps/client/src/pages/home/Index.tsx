import { useEffect, useState } from "react";
import { ArrowDownRight, ArrowRight, ArrowUpRight, Check, ChevronDown, Menu, Music, Play, Sparkles, X } from "lucide-react";
import Petals from "../../components/Petals";
import Rolling3DRings from "../../components/Rolling3DRings";
import { FallingFlowers } from "../../components/FallingFlowers";
import BackgroundMusic from "../../components/BackgroundMusic";
import { Parallax3DCouple } from "../../components/Parallax3DCouple";
import { apiFetch } from "@/lib/api";

const couple = {
  first: "Anandhu",
  second: "Vishnupriya",
  full: "Anandhu & Vishnupriya",
  dateLabel: "19 October 2026",
  isoDate: "2026-10-19T11:50:00+05:30",
};

const timeline = [
  { year: "2019", title: "The first hello", text: "We met over a chai that went cold because the conversation never did.", image: "/assets/slots/story.first-meet.jpg", slot: "story.first-meet", alt: "Two friends sharing chai at a cafe" },
  { year: "2020", title: "A little more often", text: "Friendship became our favourite place to be — even when the world was staying in.", image: "/assets/slots/gallery.editorial.jpg", slot: "gallery.editorial", alt: "The couple walking together at blue hour" },
  { year: "2022", title: "Somewhere along the way", text: "We stopped calling it friendship. We started calling it ours.", image: "/assets/slots/story.yes.jpg", slot: "story.yes", alt: "A delicate ring resting on a handwritten note" },
  { year: "2024", title: "She said yes", text: "There was a ring, a little rain, and a very confident answer.", image: "/assets/slots/home.hero.jpg", slot: "home.hero", alt: "A couple standing together beneath warm courtyard lights" },
  { year: "2026", title: "And now…", text: "We get to celebrate the beginning of forever with the people who made us who we are.", image: "/assets/slots/wedding.jpg", slot: "wedding", alt: "Anandhu & Vishnupriya in traditional wedding attire" },
];

const events = [
  { name: "Wedding", date: "19 October", time: "11:50 AM", venue: "തിങ്കൾ 2026 (1202, തുലാം 2)", tone: "wine" },
];

const formatTime = (value: number) => value.toString().padStart(2, "0");

const Index = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [entered, setEntered] = useState(false);
  const [activeTimeline, setActiveTimeline] = useState(0);
  const [videoOpen, setVideoOpen] = useState(false);
  const [guestbookName, setGuestbookName] = useState("");
  const [guestbookMessage, setGuestbookMessage] = useState("");
  const [guestbookNotes, setGuestbookNotes] = useState<Array<{ name: string; message: string }>>([]);
  const [rsvp, setRsvp] = useState({ name: "", contact: "", attending: "yes", guests: "1", meal: "non-vegetarian", message: "" });
  const [rsvpSent, setRsvpSent] = useState(false);
  const [isSubmittingRsvp, setIsSubmittingRsvp] = useState(false);
  const [rsvpError, setRsvpError] = useState("");
  const [rsvpMode, setRsvpMode] = useState<'create' | 'lookup' | 'edit'>('create');
  const [lookupCreds, setLookupCreds] = useState({ name: '', contact: '' });
  const [isSearchingRsvp, setIsSearchingRsvp] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [isUpdatedSuccess, setIsUpdatedSuccess] = useState(false);
  const [currentRsvpId, setCurrentRsvpId] = useState('');
  const [secretOpen, setSecretOpen] = useState(false);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, complete: false });



  useEffect(() => {
    document.title = "Anandhu & Vishnupriya — The Beginning of Forever";
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const remaining = new Date(couple.isoDate).getTime() - Date.now();
      if (remaining <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0, complete: true });
        return;
      }
      setCountdown({
        days: Math.floor(remaining / 86400000),
        hours: Math.floor((remaining / 3600000) % 24),
        minutes: Math.floor((remaining / 60000) % 60),
        seconds: Math.floor((remaining / 1000) % 60),
        complete: false,
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-nav-section]"));
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target instanceof HTMLElement) setActiveSection(visible.target.dataset.navSection ?? "home");
      },
      { rootMargin: "-18% 0px -62% 0px", threshold: [0.1, 0.3, 0.6] },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const reveal = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.target.classList.toggle("is-visible", entry.isIntersecting)),
      { threshold: 0.18 },
    );
    document.querySelectorAll(".reveal").forEach((element) => reveal.observe(element));
    return () => reveal.disconnect();
  }, [entered]);

  const navItems = [
    { id: "home", label: "Home" },
    { id: "couple", label: "The Couple" },
    { id: "day", label: "The day" },
    { id: "rsvp", label: "RSVP" },
  ];

  const scrollTo = (id: string) => {
    const target = id === "day"
      ? (document.getElementById("day") || document.getElementById("events") || document.getElementById("date"))
      : document.getElementById(id);
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
    setMenuOpen(false);
  };

  const handleGuestbook = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!guestbookName.trim() || !guestbookMessage.trim()) return;
    setGuestbookNotes((notes) => [{ name: guestbookName.trim(), message: guestbookMessage.trim() }, ...notes]);
    setGuestbookName("");
    setGuestbookMessage("");
  };

  const handleRsvp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!rsvp.name.trim() || !rsvp.contact.trim() || isSubmittingRsvp) return;

    setIsSubmittingRsvp(true);
    setRsvpError("");

    try {
      const response = await apiFetch("/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: rsvp.name,
          contact: rsvp.contact,
          attending: rsvp.attending,
          guests: rsvp.guests,
          meal: rsvp.meal,
          message: rsvp.message
        }),
        silent: true
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        if (response.status === 409 || data?.error?.code === "DUPLICATE_RSVP") {
          setRsvpError(
            data?.error?.message ||
              "An RSVP has already been submitted with this phone number or email."
          );
        } else {
          setRsvpError(data?.error?.message || "Failed to submit RSVP. Please check your details.");
        }
        return;
      }

      setIsUpdatedSuccess(false);
      setRsvpSent(true);
    } catch (err) {
      console.error("RSVP submission error:", err);
      setRsvpError("A network error occurred. Please try again.");
    } finally {
      setIsSubmittingRsvp(false);
    }
  };

  const handleLookupRsvp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!lookupCreds.name.trim() || !lookupCreds.contact.trim() || isSearchingRsvp) return;

    setIsSearchingRsvp(true);
    setLookupError("");

    try {
      const response = await apiFetch("/rsvp/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: lookupCreds.name.trim(),
          contact: lookupCreds.contact.trim()
        }),
        silent: true
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.ok || !data?.data?.rsvp) {
        setLookupError(
          data?.error?.message ||
            "No matching RSVP was found for this Name and Phone/Email. Please check the spelling or submit a new RSVP."
        );
        return;
      }

      const existing = data.data.rsvp;
      setCurrentRsvpId(existing.id || "");
      setRsvp({
        name: existing.name || "",
        contact: existing.contact || "",
        attending: existing.attending || "yes",
        guests: String(existing.guests || "1"),
        meal: existing.meal || "non-vegetarian",
        message: existing.message || ""
      });
      setRsvpMode("edit");
      setLookupError("");
    } catch (err) {
      console.error("Lookup error:", err);
      setLookupError("Failed to verify credentials. Please try again.");
    } finally {
      setIsSearchingRsvp(false);
    }
  };

  const handleUpdateRsvp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!rsvp.name.trim() || !rsvp.contact.trim() || isSubmittingRsvp) return;

    setIsSubmittingRsvp(true);
    setRsvpError("");

    try {
      const response = await apiFetch("/rsvp/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: currentRsvpId,
          name: rsvp.name,
          contact: rsvp.contact,
          attending: rsvp.attending,
          guests: rsvp.guests,
          meal: rsvp.meal,
          message: rsvp.message
        }),
        silent: true
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.ok) {
        setRsvpError(data?.error?.message || "Failed to update RSVP. Please try again.");
        return;
      }

      setIsUpdatedSuccess(true);
      setRsvpSent(true);
    } catch (err) {
      console.error("Update error:", err);
      setRsvpError("A network error occurred. Please try again.");
    } finally {
      setIsSubmittingRsvp(false);
    }
  };

  const [loadingState, setLoadingState] = useState<'loading' | 'fading' | 'done'>('loading');

  const handleOpenInvitation = () => {
    if (loadingState === 'done') return;
    window.__playWeddingMusic?.();
    setLoadingState('fading');
    setTimeout(() => setLoadingState('done'), 1200);
  };

  useEffect(() => {
    // Graceful fallback timer in case user never clicks (8 seconds)
    const timer = setTimeout(() => {
      setLoadingState((curr) => curr === 'loading' ? 'fading' : curr);
      setTimeout(() => setLoadingState('done'), 1200);
    }, 8000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {loadingState !== 'done' && (
        <div
          className={`loading-screen ${loadingState === 'fading' ? 'fade-out' : ''}`}
          onClick={handleOpenInvitation}
          style={{ cursor: 'pointer' }}
          role="button"
          tabIndex={0}
          aria-label="Open wedding invitation"
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleOpenInvitation(); }}
        >
          <div className="loading-content" onClick={(e) => e.stopPropagation()}>
            <img src="/assets/logo.png" className="loading-logo" alt="Anandhu & Vishnupriya Monogram" />
            <h2 className="loading-names">Anandhu &amp; Vishnupriya</h2>
            <p className="loading-date">19 · October · 2026</p>
            <button
              type="button"
              className="open-invitation-btn"
              onClick={handleOpenInvitation}
            >
              <Music size={14} />
              <span>Open Invitation</span>
            </button>
          </div>
          <div className="falling-flowers">
            <img src="/assets/flower.png" decoding="async" className="falling-flower f-1" alt="" />
            <img src="/assets/flower.png" decoding="async" className="falling-flower f-2" alt="" />
            <img src="/assets/flower.png" decoding="async" className="falling-flower f-3" alt="" />
            <img src="/assets/flower.png" decoding="async" className="falling-flower f-4" alt="" />
            <img src="/assets/flower.png" decoding="async" className="falling-flower f-5" alt="" />
            <img src="/assets/flower.png" decoding="async" className="falling-flower f-6" alt="" />
          </div>
        </div>
      )}
      <div
        className={`wedding-site ${entered ? "experience-entered" : ""} ${loadingState === 'done' || loadingState === 'fading' ? 'is-loaded' : ''}`}
      >
        <header className={`site-nav ${activeSection !== "home" ? "is-scrolled" : ""}`}>
          <button className="monogram" aria-label="Anandhu & Vishnupriya - Return to top" onClick={() => scrollTo("home")}>
            <img src="/assets/logo.png" alt="Anandhu & Vishnupriya Monogram" className="h-[36px] w-auto object-contain" />
          </button>
          <nav className="desktop-nav" aria-label="Main navigation">
            {navItems.map((item) => (
              <button key={item.id} className={activeSection === item.id ? "active" : ""} onClick={() => scrollTo(item.id)}>{item.label}</button>
            ))}
          </nav>
          <button className="menu-button" aria-expanded={menuOpen} aria-controls="mobile-menu" onClick={() => setMenuOpen((open) => !open)}><Menu size={19} /><span>Menu</span></button>
        </header>

        <div id="mobile-menu" className={`mobile-menu ${menuOpen ? "open" : ""}`} aria-hidden={!menuOpen}>
          <button className="mobile-menu-close" onClick={() => setMenuOpen(false)} aria-label="Close menu"><X /></button>
          <span className="eyebrow">Vishnupriya + Anandhu · 19.10.26</span>
          {navItems.map((item, index) => <button key={item.id} style={{ transitionDelay: `${index * 50}ms` }} onClick={() => scrollTo(item.id)}>{item.label}<ArrowDownRight size={18} /></button>)}
          <p>Come for the vows.<br />Stay for the dancing.</p>
        </div>

        <main>
          <section id="home" data-nav-section="home" className="hero-section">
            <div data-image-slot="home.hero" className="hero-image" style={{ backgroundImage: "url('/assets/slots/home.hero.jpg')" }} />
            <div className="hero-vignette" />
            <div className="hero-grain" />
            <div className="hero-flower flower-top-left"><img src="/assets/flower.png" alt="" /></div>
            <div className="hero-flower flower-bottom-right"><img src="/assets/flower.png" alt="" /></div>
            <div className="hero-content">
              <p className="eyebrow hero-animate-1">A modern love story</p>
              <h1 className="hero-title hero-animate-2" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span>The beginning</span>
                <span style={{ marginTop: '0.05em' }}>of</span>
                <span style={{ marginTop: '-0.2em' }}><em>forever.</em></span>
              </h1>
              <div className="hero-names hero-animate-3">
                <span>{couple.first}</span><i>&</i><span>{couple.second}</span>
              </div>
              <p className="hero-date hero-animate-4">{couple.dateLabel}</p>
              <button className="enter-button hero-animate-5" onClick={() => { window.__playWeddingMusic?.(); setEntered(true); scrollTo("day"); }} onMouseEnter={() => setCursorLabel("ENTER")} onMouseLeave={() => setCursorLabel("")}>
                {entered ? "Keep reading" : "Are you ready to witness a love story?"}<ArrowDownRight size={18} />
              </button>
            </div>
            <div className="hero-footer" style={{ justifyContent: 'center', gap: '8px' }}><span>Scroll gently</span><ChevronDown size={16} /></div>
          </section>

          <section className="countdown-section section-shell section-soft">
            <Petals />
            <div className="countdown-block reveal"><div><p className="eyebrow">The big day</p><h2>{countdown.complete ? "Today is the day." : "Counting down to us."}</h2></div>{!countdown.complete && <div className="countdown-grid">{[["days", countdown.days], ["hours", countdown.hours], ["minutes", countdown.minutes], ["seconds", countdown.seconds]].map(([label, value]) => <div key={label} className="countdown-cell"><strong>{formatTime(Number(value))}</strong><span>{label}</span></div>)}</div>}</div>
          </section>

          <section id="couple" data-nav-section="couple" className="couple-section section-shell">
            <div className="section-intro reveal"><p className="eyebrow">The two of us</p><h2>Different in<br /><em>all the right ways.</em></h2></div>
            <div className="couple-showcase reveal">
              <div className="couple-wedding-card">
                <Parallax3DCouple
                  backgroundSrc="/assets/slots/background.jpg"
                  coupleSrc="/assets/slots/couplepng.png"
                  alt="Anandhu & Vishnupriya"
                />
              </div>
              <div className="couple-cards-grid">
                <article className="person-card person-a reveal">
                  <div className="person-meta">
                    <span className="person-badge">The Groom</span>
                    <h3>Anandhu S Dharan</h3>
                    <p>
                      S/O Thulasi Dharan &amp; Sudha Thulasi<br />
                      Krishnakripa, Varinjam Kalluvathukkal<br />
                      Kollam
                    </p>
                  </div>
                </article>
                <article className="person-card person-b reveal">
                  <div className="person-meta">
                    <span className="person-badge">The Bride</span>
                    <h3>Vishnupriya B S</h3>
                    <p>
                      D/O Babu V &amp; Sandhya T<br />
                      Pythodil Puthuval Sharavanam, Neendakara<br />
                      Kollam-691582
                    </p>
                  </div>
                </article>
              </div>
            </div>
          </section>

          <section id="events" data-nav-section="day" className="events-section section-shell tone-wine relative overflow-hidden">
            <div id="day" className="absolute -top-16" />
            <div id="date" className="absolute -top-16" />
            {/* Temple silhouette image pinned to bottom */}
            <img
              src="/assets/temple_silhouette_kerala.jpg"
              alt=""
              aria-hidden="true"
              loading="lazy"
              decoding="async"
              className="pointer-events-none"
              style={{
                position: 'absolute',
                bottom: -280,
                left: 0,
                width: '100%',
                height: 'auto',
                objectFit: 'contain',
                objectPosition: 'bottom center',
                mixBlendMode: 'darken',
                opacity: 0.12,
                zIndex: 0,
              }}
            />
            <FallingFlowers />
            <div className="section-intro reveal relative z-10"><p className="eyebrow">Make a day of it</p><h2>The moment.<br /><em>We say I do.</em></h2></div>
            <div className="event-grid relative z-10">{events.map((event) => <article key={event.name} className={`event-card tone-${event.tone} reveal`}>
              <img src="/assets/flower2.png" alt="" loading="lazy" decoding="async" className="event-flower flower-tl" />
              <img src="/assets/flower2.png" alt="" loading="lazy" decoding="async" className="event-flower flower-br" />
              <p className="eyebrow">{event.name}</p><h3>{event.date}</h3><p className="event-venue">{event.venue}</p><div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center' }}><p className="eyebrow">Muhurtham Time</p><p className="event-time" style={{ margin: 0, fontSize: '16px', color: 'var(--gold)' }}>11:50 AM to 12:20 PM</p></div></article>)}</div>
            <div id="venue" className="venue-block reveal relative z-10"><div className="venue-copy relative z-10"><p className="eyebrow">Come celebrate with us</p><h2>Kannattukudi<br /><em>Mahadevi Temple.</em></h2><p>Neendakara Dalavapuram Rd, Neendakara<br />Kollam, Kerala 691582</p><button className="glass-button" onClick={() => window.open("https://maps.app.goo.gl/EH2mc193URJzSuDa8", "_blank", "noopener,noreferrer")}>Get directions <ArrowUpRightIcon /></button></div></div>
          </section>

          <section id="guestbook" className="guestbook-section section-shell section-soft">
            <div className="guestbook-grid"><div className="guestbook-copy reveal"><p className="eyebrow">A little love, in writing</p><h2>Leave us a<br /><em>little love.</em></h2><p>Share a note, a memory, or your best unsolicited marriage advice.</p><form onSubmit={handleGuestbook}><label>Your name<input value={guestbookName} onChange={(event) => setGuestbookName(event.target.value)} placeholder="Your name" /></label><label>Your message<textarea value={guestbookMessage} onChange={(event) => setGuestbookMessage(event.target.value)} placeholder="Write something lovely…" rows={3} /></label><button className="solid-button" type="submit">Send love <ArrowUpRightIcon /></button></form></div>{guestbookNotes.length > 0 && (<div className="notes-wall reveal">{guestbookNotes.map((note, index) => <article key={`${note.name}-${index}`} className={`love-note note-${index % 3}`}><Sparkles size={15} /><p>{note.message}</p><span>— {note.name}</span></article>)}</div>)}</div>
          </section>

          <section id="rsvp" data-nav-section="rsvp" className="rsvp-section section-shell section-dark">
            <div className="rsvp-intro reveal relative z-40"><p className="eyebrow">One last thing</p><h2>We’d love<br /><em>to have you.</em></h2><p>Tell us you’re coming so we can save you a seat, a drink, and a story worth retelling.</p></div>
            <div className="rsvp-card reveal relative z-40">
              {/* Tab Navigation for New RSVP vs Manage Existing RSVP */}
              {!rsvpSent && (
                <div style={{ display: 'flex', gap: '8px', marginBottom: '22px', borderBottom: '1px solid rgba(255,255,255,0.12)', paddingBottom: '12px' }}>
                  <button
                    type="button"
                    onClick={() => { setRsvpMode('create'); setRsvpError(''); setLookupError(''); }}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: '8px 14px',
                      cursor: 'pointer',
                      fontFamily: 'Manrope, sans-serif',
                      fontSize: '11px',
                      fontWeight: 600,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: rsvpMode === 'create' ? 'var(--gold)' : 'rgba(255,255,255,0.5)',
                      borderBottom: rsvpMode === 'create' ? '2px solid var(--gold)' : '2px solid transparent',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    New RSVP
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRsvpMode(currentRsvpId ? 'edit' : 'lookup');
                      setRsvpError('');
                      setLookupError('');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: '8px 14px',
                      cursor: 'pointer',
                      fontFamily: 'Manrope, sans-serif',
                      fontSize: '11px',
                      fontWeight: 600,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: rsvpMode === 'lookup' || rsvpMode === 'edit' ? 'var(--gold)' : 'rgba(255,255,255,0.5)',
                      borderBottom: rsvpMode === 'lookup' || rsvpMode === 'edit' ? '2px solid var(--gold)' : '2px solid transparent',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    Already RSVP’d? Edit
                  </button>
                </div>
              )}

              {rsvpSent ? (
                <div className="rsvp-success">
                  <div className="success-mark"><Check /></div>
                  <p className="eyebrow">Thank you, {rsvp.name}.</p>
                  <h3>{isUpdatedSuccess ? <>Your RSVP is<br /><em>updated.</em></> : <>You’re on<br /><em>the list.</em></>}</h3>
                  <p style={{ marginTop: "12px", fontSize: "15px", lineHeight: "1.6" }}>
                    Your RSVP response has been {isUpdatedSuccess ? "updated and sent" : "sent"} to{" "}
                    <strong style={{ color: "var(--gold)" }}>Anandhu &amp; Vishnupriya</strong>.
                  </p>
                  <div style={{ marginTop: "16px", padding: "14px 18px", borderRadius: "8px", background: "rgba(255,255,255,0.06)", fontSize: "13px", textAlign: "left", lineHeight: "1.7" }}>
                    <p style={{ margin: "2px 0" }}><strong>Status:</strong> {rsvp.attending === "yes" ? "Attending 🎉" : "Not attending"}</p>
                    <p style={{ margin: "2px 0" }}><strong>Number of Guests:</strong> {rsvp.guests}</p>
                    <p style={{ margin: "2px 0" }}><strong>Meal:</strong> {rsvp.meal}</p>
                    {rsvp.message && <p style={{ margin: "2px 0" }}><strong>Note:</strong> “{rsvp.message}”</p>}
                  </div>
                  <p style={{ marginTop: "14px", fontSize: "13px", opacity: 0.85 }}>We’ll see you at Kannattukudi Mahadevi Temple on 19 October 2026!</p>
                  <button className="text-link" onClick={() => { setRsvpSent(false); setRsvpMode('edit'); }} style={{ marginTop: "16px" }}>
                    Edit response <ArrowRight size={15} />
                  </button>
                </div>
              ) : rsvpMode === 'lookup' ? (
                <form onSubmit={handleLookupRsvp}>
                  <div style={{ marginBottom: "18px", textAlign: "left" }}>
                    <p style={{ margin: "0 0 6px", fontSize: "15px", color: "var(--gold)", fontWeight: 600 }}>Login to Edit Your RSVP</p>
                    <p style={{ margin: 0, fontSize: "12px", opacity: 0.8, lineHeight: "1.6" }}>
                      Enter your <strong>Name</strong> (username) and registered <strong>Phone or Email</strong> (password) to view and edit your response.
                    </p>
                  </div>
                  <div className="form-row">
                    <label>Your Name (Username)<input required value={lookupCreds.name} onChange={(event) => setLookupCreds({ ...lookupCreds, name: event.target.value })} placeholder="Your full name" /></label>
                    <label>Phone / Email (Password)<input required value={lookupCreds.contact} onChange={(event) => setLookupCreds({ ...lookupCreds, contact: event.target.value })} placeholder="Phone or email" /></label>
                  </div>
                  {lookupError && (
                    <div
                      style={{
                        margin: "12px 0 16px",
                        padding: "12px 16px",
                        borderRadius: "8px",
                        backgroundColor: "rgba(220, 38, 38, 0.2)",
                        border: "1px solid rgba(248, 113, 113, 0.45)",
                        color: "#fecaca",
                        fontSize: "13px",
                        lineHeight: "1.5",
                        textAlign: "left"
                      }}
                    >
                      <strong>Note:</strong> {lookupError}
                    </div>
                  )}
                  <button type="submit" disabled={isSearchingRsvp} className="solid-button light" style={{ opacity: isSearchingRsvp ? 0.7 : 1 }}>
                    {isSearchingRsvp ? "Verifying…" : <>Find &amp; Edit My RSVP <ArrowUpRightIcon /></>}
                  </button>
                </form>
              ) : (
                <form onSubmit={rsvpMode === 'edit' ? handleUpdateRsvp : handleRsvp}>
                  {rsvpMode === 'edit' && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', padding: '10px 14px', borderRadius: '6px', background: 'rgba(212, 175, 55, 0.15)', border: '1px solid rgba(212, 175, 55, 0.3)' }}>
                      <span style={{ fontSize: '12px', color: '#f7d58b', fontWeight: 600 }}>Editing RSVP for: {rsvp.name}</span>
                      <button type="button" onClick={() => { setRsvpMode('create'); }} style={{ background: 'none', border: 'none', color: '#f7d58b', fontSize: '11px', cursor: 'pointer', textDecoration: 'underline' }}>
                        Cancel edit
                      </button>
                    </div>
                  )}
                  <div className="form-row">
                    <label>Name<input required value={rsvp.name} onChange={(event) => setRsvp({ ...rsvp, name: event.target.value })} placeholder="Your full name" /></label>
                    <label>Phone / email<input required value={rsvp.contact} onChange={(event) => setRsvp({ ...rsvp, contact: event.target.value })} placeholder="Phone or email" /></label>
                  </div>
                  <fieldset>
                    <legend>Attending?</legend>
                    <div className="choice-row">
                      <button type="button" className={rsvp.attending === "yes" ? "selected" : ""} onClick={() => setRsvp({ ...rsvp, attending: "yes" })}>Yes, I’ll be there</button>
                      <button type="button" className={rsvp.attending === "no" ? "selected" : ""} onClick={() => setRsvp({ ...rsvp, attending: "no" })}>Sadly, I can’t make it</button>
                    </div>
                  </fieldset>
                  <div className="form-row">
                    <label>Number of guests
                      <select value={rsvp.guests} onChange={(event) => setRsvp({ ...rsvp, guests: event.target.value })}>
                        {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                          <option key={num} value={num}>{num}</option>
                        ))}
                      </select>
                    </label>
                    <label>Meal preference
                      <select value={rsvp.meal} onChange={(event) => setRsvp({ ...rsvp, meal: event.target.value })}>
                        <option value="vegetarian">Vegetarian</option>
                        <option value="non-vegetarian">Non-vegetarian</option>
                        <option value="vegan">Vegan</option>
                      </select>
                    </label>
                  </div>
                  <label>Message for the couple
                    <textarea rows={3} value={rsvp.message} onChange={(event) => setRsvp({ ...rsvp, message: event.target.value })} placeholder="A note for Vishnupriya + Anandhu…" />
                  </label>
                  {rsvpError && (
                    <div
                      style={{
                        margin: "12px 0 16px",
                        padding: "12px 16px",
                        borderRadius: "8px",
                        backgroundColor: "rgba(220, 38, 38, 0.2)",
                        border: "1px solid rgba(248, 113, 113, 0.45)",
                        color: "#fecaca",
                        fontSize: "13px",
                        lineHeight: "1.5",
                        textAlign: "left"
                      }}
                    >
                      <div><strong>Note:</strong> {rsvpError}</div>
                      {rsvpMode === 'create' && (
                        <button
                          type="button"
                          onClick={() => {
                            setRsvpMode('lookup');
                            setLookupCreds({ name: rsvp.name, contact: rsvp.contact });
                            setLookupError('');
                            setRsvpError('');
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#f7d58b',
                            textDecoration: 'underline',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 600,
                            padding: 0,
                            marginTop: '8px',
                            display: 'inline-block'
                          }}
                        >
                          Click here to log in &amp; edit your existing RSVP →
                        </button>
                      )}
                    </div>
                  )}
                  <button type="submit" disabled={isSubmittingRsvp} className="solid-button light" style={{ opacity: isSubmittingRsvp ? 0.7 : 1 }}>
                    {isSubmittingRsvp
                      ? (rsvpMode === 'edit' ? "Updating your RSVP…" : "Sending your RSVP…")
                      : (rsvpMode === 'edit' ? <>Save &amp; Update RSVP <ArrowUpRightIcon /></> : <>Confirm my RSVP <ArrowUpRightIcon /></>)}
                  </button>
                </form>
              )}
            </div>
          </section>

          <section id="closing" className="closing-section">
            <div className="closing-image" data-image-slot="home.hero" style={{ backgroundImage: "url('/assets/slots/home.hero.jpg')" }} /><div className="closing-overlay" /><div className="closing-content reveal"><p className="eyebrow">And so,</p><h2>Our forever<br /><em>begins.</em></h2><div className="closing-names">{couple.first}<span>&</span>{couple.second}</div><p className="closing-date">{couple.dateLabel}</p><p className="closing-thanks">Thank you for being part of our story.</p></div><button className="secret-button" onClick={() => setSecretOpen((open) => !open)} aria-label="Reveal a secret"><span>♡</span></button>{secretOpen && <div className="secret-card"><button onClick={() => setSecretOpen(false)} aria-label="Close secret"><X size={16} /></button><p className="eyebrow">You found our little secret.</p><p>“We still argue about who fell first.<br />We’ll let you decide after the wedding.”</p></div>}<footer><span>With love,</span><strong>Vishnupriya + Anandhu</strong><span>19 · 10 · 26</span></footer>
          </section>
          <Rolling3DRings />
        </main>
        <BackgroundMusic />

        {videoOpen && <div className="modal-backdrop video-modal" role="dialog" aria-modal="true" aria-label="Our story video"><button className="modal-close" onClick={() => setVideoOpen(false)} aria-label="Close video"><X /></button><div className="video-frame"><div className="video-frame-image" style={{ backgroundImage: "url('/assets/slots/gallery.editorial.jpg')" }} /><div><p className="eyebrow">A little film by us</p><h2>Everyday, <em>with you.</em></h2><button className="play-button" onClick={() => setVideoOpen(false)}><Play size={15} fill="currentColor" /> Close the film</button></div></div></div>}
      </div>
    </>
  );
};

const ArrowUpRightIcon = () => <ArrowUpRight size={15} />;

export default Index;
