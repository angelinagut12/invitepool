import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../components/supabaseClient";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";

function EditRsvp() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rsvpError, setRsvpError] = useState("");
  const [rsvpSuccess, setRsvpSuccess] = useState("");
  const [eventTitle, setEventTitle] = useState("");
  const [rsvpId, setRsvpId] = useState(null);

  const [rsvpData, setRsvpData] = useState({
    guestName: "",
    email: "",
    phone: "",
    attending: "yes",
    adults: 1,
    children: 0,
    guestCount: 1,
    message: "",
    smsOptIn: false,
  });

  useEffect(() => {
    fetchRsvp();
  }, [token]);

  async function fetchRsvp() {
    try {
      setLoading(true);
      setRsvpError("");

      const { data, error } = await supabase
        .from("rsvps")
        .select(`
          id,
          guest_name,
          email,
          phone,
          attending,
          adults,
          children,
          guest_count,
          message,
          sms_opt_in,
          events (
            event_title
          )
        `)
        .eq("edit_token", token)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setRsvpError("This RSVP edit link is invalid or no longer available.");
        return;
      }

      setRsvpId(data.id);
      setEventTitle(data.events?.event_title || "Event");

      setRsvpData({
        guestName: data.guest_name || "",
        email: data.email || "",
        phone: data.phone || "",
        attending: normalizeRsvpStatus(data.attending),
        adults: data.adults ?? Math.max(Number(data.guest_count || 1), 1),
        children: data.children ?? 0,
        guestCount: data.guest_count || 1,
        message: data.message || "",
        smsOptIn: data.sms_opt_in || false,
      });
    } catch (error) {
      console.error("Error loading RSVP:", error.message);
      setRsvpError("There was a problem loading your RSVP.");
    } finally {
      setLoading(false);
    }
  }

  function normalizeRsvpStatus(value) {
    if (value === true || value === "true" || value === "yes") return "yes";
    if (value === "maybe") return "maybe";
    return "no";
  }

  function handleRsvpChange(e) {
    const { name, value, type, checked } = e.target;

    setRsvpData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    setRsvpError("");
    setRsvpSuccess("");
  }

  async function handleUpdateRsvp(e) {
    e.preventDefault();
    setSaving(true);
    setRsvpError("");
    setRsvpSuccess("");

    try {
      const trimmedEmail = rsvpData.email.trim().toLowerCase();
      const adults = Number(rsvpData.adults || 0);
      const children = Number(rsvpData.children || 0);

      if (adults + children < 1) {
        setRsvpError("Please select at least 1 adult or child.");
        setSaving(false);
        return;
      }

      const { error } = await supabase
        .from("rsvps")
        .update({
          guest_name: rsvpData.guestName,
          email: trimmedEmail,
          phone: rsvpData.phone?.trim() || null,
          attending: rsvpData.attending,
          adults,
          children,
          guest_count: adults + children,
          message: rsvpData.message,
          sms_opt_in: rsvpData.smsOptIn,
          sms_opt_in_at: rsvpData.smsOptIn ? new Date().toISOString() : null,
        })
        .eq("id", rsvpId)
        .eq("edit_token", token);

      if (error) throw error;

      setRsvpSuccess("Your RSVP has been updated successfully.");
    } catch (error) {
      console.error("Error updating RSVP:", error.message);
      setRsvpError("There was a problem updating your RSVP.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div style={{ padding: "2rem" }}>Loading RSVP...</div>;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "2rem",
        backgroundColor: "#f5f5f5",
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
        <Navbar />
        <h1 style={{ marginBottom: "0.5rem" }}>Edit RSVP</h1>

        <p style={{ color: "#666", marginBottom: "1.5rem" }}>
          Update your RSVP for {eventTitle}.
        </p>

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
            {rsvpSuccess}
          </div>
        )}

        {!rsvpError && (
          <form
            onSubmit={handleUpdateRsvp}
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
              <label
                style={{
                  display: "flex",
                  gap: "0.5rem",
                  alignItems: "flex-start",
                }}
              >
                <input
                  type="checkbox"
                  name="smsOptIn"
                  checked={rsvpData.smsOptIn}
                  onChange={handleRsvpChange}
                  style={{ marginTop: "4px" }}
                />
                <span>
                  I agree to receive text updates about this event, including
                  reminders and important changes. Message frequency varies.
                  Message and data rates may apply. Reply STOP to opt out.
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
                <option value="maybe">Maybe</option>
                <option value="no">No</option>
              </select>
            </div>

            <div>
              <label>Adults</label>
              <br />
              <input
                type="number"
                name="adults"
                min="0"
                value={rsvpData.adults}
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
              <label>Kids</label>
              <br />
              <input
                type="number"
                name="children"
                min="0"
                value={rsvpData.children}
                onChange={handleRsvpChange}
                style={{
                  width: "100%",
                  padding: "12px",
                  marginTop: "6px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <p style={{ margin: 0, color: "#666" }}>
              Total guests: {Number(rsvpData.adults || 0) + Number(rsvpData.children || 0)}
            </p>

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

            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Update RSVP"}
              </button>

              <button
                type="button"
                onClick={() => navigate("/")}
                style={{
                  background: "#e5e7eb",
                  color: "#111827",
                }}
              >
                Done
              </button>
            </div>
          </form>
        )}

        <Footer />
      </div>
    </div>
  );
}

export default EditRsvp;
