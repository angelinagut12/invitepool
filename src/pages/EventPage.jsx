import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../components/supabaseClient";
import Footer from "../components/Footer";
import { sendEmail } from "../utils/sendEmail";

/* ─── Inject fonts + global styles once ─── */
if (!document.getElementById("ep-fonts")) {
  const link = document.createElement("link");
  link.id = "ep-fonts";
  link.rel = "stylesheet";
  link.href =
    "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600&family=Inter:wght@400;500;600&display=swap";
  document.head.appendChild(link);
}
if (!document.getElementById("ep-styles")) {
  const s = document.createElement("style");
  s.id = "ep-styles";
  s.textContent = `
    * { box-sizing: border-box; }

    @keyframes ep-up {
      from { opacity:0; transform:translateY(16px); }
      to   { opacity:1; transform:translateY(0); }
    }
    .ep-animate { animation: ep-up 0.45s cubic-bezier(.22,1,.36,1) both; }

    .ep-input {
      width: 100%; padding: 12px 14px; margin-top: 6px;
      border: 1.5px solid #e4e4e7; border-radius: 10px;
      font-family: 'Inter', sans-serif; font-size: 0.95rem; color: #6f627d;
      background: #fafafa; outline: none;
      transition: border-color .2s, box-shadow .2s;
    }
    .ep-input:focus { border-color: #71717a; box-shadow: 0 0 0 3px rgba(113,113,122,.1); }
    .ep-input::placeholder { color: #a1a1aa; }

    .ep-btn {
      display: inline-flex; align-items: center; justify-content: center;
      padding: 13px 28px; border-radius: 10px; border: none;
      font-family: 'Inter', sans-serif; font-size: 0.95rem; font-weight: 600;
      background: #6f627d; color: #fff; cursor: pointer;
      transition: background .15s, transform .15s, box-shadow .15s;
      width: 100%;
    }
    .ep-btn:hover { background: #3f3f46; transform: translateY(-1px); box-shadow: 0 4px 14px rgba(116, 12, 145, 0.79); }
    .ep-btn:active { transform: translateY(0); }
    .ep-btn:disabled { opacity: .5; cursor: not-allowed; transform: none; box-shadow: none; }

    .ep-btn-ghost {
      display: inline-flex; align-items: center; justify-content: center;
      padding: 11px 20px; border-radius: 10px;
      border: 1.5px solid #e4e4e7; background: white;
      font-family: 'Inter', sans-serif; font-size: 0.9rem; font-weight: 500; color: #3f3f46;
      cursor: pointer; transition: border-color .15s, background .15s, transform .15s;
    }
    .ep-btn-ghost:hover { border-color: #a1a1aa; background: #fafafa; transform: translateY(-1px); }

    .ep-chip-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin: 1.25rem 0;
    }
    @media (max-width: 380px) { .ep-chip-grid { grid-template-columns: 1fr; } }

    .ep-chip {
      display: flex; align-items: flex-start; gap: 10px;
      padding: 12px 14px; border-radius: 12px;
      background: #f4f4f5; border: 1px solid #e4e4e7;
    }
    .ep-chip-icon {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: #eee7f5;
      color: #8d7f9b;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .ep-chip-label { font-family:'Inter',sans-serif; font-size: 0.7rem; font-weight: 600; color: #71717a; text-transform: uppercase; letter-spacing: .07em; margin: 0 0 3px; }
    .ep-chip-value { font-family:'Inter',sans-serif; font-size: 0.88rem; font-weight: 500; color: #6f627d; margin: 0; line-height: 1.4; }

    .ep-block {
      padding: 14px 16px; border-radius: 12px;
      background: #f4f4f5; border: 1px solid #e4e4e7; margin: 10px 0;
    }
    .ep-block-label { font-family:'Inter',sans-serif; font-size: 0.7rem; font-weight: 600; color: #71717a; text-transform: uppercase; letter-spacing: .07em; margin: 0 0 6px; }
    .ep-block-text  { font-family:'Inter',sans-serif; font-size: 0.92rem; color: #3f3f46; line-height: 1.65; white-space: pre-line; margin: 0; }

    .ep-divider { height: 1px; background: #e4e4e7; border: none; margin: 1.75rem 0; }

    .ep-section-heading {
      font-family: 'Playfair Display', serif;
      font-size: 1.35rem; font-weight: 600; color: #6f627d; margin: 0 0 1rem;
    }

    .ep-guest {
      display: flex; align-items: flex-start; gap: 12px;
      padding: 12px 14px; border-radius: 12px;
      border: 1px solid #e4e4e7; background: white;
      transition: box-shadow .15s;
    }
    .ep-guest:hover { box-shadow: 0 2px 10px rgba(0,0,0,.07); }

    .ep-avatar {
      width: 38px; height: 38px; border-radius: 50%; flex-shrink: 0;
      background: #6f627d; color: white;
      display: flex; align-items: center; justify-content: center;
      font-family: 'Playfair Display', serif; font-size: 1rem; font-weight: 600;
    }
    .ep-avatar.no { background: #e4e4e7; color: #71717a; }

    .ep-badge {
      font-family:'Inter',sans-serif; font-size: 0.72rem; font-weight: 600;
      padding: 3px 9px; border-radius: 999px; white-space: nowrap;
    }
    .ep-badge.yes { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
    .ep-badge.no  { background: #f4f4f5; color: #71717a;  border: 1px solid #e4e4e7; }

    .ep-update {
      padding: 14px 16px; border-radius: 12px;
      border: 1px solid #e4e4e7; border-left: 3px solid #6f627d;
      background: #fafafa;
    }

    .ep-alert {
      padding: 14px 16px; border-radius: 12px; margin-bottom: 1rem;
      font-family: 'Inter', sans-serif; font-size: 0.9rem; line-height: 1.55;
    }
    .ep-alert.error   { background:#fef2f2; color:#991b1b; border:1px solid #fecaca; }
    .ep-alert.success { background:#f0fdf4; color:#166534; border:1px solid #bbf7d0; }
    .ep-alert.warning { background:#fffbeb; color:#92400e; border:1px solid #fde68a; }

    .ep-label {
      font-family: 'Inter', sans-serif; font-size: 0.82rem;
      font-weight: 600; color: #3f3f46; letter-spacing: .02em;
    }

    .ep-expand {
      width: 100%; margin-top: 10px; padding: 11px; border-radius: 10px;
      border: 1.5px solid #e4e4e7; background: white; color: #71717a;
      font-family: 'Inter', sans-serif; font-size: 0.875rem; font-weight: 600;
      cursor: pointer; transition: border-color .15s, color .15s, background .15s;
    }
    .ep-expand:hover { border-color: #a1a1aa; color: #6f627d; background: #fafafa; }

    .ep-shell { min-height: 100vh; }
    .ep-card  { max-width: 620px; margin: 0 auto; background: white; border-radius: 0; }

    @media (min-width: 680px) {
      .ep-shell { padding: 2.5rem 1.5rem 3rem; }
      .ep-card  { border-radius: 20px; box-shadow: 0 4px 32px rgba(0,0,0,.09); overflow: hidden; }
    }

    .ep-unlock-wrap {
      min-height: 100vh; display: flex; align-items: center;
      justify-content: center; padding: 1.5rem; background: #f4f4f5;
    }
    .ep-unlock-box {
      width: 100%; max-width: 420px; background: white;
      border-radius: 20px; padding: 2rem;
      box-shadow: 0 8px 32px rgba(0,0,0,.08); text-align: center;
    }
  `;
  document.head.appendChild(s);
}

/* ── Tiny inline SVG icons ── */
const Ico = ({ name, size = 15 }) => {
  const p = {
    cal:  "M8 2v3M16 2v3M3 8h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
    time: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 6v6l4 2",
    pin:  "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z",
    dead: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 6v6l3 3",
    lock: "M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zM7 11V7a5 5 0 0 1 10 0v4",
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d={p[name]} />
    </svg>
  );
};

const PREVIEW_COUNT = 3;

/* ════════════ GuestList ════════════ */
function GuestList({ rsvps }) {
  const [expanded, setExpanded] = useState(false);
  const attending    = rsvps.filter((r) => r.attending);
  const notAttending = rsvps.filter((r) => !r.attending);
  const total   = rsvps.length;
  const visible = expanded ? rsvps : rsvps.slice(0, PREVIEW_COUNT);

  return (
    <>
      <hr className="ep-divider" />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h2 className="ep-section-heading" style={{ margin: 0 }}>Who's Coming</h2>
        {total > 0 && (
          <span style={{ fontFamily: "'Inter',sans-serif", fontSize: "0.8rem", color: "#71717a" }}>
            {attending.length} going · {notAttending.length} not going
          </span>
        )}
      </div>

      {total === 0 ? (
        <p style={{ fontFamily: "'Inter',sans-serif", color: "#a1a1aa", textAlign: "center", padding: "1.25rem 0" }}>
          No responses yet — be the first!
        </p>
      ) : (
        <>
          <div style={{ display: "grid", gap: "8px" }}>
            {visible.map((rsvp) => (
              <div key={rsvp.id} className="ep-guest">
                <div className={`ep-avatar${rsvp.attending ? "" : " no"}`}>
                  {(rsvp.guest_name || "?")[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontFamily: "'Inter',sans-serif", fontWeight: 600, fontSize: "0.92rem", color: "#6f627d" }}>
                      {rsvp.guest_name}
                    </span>
                    <span className={`ep-badge ${rsvp.attending ? "yes" : "no"}`}>
                      {rsvp.attending
                        ? `Going${rsvp.guest_count > 1 ? ` +${rsvp.guest_count - 1}` : ""}`
                        : "Can't make it"}
                    </span>
                  </div>
                  {rsvp.message && (
                    <p style={{ margin: "4px 0 0", fontSize: "0.82rem", color: "#71717a", fontStyle: "italic", whiteSpace: "pre-line", fontFamily: "'Inter',sans-serif" }}>
                      "{rsvp.message}"
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {total > PREVIEW_COUNT && (
            <button className="ep-expand" onClick={() => setExpanded((p) => !p)}>
              {expanded ? "Show less ↑" : `See all ${total} guests ↓`}
            </button>
          )}
        </>
      )}
    </>
  );
}

/* ════════════ EventPage ════════════ */
function EventPage() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [event, setEvent]               = useState(null);
  const [loading, setLoading]           = useState(true);
  const [rsvps, setRsvps]               = useState([]);
  const [eventUpdates, setEventUpdates] = useState([]);
  const [enteredCode, setEnteredCode]   = useState("");
  const [isUnlocked, setIsUnlocked]     = useState(false);
  const [codeError, setCodeError]       = useState("");
  const [rsvpError, setRsvpError]       = useState("");
  const [rsvpSuccess, setRsvpSuccess]   = useState(false);
  const [editLink, setEditLink]         = useState("");
  const [submitting, setSubmitting]     = useState(false);

  const [existingRsvpFound, setExistingRsvpFound]   = useState(false);
  const [linkRequestSuccess, setLinkRequestSuccess] = useState("");
  const [requestedEditLink, setRequestedEditLink]   = useState("");

  const [rsvpData, setRsvpData] = useState({
    guestName: "",
    email: "",
    phone: "",
    attending: "yes",
    message: "",
    smsOptIn: false,

    children: 1,
    adults: 1,
  });

  useEffect(() => { fetchEvent(); fetchRsvps(); fetchEventUpdates(); }, [id]);

  async function fetchEvent() {
    const { data, error } = await supabase.from("events").select("*").eq("id", id).single();
    if (!error) setEvent(data);
    setLoading(false);
  }
  async function fetchRsvps() {
    const { data } = await supabase
      .from("rsvps").select("id,guest_name,attending,guest_count,message,created_at")
      .eq("event_id", id).order("created_at", { ascending: false });
    setRsvps(data || []);
  }
  async function fetchEventUpdates() {
    const { data } = await supabase
      .from("event_updates").select("*").eq("event_id", id).order("created_at", { ascending: false });
    setEventUpdates(data || []);
  }

  function handleRsvpChange(e) {
    const { name, value, type, checked } = e.target;
    setRsvpData((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
    setRsvpError("");
  }

  async function handleRsvpSubmit(e) {
    e.preventDefault();
    setRsvpError(""); setRsvpSuccess(false); setEditLink("");
    setExistingRsvpFound(false); setSubmitting(true);

    const trimmedEmail = rsvpData.email.trim().toLowerCase();
    const editToken    = crypto.randomUUID();

    const { data: existing } = await supabase
      .from("rsvps").select("id,edit_token")
      .eq("event_id", id).eq("email", trimmedEmail).maybeSingle();

    if (existing) { setExistingRsvpFound(true); setSubmitting(false); return; }

    const { error } = await supabase.from("rsvps").insert([{
      event_id:              id,
      guest_name:            rsvpData.guestName,
      email:                 trimmedEmail,
      phone:                 rsvpData.phone?.trim() || null,
      attending:             rsvpData.attending === "yes",
      guest_count:
        Number(rsvpData.children || 0) +
        Number(rsvpData.adults || 0),
      message:               rsvpData.message,
      sms_opt_in:            rsvpData.smsOptIn,
      sms_opt_in_at:         rsvpData.smsOptIn ? new Date().toISOString() : null,
      edit_token:            editToken,
      edit_token_created_at: new Date().toISOString(),
    }]);

    if (error) { setRsvpError("There was a problem saving your RSVP."); setSubmitting(false); return; }

    const editUrl = `${window.location.origin}/rsvp/edit/${editToken}`;
    setEditLink(editUrl);
    setRsvpSuccess(true);
    fetchRsvps();

    try {
      await sendEmail({
        to: trimmedEmail,
        subject: `You're RSVP'd — ${event.event_title}`,
        html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;">
          <h2 style="color:#6f627d;">You're on the list! 🎉</h2>
          <p>Hi ${rsvpData.guestName || "there"},</p>
          <p>Your RSVP for <strong>${event.event_title}</strong> has been received. The host has been notified.</p>
          <a href="${editUrl}" style="display:inline-block;margin-top:12px;padding:12px 24px;background:#6f627d;color:white;border-radius:10px;text-decoration:none;font-weight:600;">Edit My RSVP</a>
          <p style="margin-top:24px;color:#71717a;font-size:0.85rem;">Save this email so you can find your edit link later.</p>
        </div>`,
      });
    } catch (err) { console.error("Guest email failed:", err.message); }

    if (event.notify_host_on_rsvp && event.host_email) {
      try {
        await sendEmail({
          to: event.host_email,
          subject: `New RSVP — ${event.event_title}`,
          html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;">
            <h2>New RSVP</h2>
            <p><strong>Name:</strong> ${rsvpData.guestName}</p>
            <p><strong>Attending:</strong> ${rsvpData.attending === "yes" ? "Yes" : "No"}</p>
            <p><strong>Party size:</strong> ${rsvpData.guestCount}</p>
            <p><strong>Message:</strong> ${rsvpData.message || "—"}</p>
            <a href="${window.location.origin}/host/event/${id}" style="color:#6f627d;">Open Host Dashboard →</a>
          </div>`,
        });
      } catch (err) { console.error("Host email failed:", err.message); }
    }

    setRsvpData({ guestName: "", email: "", phone: "", attending: "yes", guestCount: 1, message: "", smsOptIn: false });
    setSubmitting(false);
  }

  async function handleRequestNewEditLink() {
    setRsvpError(""); setLinkRequestSuccess(""); setRequestedEditLink("");
    const trimmedEmail = rsvpData.email.trim().toLowerCase();
    if (!trimmedEmail) { setRsvpError("Please enter your email above first."); return; }

    const newToken = crypto.randomUUID();
    const { data, error } = await supabase.from("rsvps")
      .update({ edit_token: newToken, edit_token_created_at: new Date().toISOString() })
      .eq("event_id", id).eq("email", trimmedEmail).select("id").maybeSingle();

    if (error || !data) { setRsvpError("We couldn't find an RSVP for that email."); return; }

    const freshLink = `${window.location.origin}/rsvp/edit/${newToken}`;
    setRequestedEditLink(freshLink);
    try {
      await sendEmail({
        to: trimmedEmail,
        subject: `Your RSVP edit link — ${event.event_title}`,
        html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;">
          <h2>Your RSVP edit link</h2>
          <p>Click below to update your RSVP for <strong>${event.event_title}</strong>:</p>
          <a href="${freshLink}" style="display:inline-block;padding:12px 24px;background:#6f627d;color:white;border-radius:10px;text-decoration:none;font-weight:600;">Edit My RSVP</a>
        </div>`,
      });
      setLinkRequestSuccess("A fresh edit link has been sent to your email.");
    } catch {
      setRsvpError("The link was created but the email didn't send.");
    }
  }

  function handleUnlockSubmit(e) {
    e.preventDefault();
    const typed  = enteredCode.trim().toLowerCase();
    const actual = (event?.event_code || "").trim().toLowerCase();
    if (typed === actual) { setCodeError(""); setIsUnlocked(true); }
    else setCodeError("Incorrect code. Please try again.");
  }

  function formatTime(t) {
    if (!t) return null;
    const [h, m] = t.split(":");
    let hr = parseInt(h);
    const ampm = hr >= 12 ? "PM" : "AM";
    hr = hr % 12 || 12;
    return `${hr}:${m.padStart(2, "0")} ${ampm}`;
  }
  function formatDate(d) {
    if (!d) return null;
    const [y, mo, day] = d.split("-").map(Number);
    return new Date(y, mo - 1, day).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  }

  /* ── Loading ── */
  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f4f4f5" }}>
      <p style={{ fontFamily: "'Inter',sans-serif", color: "#71717a" }}>Loading…</p>
    </div>
  );

  if (!event) return (
    <div style={{ padding: "2rem", fontFamily: "'Inter',sans-serif" }}>
      <h2>Event not found</h2><p>This invite may have been removed.</p>
    </div>
  );

  /* ── Unlock screen ── */
  if (!isUnlocked) return (
    <div className="ep-unlock-wrap">
      <div className="ep-unlock-box ep-animate">
        <div style={{ width: 48, height: 48, borderRadius: 14, background: "#6f627d", color: "white",
          display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem" }}>
          <Ico name="lock" size={22} />
        </div>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.5rem", color: "#6f627d", margin: "0 0 0.5rem" }}>
          Private Invite
        </h2>
        <p style={{ fontFamily: "'Inter',sans-serif", color: "#71717a", fontSize: "0.9rem", margin: "0 0 1.5rem" }}>
          Enter the event code to view this invitation.
        </p>
        <form onSubmit={handleUnlockSubmit} style={{ display: "grid", gap: "0.75rem" }}>
          <input className="ep-input" type="text" placeholder="Event code" value={enteredCode}
            onChange={(e) => { setEnteredCode(e.target.value); setCodeError(""); }}
            style={{ textAlign: "center", letterSpacing: "0.1em" }} />
          {codeError && <p style={{ fontFamily: "'Inter',sans-serif", fontSize: "0.85rem", color: "#dc2626", margin: 0 }}>{codeError}</p>}
          <button className="ep-btn" type="submit">Unlock Invite</button>
        </form>
      </div>
    </div>
  );

  /* ════════════ MAIN PAGE ════════════ */
  return (
    <div className="ep-shell ep-animate" style={{ background: event.background_color || "#f4f4f5" }}>
      <div className="ep-card">

        <a
          href={event.invite_image_url}
          target="_blank"
          rel="noopener noreferrer"
          title="Click to view full invitation"
        >
          <img
            src={event.invite_image_url}
            alt="Event invite"
            style={{
              width: "100%",
              display: "block",
              maxHeight: "none",
              objectFit: "contain",
              background: "#fbf8fd",
              cursor: "zoom-in",
            }}
          />
        </a>

        <div style={{ padding: "1.75rem 1.5rem 2rem" }}>

          {/* Event type tag */}
          {event.event_type && (
            <p style={{ fontFamily: "'Inter',sans-serif", fontSize: "0.72rem", fontWeight: 600,
              color: "#71717a", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 0.5rem" }}>
              {event.event_type}
            </p>
          )}

          {/* Title */}
          <h1 style={{ fontFamily: "'Playfair Display',serif",
            fontSize: "clamp(1.6rem, 5vw, 2.1rem)", fontWeight: 600,
            color: "#6f627d", margin: "0 0 0.35rem", lineHeight: 1.2 }}>
            {event.event_title || "Untitled Event"}
          </h1>

          {/* Honoree */}
          {event.honoree_name && (
            <p style={{ fontFamily: "'Inter',sans-serif", fontSize: "0.95rem", color: "#71717a", margin: "0 0 1.25rem" }}>
              Celebrating <strong style={{ color: "#6f627d" }}>{event.honoree_name}</strong>
            </p>
          )}

          {/* Detail chips */}
          <div className="ep-chip-grid">
            {event.event_date && (
              <div className="ep-chip">
                <div className="ep-chip-icon"><Ico name="cal" size={15} /></div>
                <div>
                  <p className="ep-chip-label">Date</p>
                  <p className="ep-chip-value">{formatDate(event.event_date)}</p>
                </div>
              </div>
            )}
            {event.event_time && (
              <div className="ep-chip">
                <div className="ep-chip-icon"><Ico name="time" size={15} /></div>
                <div>
                  <p className="ep-chip-label">Time</p>
                  <p className="ep-chip-value">{formatTime(event.event_time)}</p>
                </div>
              </div>
            )}
            {event.location && (
              <div className="ep-chip" style={{ gridColumn: "1 / -1" }}>
                <div className="ep-chip-icon"><Ico name="pin" size={15} /></div>
                <div>
                  <p className="ep-chip-label">Location</p>
                  <p className="ep-chip-value">{event.location}</p>
                </div>
              </div>
            )}
            {event.rsvp_deadline && (
              <div className="ep-chip" style={{ gridColumn: "1 / -1" }}>
                <div className="ep-chip-icon"><Ico name="dead" size={15} /></div>
                <div>
                  <p className="ep-chip-label">RSVP By</p>
                  <p className="ep-chip-value">{formatDate(event.rsvp_deadline)}</p>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          {event.description && (
            <div className="ep-block">
              <p className="ep-block-label">About this event</p>
              <p className="ep-block-text">{event.description}</p>
            </div>
          )}

          {/* Event updates */}
          {eventUpdates.length > 0 && (
            <>
              <hr className="ep-divider" />
              <h2 className="ep-section-heading">Updates</h2>
              <div style={{ display: "grid", gap: "10px" }}>
                {eventUpdates.map((item) => (
                  <div key={item.id} className="ep-update">
                    <p style={{ fontFamily: "'Inter',sans-serif", fontWeight: 600, fontSize: "0.9rem", color: "#ab0dfa", margin: "0 0 4px" }}>
                      {item.title}
                    </p>
                    <p style={{ fontFamily: "'Inter',sans-serif", fontSize: "0.88rem", color: "#52525b", whiteSpace: "pre-line", margin: "0 0 6px" }}>
                      {item.message}
                    </p>
                    <p style={{ fontFamily: "'Inter',sans-serif", fontSize: "0.75rem", color: "#a1a1aa", margin: 0 }}>
                      {item.created_at ? new Date(item.created_at).toLocaleString() : ""}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Guest list */}
          {event.guest_list_visibility === "public" && <GuestList rsvps={rsvps} />}

          {/* ══════ RSVP ══════ */}
          <hr className="ep-divider" />
          <h2 className="ep-section-heading">RSVP</h2>

          {rsvpError && <div className="ep-alert error">{rsvpError}</div>}

          {/* Success */}
          {rsvpSuccess && (
            <div className="ep-alert success" style={{ padding: "1.25rem 1.5rem" }}>
              <p style={{ fontWeight: 700, fontSize: "1rem", margin: "0 0 6px" }}>🎉 You're on the list!</p>
              <p style={{ margin: "0 0 1rem", fontSize: "0.9rem" }}>
                Thanks for your RSVP — the host has been notified and a confirmation is on its way to your email.
              </p>
            </div>
          )}

          {/* Already RSVP'd */}
          {existingRsvpFound && !rsvpSuccess && (
            <div className="ep-alert warning">
              <p style={{ fontWeight: 700, margin: "0 0 4px" }}>You've already RSVP'd</p>
              <p style={{ margin: "0 0 1rem", fontSize: "0.88rem" }}>
                We'll send a fresh edit link to your email so you can make changes.
              </p>
              <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
                <button className="ep-btn" style={{ width: "auto", padding: "10px 18px", fontSize: "0.88rem" }}
                  onClick={handleRequestNewEditLink}>
                  Send me an edit link
                </button>
                <button className="ep-btn-ghost" style={{ width: "auto", padding: "10px 18px", fontSize: "0.88rem" }}
                  onClick={() => { setExistingRsvpFound(false); setRsvpData((p) => ({ ...p, email: "" })); }}>
                  Use a different email
                </button>
              </div>
              {linkRequestSuccess && (
                <p style={{ margin: "0.75rem 0 0", fontSize: "0.88rem", fontWeight: 600 }}>✓ {linkRequestSuccess}</p>
              )}
            </div>
          )}

          {/* Form */}
          {!rsvpSuccess && !existingRsvpFound && (
            <form onSubmit={handleRsvpSubmit} style={{ display: "grid", gap: "1rem" }}>
              <div>
                <label className="ep-label">Your Name</label>
                <input className="ep-input" type="text" name="guestName"
                  value={rsvpData.guestName} onChange={handleRsvpChange}
                  placeholder="Jane Smith" required />
              </div>
              <div>
                <label className="ep-label">Email</label>
                <input className="ep-input" type="email" name="email"
                  value={rsvpData.email} onChange={handleRsvpChange}
                  placeholder="jane@email.com" required />
              </div>
              <div>
                <label className="ep-label">
                  Phone <span style={{ fontWeight: 400, color: "#a1a1aa" }}>(optional)</span>
                </label>
                <input className="ep-input" type="tel" name="phone"
                  value={rsvpData.phone} onChange={handleRsvpChange}
                  placeholder="(555) 000-0000" />
              </div>
              <label style={{ display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer" }}>
                <input type="checkbox" name="smsOptIn" checked={rsvpData.smsOptIn}
                  onChange={handleRsvpChange} style={{ marginTop: 3, flexShrink: 0, width: 16, height: 16 }} />
                <span style={{ fontFamily: "'Inter',sans-serif", fontSize: "0.82rem", color: "#52525b", lineHeight: 1.5 }}>
                  I agree to receive text updates about this event. Message &amp; data rates may apply. Reply STOP to opt out.
                </span>
              </label>
              <div>
                <label className="ep-label">Will you attend?</label>
                <select className="ep-input" name="attending"
                  value={rsvpData.attending} onChange={handleRsvpChange}
                  style={{ marginTop: 6, cursor: "pointer" }}>
                  <option value="yes">Yes, I'll be there</option>
                  <option value="no">Sorry, I can't make it</option>
                </select>
              </div>
              <div>
                <label className="ep-label">Guests</label>

                {/* Invite info */}
                {(event?.allowed_children !== null || event?.allowed_adults !== null) && (
                  <p style={{ fontSize: "0.8rem", color: "#71717a", marginBottom: "0.5rem" }}>
                    This invite includes{" "}
                    {event.allowed_children || 0} child
                    {event.allowed_children === 1 ? "" : "ren"} +{" "}
                    {event.allowed_adults || 0} adult
                    {event.allowed_adults === 1 ? "" : "s"}.
                  </p>
                )}

                {/* Optional host note */}
                {event?.guest_limit_note && (
                  <p style={{ fontSize: "0.8rem", color: "#a1a1aa", marginBottom: "0.75rem" }}>
                    {event.guest_limit_note}
                  </p>
                )}

                <div style={{ display: "flex", gap: "1rem" }}>
                  <div style={{ flex: 1 }}>
                    <label className="ep-label">Children</label>
                    <select
                      className="ep-input"
                      value={rsvpData.children || 0}
                      onChange={(e) =>
                        setRsvpData((prev) => ({
                          ...prev,
                          children: Number(e.target.value),
                        }))
                      }
                    >
                      {[...Array((event?.allowed_children ?? 0) + 1)].map((_, i) => (
                        <option key={i} value={i}>
                          {i}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ flex: 1 }}>
                    <label className="ep-label">Adults</label>
                    <select
                      className="ep-input"
                      value={rsvpData.adults || 0}
                      onChange={(e) =>
                        setRsvpData((prev) => ({
                          ...prev,
                          adults: Number(e.target.value),
                        }))
                      }
                    >
                      {[...Array((event?.allowed_adults ?? 0) + 1)].map((_, i) => (
                        <option key={i} value={i}>
                          {i}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Total display */}
                <p style={{ marginTop: "0.5rem", fontSize: "0.85rem", color: "#6f627d" }}>
                  Total guests:{" "}
                  {(rsvpData.children || 0) + (rsvpData.adults || 0)}
                </p>
              </div>
              <div>
                <label className="ep-label">
                  Message <span style={{ fontWeight: 400, color: "#a1a1aa" }}>(optional)</span>
                </label>
                <textarea className="ep-input" name="message" rows={3}
                  value={rsvpData.message} onChange={handleRsvpChange}
                  placeholder="Leave a note for the host…" style={{ resize: "vertical" }} />
              </div>
              <button className="ep-btn" type="submit" disabled={submitting}>
                {submitting ? "Submitting…" : "Submit RSVP"}
              </button>
            </form>
          )}

          {/* Footer upsell */}
          <div style={{ textAlign: "center", padding: "1.75rem 1rem 0.5rem", borderTop: "1px solid #e4e4e7", marginTop: "1.75rem" }}>
            <p style={{ fontFamily: "'Inter',sans-serif", fontSize: "0.8rem", color: "#a1a1aa", margin: "0 0 0.75rem" }}>
              Powered by InvitePool
            </p>
            <button className="ep-btn-ghost" style={{ width: "auto", padding: "10px 20px", fontSize: "0.88rem" }}
              onClick={() => navigate("/auth")}>
              Create your own invite →
            </button>
          </div>

          <Footer />
        </div>
      </div>
    </div>
  );
}

export default EventPage;