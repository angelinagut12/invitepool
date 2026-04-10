import { useEffect, useState } from "react";
import { supabase } from "../components/supabaseClient";
import { Link, useNavigate } from "react-router-dom";

export default function HostEvents() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setEvents(data || []);
    } catch (error) {
      console.error("Error loading host events:", error.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div style={{ padding: "2rem" }}>Loading your events...</div>;
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "1000px", margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
        }}
      >
        <h1>My Events</h1>
        <button onClick={() => navigate("/create")}>Create New Event</button>
      </div>

      {events.length === 0 ? (
        <div
          style={{
            background: "#fff",
            borderRadius: "16px",
            padding: "1.5rem",
            boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
          }}
        >
          <p>You have not created any events yet.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "1rem" }}>
          {events.map((event) => (
            <div
              key={event.id}
              style={{
                background: "#fff",
                borderRadius: "16px",
                padding: "1.5rem",
                boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
              }}
            >
              <h2 style={{ marginBottom: "0.5rem" }}>
                {event.event_title || "Untitled Event"}
              </h2>

              {event.event_date && (
                <p><strong>Date:</strong> {event.event_date}</p>
              )}

              {event.location && (
                <p><strong>Location:</strong> {event.location}</p>
              )}

              <div
                style={{
                  marginTop: "1rem",
                  display: "flex",
                  gap: "0.75rem",
                  flexWrap: "wrap",
                }}
              >
                <Link to={`/host/event/${event.id}`}>
                  <button>Manage Event</button>
                </Link>

                <Link to={`/event/${event.id}`}>
                  <button>View Public Page</button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}