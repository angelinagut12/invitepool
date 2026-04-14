import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../components/supabaseClient";

export default function HostDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [rsvps, setRsvps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copyMessage, setCopyMessage] = useState("");
  const [contacts, setContacts] = useState([]);
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactSuccess, setContactSuccess] = useState("");
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, [id]);

  async function fetchDashboardData() {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/auth");
        return;
      }

      setUser(user);

      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .select("*")
        .eq("id", id)
        .single();

      if (eventError) throw eventError;

      if (!eventData) {
        navigate("/");
        return;
      }

      if (eventData.created_by !== user.id) {
        navigate("/");
        return;
      }

      setEvent(eventData);

      const { data: rsvpData, error: rsvpError } = await supabase
        .from("rsvps")
        .select("*")
        .eq("event_id", id)
        .order("created_at", { ascending: false });

      if (rsvpError) throw rsvpError;

      setRsvps(rsvpData || []);

      await fetchContacts(user.id);
    } catch (error) {
      console.error("Error loading dashboard:", error.message);
      setContactSuccess("There was an error loading the dashboard.");
      setTimeout(() => setContactSuccess(""), 2500);
    } finally {
      setLoading(false);
    }
  }

  async function fetchContacts(currentUserId) {
    try {
      const { data, error } = await supabase
        .from("invite_contacts")
        .select("*")
        .eq("event_id", Number(id))
        .eq("created_by", currentUserId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setContacts(data || []);
    } catch (error) {
      console.error("Error loading contacts:", error.message);
      setContactSuccess("Could not load contacts.");
      setTimeout(() => setContactSuccess(""), 2500);
    }
  }

  const stats = useMemo(() => {
    const total = rsvps.length;
    const attending = rsvps.filter((r) => r.attending === true).length;
    const notAttending = rsvps.filter((r) => r.attending === false).length;
    const pending = total - attending - notAttending;

    const totalAttendingGuests = rsvps
      .filter((r) => r.attending === true)
      .reduce((sum, r) => sum + (r.guest_count || 1), 0);

    return { total, attending, notAttending, pending, totalAttendingGuests };
  }, [rsvps]);

  async function copyInviteLink() {
    if (!event) return;

    const publicLink = `${window.location.origin}/event/${event.id}`;
    try {
      await navigator.clipboard.writeText(publicLink);
      setCopyMessage("Invite link copied!");
      setTimeout(() => setCopyMessage(""), 2000);
    } catch (error) {
      console.error("Copy failed:", error.message);
      setCopyMessage("Could not copy link.");
      setTimeout(() => setCopyMessage(""), 2000);
    }
  }

  async function shareInvite() {
    if (!event) return;

    const publicLink = `${window.location.origin}/event/${event.id}`;
    const message = `You're invited to ${event.event_title || "my event"} 🎉

RSVP here: ${publicLink}

You can optionally opt in for event text updates on the RSVP form.`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: event.event_title || "Event Invite",
          text: message,
          url: publicLink,
        });
      } catch (error) {
        console.error("Share cancelled or failed:", error.message);
      }
    } else {
      try {
        await navigator.clipboard.writeText(message);
        setCopyMessage("Invite message copied!");
        setTimeout(() => setCopyMessage(""), 2000);
      } catch (error) {
        console.error("Copy failed:", error.message);
        setCopyMessage("Could not copy invite message.");
        setTimeout(() => setCopyMessage(""), 2000);
      }
    }
  }

  async function handleDeleteRsvp(rsvpId) {
    const confirmed = window.confirm("Are you sure you want to delete this RSVP?");
    if (!confirmed) return;

    try {
      const { error } = await supabase.from("rsvps").delete().eq("id", rsvpId);

      if (error) throw error;

      setRsvps((prev) => prev.filter((rsvp) => rsvp.id !== rsvpId));
    } catch (error) {
      console.error("Error deleting RSVP:", error.message);
      setContactSuccess("There was a problem deleting the RSVP.");
      setTimeout(() => setContactSuccess(""), 2500);
    }
  }

  async function addContact() {
    const trimmedName = contactName.trim();
    const trimmedPhone = contactPhone.trim();

    if (!trimmedName) {
      setContactSuccess("Please enter a name.");
      setTimeout(() => setContactSuccess(""), 2000);
      return;
    }

    if (!user) {
      setContactSuccess("You must be logged in.");
      setTimeout(() => setContactSuccess(""), 2000);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("invite_contacts")
        .insert([
          {
            event_id: Number(id),
            created_by: user.id,
            name: trimmedName,
            phone: trimmedPhone || null,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setContacts((prev) => [data, ...prev]);
      setContactName("");
      setContactPhone("");
      setContactSuccess("Contact added!");
      setTimeout(() => setContactSuccess(""), 2000);
    } catch (error) {
      console.error("Error adding contact:", error.message);
      setContactSuccess("Error saving contact.");
      setTimeout(() => setContactSuccess(""), 2000);
    }
  }

  async function removeContact(contactId) {
    try {
      const { error } = await supabase
        .from("invite_contacts")
        .delete()
        .eq("id", contactId);

      if (error) throw error;

      setContacts((prev) => prev.filter((contact) => contact.id !== contactId));
      setContactSuccess("Contact removed.");
      setTimeout(() => setContactSuccess(""), 2000);
    } catch (error) {
      console.error("Error removing contact:", error.message);
      setContactSuccess("Error removing contact.");
      setTimeout(() => setContactSuccess(""), 2000);
    }
  }

  async function shareInviteToContact(contact) {
    if (!event || !contact.phone) return;

    const publicLink = `${window.location.origin}/event/${event.id}`;
    const message = `Hi ${contact.name}! You're invited to ${event.event_title || "my event"} 🎉

RSVP here: ${publicLink}

You can optionally opt in for event text updates on the RSVP form.`;

    const smsLink = `sms:${contact.phone}?body=${encodeURIComponent(message)}`;
    window.location.href = smsLink;
  }

  if (loading) {
    return <div style={{ padding: "2rem" }}>Loading dashboard...</div>;
  }

  if (!event) {
    return <div style={{ padding: "2rem" }}>No event found.</div>;
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "1000px", margin: "0 auto" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 300px",
          gap: "1.5rem",
          marginBottom: "2rem",
        }}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: "16px",
            padding: "1.5rem",
            boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
          }}
        >
          <h1 style={{ marginBottom: "0.5rem" }}>{event.event_title}</h1>
          <p><strong>Date:</strong> {event.event_date || "Not set"}</p>
          <p><strong>Time:</strong> {event.event_time || "Not set"}</p>
          <p><strong>Location:</strong> {event.location || "Not set"}</p>
          <p>
            <strong>Guest list visibility:</strong>{" "}
            {event.guest_list_visibility || "Not set"}
          </p>

          <div
            style={{
              marginTop: "1rem",
              display: "flex",
              gap: "0.75rem",
              flexWrap: "wrap",
            }}
          >
            <button onClick={copyInviteLink}>Copy Invite Link</button>

            <button onClick={() => navigate(`/event/${event.id}`)}>
              View Public Page
            </button>

            <button onClick={shareInvite}>Share Invite</button>

            <button onClick={() => navigate(`/edit/event/${event.id}`)}>
              Edit Event
            </button>

            <button onClick={() => navigate("/host/events")}>
              Back to All Events
            </button>
          </div>

          {copyMessage && (
            <p style={{ marginTop: "0.75rem", color: "green" }}>{copyMessage}</p>
          )}
        </div>

        <div
          style={{
            background: "#fff",
            borderRadius: "16px",
            padding: "1rem",
            boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
          }}
        >
          {event.invite_image_url ? (
            <img
              src={event.invite_image_url}
              alt="Invite"
              style={{
                width: "100%",
                borderRadius: "12px",
                objectFit: "cover",
              }}
            />
          ) : (
            <div>No invite image uploaded</div>
          )}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        <StatCard label="Total Responses" value={stats.total} />
        <StatCard label="Attending" value={stats.attending} />
        <StatCard label="Not Attending" value={stats.notAttending} />
        <StatCard label="Pending" value={stats.pending} />
        <StatCard label="Guests Attending" value={stats.totalAttendingGuests} />
      </div>

      <div
        style={{
          background: "#fff",
          borderRadius: "16px",
          padding: "1.5rem",
          boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
          marginBottom: "2rem",
        }}
      >
        <h2 style={{ marginBottom: "1rem" }}>Invite Contacts</h2>

        <div style={{ display: "grid", gap: "1rem", marginBottom: "1rem" }}>
          <input
            type="text"
            placeholder="Guest name"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "10px",
              border: "1px solid #ccc",
              boxSizing: "border-box",
            }}
          />

          <input
            type="tel"
            placeholder="Phone number"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "10px",
              border: "1px solid #ccc",
              boxSizing: "border-box",
            }}
          />

          <button onClick={addContact}>Add Contact</button>

          {contactSuccess && (
            <p style={{ color: "green", fontSize: "0.9rem" }}>
              {contactSuccess}
            </p>
          )}
        </div>

        {contacts.length === 0 ? (
          <p style={{ color: "#666" }}>No contacts added yet.</p>
        ) : (
          <div style={{ display: "grid", gap: "1rem" }}>
            {contacts.map((contact) => (
              <div
                key={contact.id}
                style={{
                  border: "1px solid #eee",
                  borderRadius: "12px",
                  padding: "1rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "1rem",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <p style={{ fontWeight: "600", marginBottom: "0.25rem" }}>
                    {contact.name}
                  </p>
                  {contact.phone ? (
                    <p style={{ color: "#666" }}>{contact.phone}</p>
                  ) : (
                    <p style={{ color: "#aaa" }}>No phone yet</p>
                  )}
                </div>

                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                  <button
                    onClick={() => shareInviteToContact(contact)}
                    disabled={!contact.phone}
                    style={{
                      opacity: contact.phone ? 1 : 0.5,
                      cursor: contact.phone ? "pointer" : "not-allowed",
                    }}
                  >
                    Share Invite
                  </button>

                  <button
                    onClick={() => removeContact(contact.id)}
                    style={{
                      background: "#ef4444",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      padding: "8px 12px",
                      cursor: "pointer",
                    }}
                  >
                    Remove
                  </button>
                </div>

                {!contact.phone && (
                  <p style={{ color: "#ef4444", fontSize: "0.8rem", width: "100%" }}>
                    Add phone to send invite
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div
        style={{
          background: "#fff",
          borderRadius: "16px",
          padding: "1.5rem",
          boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
          marginBottom: "2rem",
        }}
      >
        <h2 style={{ marginBottom: "1rem" }}>Guest Responses</h2>

        {rsvps.length === 0 ? (
          <p>No responses yet.</p>
        ) : (
          <div style={{ display: "grid", gap: "1rem" }}>
            {rsvps.map((guest) => (
              <div
                key={guest.id}
                style={{
                  border: "1px solid #eee",
                  borderRadius: "12px",
                  padding: "1rem",
                }}
              >
                <p style={{ fontSize: "1.2rem", fontWeight: "600" }}>
                  {guest.guest_name || "No name"}

                  {guest.guest_count > 1 && (
                    <span style={{ color: "#666" }}> + {guest.guest_count}</span>
                  )}

                  <span style={{ marginLeft: "6px" }}>
                    {guest.attending ? "✅" : "❌"}
                  </span>
                </p>

                {guest.message && (
                  <p style={{ marginTop: "0.5rem", color: "#555" }}>
                    {guest.message}
                  </p>
                )}

                {guest.email && <p><strong>Email:</strong> {guest.email}</p>}
                {guest.phone && <p><strong>Phone:</strong> {guest.phone}</p>}
                <p><strong>SMS Opt-In:</strong> {guest.sms_opt_in ? "Yes" : "No"}</p>

                <p style={{ fontSize: "0.85rem", color: "#888" }}>
                  {guest.created_at
                    ? new Date(guest.created_at).toLocaleString()
                    : "Unknown"}
                </p>

                <button
                  onClick={() => handleDeleteRsvp(guest.id)}
                  style={{
                    marginTop: "0.75rem",
                    background: "#ef4444",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    padding: "8px 12px",
                    cursor: "pointer",
                  }}
                >
                  Delete RSVP
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "16px",
        padding: "1.25rem",
        textAlign: "center",
        boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
      }}
    >
      <p style={{ marginBottom: "0.5rem", fontSize: "0.95rem" }}>{label}</p>
      <h3 style={{ margin: 0, fontSize: "2rem" }}>{value}</h3>
    </div>
  );
}