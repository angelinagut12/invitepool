import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../components/supabaseClient";


export default function HostDashboard() {
  <h2 style={{ marginBottom: "1rem" }}>Host Dashboard</h2>
  const { id } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [rsvps, setRsvps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copyMessage, setCopyMessage] = useState("");

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
      alert("You must be logged in to view this page.");
      navigate("/auth");
      return;
    }

    const { data: eventData, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("id", id)
      .single();

    if (eventError) throw eventError;

    if (!eventData) {
      alert("Event not found.");
      navigate("/");
      return;
    }

    if (eventData.created_by !== user.id) {
      alert("You are not allowed to view this host dashboard.");
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
  } catch (error) {
    console.error("Error loading dashboard:", error.message);
    alert("There was an error loading the dashboard.");
  } finally {
    setLoading(false);
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
  async function handleDeleteRsvp(rsvpId) {
    const confirmed = window.confirm("Are you sure you want to delete this RSVP?");

    if (!confirmed) return;

    try {
        const { error } = await supabase
        .from("rsvps")
        .delete()
        .eq("id", rsvpId);

        if (error) throw error;

        setRsvps((prev) => prev.filter((rsvp) => rsvp.id !== rsvpId));
    } catch (error) {
        console.error("Error deleting RSVP:", error.message);
        alert("There was a problem deleting the RSVP.");
    }
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

          <div style={{ marginTop: "1rem", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <button onClick={copyInviteLink}>Copy Invite Link</button>
            <button onClick={() => navigate(`/event/${event.id}`)}>
              View Public Page
            </button>
          </div>
          <button onClick={() => navigate(`/edit/event/${event.id}`)}>
            Edit Event
         </button>
         <button onClick={() => navigate("/host/events")}>Back to All Events</button>
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
                <p><strong>Name:</strong> {guest.guest_name || "No name"}</p>
                <p>
                  <strong>Status:</strong>{" "}
                  {guest.attending === true
                    ? "Attending"
                    : guest.attending === false
                    ? "Not Attending"
                    : "Pending"}
                </p>
                <p><strong>Guest Count:</strong> {guest.guest_count || 1}</p>
                <p><strong>Message:</strong> {guest.message || "No message"}</p>
                <p>
                  <strong>Submitted:</strong>{" "}
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