import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../components/supabaseClient";
import Footer from "../components/Footer";

function EventPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rsvps, setRsvps] = useState([]);
  const [enteredCode, setEnteredCode] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [codeError, setCodeError] = useState("");
  const [rsvpError, setRsvpError] = useState("");
  const [rsvpSuccess, setRsvpSuccess] = useState("");
  const [editLink, setEditLink] = useState("");

  const [existingRsvpFound, setExistingRsvpFound] = useState(false);
  const [existingEditToken, setExistingEditToken] = useState("");
  const [linkRequestSuccess, setLinkRequestSuccess] = useState("");

  const [rsvpData, setRsvpData] = useState({
    guestName: "",
    email: "",
    phone: "",
    attending: "yes",
    guestCount: 1,
    message: "",
    smsOptIn: false,
  });

  useEffect(() => {
    fetchEvent();
    fetchRsvps();
  }, [id]);

  async function fetchEvent() {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching event:", error);
    } else {
      setEvent(data);
    }

    setLoading(false);
  }

  async function fetchRsvps() {
    const { data, error } = await supabase
      .from("rsvps")
      .select("id, guest_name, attending, guest_count, message, created_at")
      .eq("event_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching RSVPs:", error);
    } else {
      setRsvps(data || []);
    }
  }

  function handleRsvpChange(e) {
    const { name, value, type, checked } = e.target;
    setRsvpData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setRsvpError("");
    setLinkRequestSuccess("");
  }

  async function handleRsvpSubmit(e) {
    e.preventDefault();
    setRsvpError("");
    setRsvpSuccess("");
    setEditLink("");
    setExistingRsvpFound(false);
    setExistingEditToken("");

    const trimmedEmail = rsvpData.email.trim().toLowerCase();
    const editToken = crypto.randomUUID();

    const { data: existingRsvp, error: existingError } = await supabase
      .from("rsvps")
      .select("id, edit_token")
      .eq("event_id", id)
      .eq("email", trimmedEmail)
      .maybeSingle();

    if (existingError) {
      console.error("Error checking existing RSVP:", existingError);
      setRsvpError("There was a problem checking your RSVP.");
      return;
    }

    if (existingRsvp) {
      setExistingRsvpFound(true);
      setExistingEditToken(existingRsvp.edit_token || "");
      return;
    }

    const { error } = await supabase.from("rsvps").insert([
      {
        event_id: id,
        guest_name: rsvpData.guestName,
        email: trimmedEmail,
        phone: rsvpData.phone?.trim() || null,
        attending: rsvpData.attending === "yes",
        guest_count: Number(rsvpData.guestCount),
        message: rsvpData.message,
        sms_opt_in: rsvpData.smsOptIn,
        sms_opt_in_at: rsvpData.smsOptIn
          ? new Date().toISOString()
          : null,
        edit_token: editToken,
        edit_token_created_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      console.error("Error saving RSVP:", error);
      setRsvpError("There was a problem saving your RSVP.");
      return;
    }

    setRsvpSuccess("Your RSVP has been submitted.");
    setEditLink(`${window.location.origin}/rsvp/edit/${editToken}`);
    fetchRsvps();

    setRsvpData({
      guestName: "",
      email: "",
      phone: "",
      attending: "yes",
      guestCount: 1,
      message: "",
      smsOptIn: false,
    });
  }
  async function handleRequestNewEditLink() {
    setRsvpError("");
    setLinkRequestSuccess(
      "We found your RSVP. Email sending will be the next step we add for sending a fresh edit link."
    );
  }
  function handleUnlockSubmit(e) {
    e.preventDefault();

    const typedCode = enteredCode.trim().toLowerCase();
    const actualCode = (event?.event_code || "").trim().toLowerCase();

    if (typedCode === actualCode) {
      setCodeError("");
      setIsUnlocked(true);
    } else {
      setCodeError("Incorrect event code. Please try again.");
    }
  }

  function formatTime(timeString) {
    if (!timeString) return "Not set";

    const [hours, minutes] = timeString.split(":");
    let hour = parseInt(hours, 10);

    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12;
    hour = hour === 0 ? 12 : hour;

    return `${hour}:${minutes.padStart(2, "0")} ${ampm}`;
  }

  function formatDate(dateString) {
    if (!dateString) return "Not set";

    const [year, month, day] = dateString.split("-").map(Number);
    const date = new Date(year, month - 1, day);

    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  if (loading) {
    return <p style={{ padding: "2rem" }}>Loading event...</p>;
  }

  if (!event) {
    return (
      <div style={{ padding: "2rem" }}>
        <h2>No event data found</h2>
        <p>Please go back and create an event again.</p>
      </div>
    );
  }

  if (!isUnlocked) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "2rem",
          backgroundColor: "#f3e8ff",
        }}
      >
        <div
          style={{
            background: "white",
            padding: "2rem",
            borderRadius: "16px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
            maxWidth: "450px",
            width: "100%",
            textAlign: "center",
          }}
        >
          <h2 style={{ marginBottom: "1rem" }}>Enter Event Code</h2>
          <p style={{ marginBottom: "1rem", color: "#555" }}>
            This invite is private. Enter the event code to view details.
          </p>

          <form onSubmit={handleUnlockSubmit}>
            <input
              type="text"
              value={enteredCode}
              onChange={(e) => {
                setEnteredCode(e.target.value);
                setCodeError("");
              }}
              placeholder="Enter event code"
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "10px",
                border: codeError ? "1px solid #dc2626" : "1px solid #ccc",
                marginBottom: "0.75rem",
                boxSizing: "border-box",
              }}
            />

            {codeError && (
              <p
                style={{
                  color: "#dc2626",
                  fontSize: "0.95rem",
                  marginBottom: "1rem",
                  textAlign: "left",
                }}
              >
                {codeError}
              </p>
            )}

            <button
              type="submit"
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "10px",
                border: "none",
                background: "#8b5cf6",
                color: "white",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              Unlock Invite
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "2rem",
        backgroundColor: event.background_color || "#f5f5f5",
      }}
    >
      <div
        style={{
          maxWidth: "700px",
          margin: "0 auto",
          background: "white",
          padding: "2rem",
          borderRadius: "16px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
        }}
      >
        {event.invite_image_url && (
          <img
            src={event.invite_image_url}
            alt="Invite"
            style={{
              width: "100%",
              borderRadius: "16px",
              marginBottom: "1.5rem",
              objectFit: "cover",
            }}
          />
        )}

        <h1>{event.event_title || "Untitled Event"}</h1>

        {event.honoree_name && (
          <p><strong>Honoree:</strong> {event.honoree_name}</p>
        )}

        {event.event_type && (
          <p><strong>Type:</strong> {event.event_type}</p>
        )}

        {event.event_date && (
          <p><strong>Date:</strong> {formatDate(event.event_date)}</p>
        )}

        {event.event_time && (
          <p><strong>Time:</strong> {formatTime(event.event_time)}</p>
        )}

        {event.location && (
          <div style={{ whiteSpace: "pre-line" }}>
            <strong>Location:</strong>
            <p style={{ marginTop: "0.5rem" }}>{event.location}</p>
          </div>
        )}

        {event.description && (
          <div style={{ whiteSpace: "pre-line" }}>
            <strong>Description:</strong>
            <p style={{ marginTop: "0.5rem" }}>{event.description}</p>
          </div>
        )}

        {event.rsvp_deadline && (
          <p><strong>RSVP By:</strong> {formatDate(event.rsvp_deadline)}</p>
        )}

        {event.guest_list_visibility === "public" && (
          <>
            <hr style={{ margin: "2rem 0" }} />

            <h2>Guest List</h2>

            {rsvps.length === 0 ? (
              <p>No responses yet.</p>
            ) : (
              rsvps.map((rsvp) => (
                <div
                  key={rsvp.id}
                  style={{
                    border: "1px solid #ddd",
                    padding: "1rem",
                    borderRadius: "10px",
                    marginBottom: "1rem",
                  }}
                >
                  <p><strong>{rsvp.guest_name}</strong></p>
                  <p>Attending: {rsvp.attending ? "Yes" : "No"}</p>
                  <p>Guest Count: {rsvp.guest_count || 1}</p>
                  {rsvp.message && (
                    <p style={{ whiteSpace: "pre-line" }}>
                      Message: {rsvp.message}
                    </p>
                  )}
                </div>
              ))
            )}
          </>
        )}

        <hr style={{ margin: "2rem 0" }} />

        <h2>RSVP</h2>

        {rsvpError && (
          <div
            style={{
              background: "#fef2f2",
              color: "#b91c1c",
              border: "1px solid #fecaca",
              padding: "12px",
              borderRadius: "10px",
              marginBottom: "1rem",
              fontSize: "0.95rem",
            }}
          >
            {rsvpError}
          </div>
        )}

        {existingRsvpFound && (
          <div
            style={{
              background: "#fff7ed",
              color: "#9a3412",
              border: "1px solid #fdba74",
              padding: "16px",
              borderRadius: "12px",
              marginBottom: "1rem",
            }}
          >
            <h3 style={{ marginBottom: "0.5rem" }}>Looks like you already RSVP’d</h3>
            <p style={{ marginBottom: "1rem" }}>
              Need to make changes to your response?
            </p>

            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <button type="button" onClick={handleRequestNewEditLink}>
                Send Me a New Edit Link
              </button>

              <button
                type="button"
                onClick={() => {
                  setExistingRsvpFound(false);
                  setExistingEditToken("");
                  setLinkRequestSuccess("");
                  setRsvpData((prev) => ({ ...prev, email: "" }));
                }}
                style={{
                  background: "#e5e7eb",
                  color: "#111827",
                }}
              >
                Use a Different Email
              </button>
            </div>

            {linkRequestSuccess && (
              <p style={{ marginTop: "1rem", fontSize: "0.95rem" }}>
                {linkRequestSuccess}
              </p>
            )}
          </div>
        )}

        {rsvpSuccess && (
          <div
            style={{
              background: "#ecfdf5",
              color: "#166534",
              border: "1px solid #bbf7d0",
              padding: "12px",
              borderRadius: "10px",
              marginBottom: "1rem",
              fontSize: "0.95rem",
            }}
          >
            <p style={{ marginBottom: editLink ? "0.75rem" : 0 }}>{rsvpSuccess}</p>

            {editLink && (
              <div>
                <p style={{ marginBottom: "0.5rem", fontWeight: "600" }}>
                  Save this private RSVP edit link:
                </p>
                <a
                  href={editLink}
                  style={{ color: "#166534", wordBreak: "break-all" }}
                >
                  {editLink}
                </a>

                <div style={{ marginTop: "0.75rem" }}>
                  <a href={editLink}>
                    <button type="button">Edit My RSVP</button>
                  </a>
                </div>
              </div>
            )}
          </div>
        )}

        {!existingRsvpFound && (
          <form
            onSubmit={handleRsvpSubmit}
            style={{ display: "grid", gap: "1rem" }}
          >
            <div>
              <label>Your Name</label>
              <br />
              <input
                type="text"
                name="guestName"
                value={rsvpData.guestName}
                onChange={handleRsvpChange}
                required
                style={{
                  width: "100%",
                  padding: "12px",
                  marginTop: "6px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div>
              <label>Email</label>
              <br />
              <input
                type="email"
                name="email"
                value={rsvpData.email}
                onChange={handleRsvpChange}
                required
                style={{
                  width: "100%",
                  padding: "12px",
                  marginTop: "6px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div>
              <label>Phone (optional)</label>
              <br />
              <input
                type="tel"
                name="phone"
                value={rsvpData.phone}
                onChange={handleRsvpChange}
                style={{
                  width: "100%",
                  padding: "12px",
                  marginTop: "6px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div>
              <label style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
                <input
                  type="checkbox"
                  name="smsOptIn"
                  checked={rsvpData.smsOptIn}
                  onChange={handleRsvpChange}
                  style={{ marginTop: "4px" }}
                />
                <span>
                  I agree to receive text updates about this event, including reminders and important changes.
                  Message frequency varies. Message and data rates may apply. Reply STOP to opt out.
                </span>
              </label>
            </div>

            <div>
              <label>Will you attend?</label>
              <br />
              <select
                name="attending"
                value={rsvpData.attending}
                onChange={handleRsvpChange}
                style={{
                  width: "100%",
                  padding: "12px",
                  marginTop: "6px",
                  boxSizing: "border-box",
                }}
              >
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>

            <div>
              <label>Message</label>
              <br />
              <textarea
                name="message"
                value={rsvpData.message}
                onChange={handleRsvpChange}
                rows="4"
                style={{
                  width: "100%",
                  padding: "12px",
                  marginTop: "6px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div>
              <label>How many people are included in this RSVP?</label>
              <br />
              <input
                type="number"
                name="guestCount"
                min="1"
                value={rsvpData.guestCount}
                onChange={handleRsvpChange}
                style={{
                  width: "100%",
                  padding: "12px",
                  marginTop: "6px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <button type="submit">Submit RSVP</button>
          </form>
        )}

        <div
          style={{
            marginTop: "2.5rem",
            padding: "1.5rem",
            borderTop: "1px solid #eee",
            textAlign: "center",
          }}
        >
          <h3 style={{ marginBottom: "0.5rem" }}>
            Planning a party soon?
          </h3>

          <p style={{ color: "#666", marginBottom: "1rem" }}>
            Create beautiful invites and track RSVPs with InvitePool.
          </p>

          <button
            onClick={() => navigate("/auth")}
            style={{
              padding: "10px 18px",
              borderRadius: "10px",
              border: "none",
              background: "#8b5cf6",
              color: "white",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Create Your Event
          </button>
        </div>

        <Footer />
      </div>
    </div>
  );
}

export default EventPage;