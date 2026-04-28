import { useEffect, useState } from "react";
import { supabase } from "../components/supabaseClient";
import { Link, useNavigate } from "react-router-dom";


if (!document.getElementById("host-theme")) {
  const style = document.createElement("style");
  style.id = "host-theme";
  style.textContent = `
    .host-shell {
      min-height: 100vh;
      background: #f6f2fb;
      padding: 2rem 1.5rem;
    }

    .host-container {
      max-width: 1000px;
      margin: 0 auto;
    }

    .host-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    .host-title {
      font-family: 'Playfair Display', serif;
      font-size: 2rem;
      color: #6f627d;
      margin: 0;
    }

    .host-btn {
      background: #8d7f9b;
      color: white;
      border: none;
      padding: 10px 18px;
      border-radius: 10px;
      font-weight: 600;
      cursor: pointer;
      transition: 0.2s;
    }

    .host-btn:hover {
      background: #6f627d;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(141,127,155,0.25);
    }

    .host-card {
      background: #fbf8fd;
      border: 1px solid #e8dff0;
      border-radius: 16px;
      padding: 1.5rem;
      transition: 0.2s;
    }

    .host-card:hover {
      box-shadow: 0 6px 18px rgba(0,0,0,0.08);
      transform: translateY(-2px);
    }

    .host-card-title {
      font-family: 'Playfair Display', serif;
      font-size: 1.3rem;
      color: #6f627d;
      margin-bottom: 0.4rem;
    }

    .host-text {
      font-family: 'Inter', sans-serif;
      color: #7c6f88;
      font-size: 0.9rem;
    }

    .host-actions {
      margin-top: 1rem;
      display: flex;
      gap: 0.6rem;
      flex-wrap: wrap;
    }

    .host-btn-ghost {
      border: 1px solid #d8cde6;
      background: white;
      color: #6f627d;
      padding: 8px 14px;
      border-radius: 10px;
      cursor: pointer;
      font-weight: 500;
    }

    .host-btn-ghost:hover {
      background: #f4eff9;
    }
  `;
  document.head.appendChild(style);
}

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
    <div className="host-shell">
      <div className="host-container">

        <div className="host-header">
          <h1 className="host-title">My Events</h1>
          <button
            className="host-btn"
            onClick={() => navigate("/create")}
          >
            + Create Event
          </button>
        </div>

        {events.length === 0 ? (
          <div className="host-card">
            <p className="host-text">
              You haven’t created any events yet.
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "1rem" }}>
            {events.map((event) => (
              <div key={event.id} className="host-card">

                <h2 className="host-card-title">
                  {event.event_title || "Untitled Event"}
                </h2>

                {event.event_date && (
                  <p className="host-text">
                    <strong>Date:</strong> {event.event_date}
                  </p>
                )}

                {event.location && (
                  <p className="host-text">
                    <strong>Location:</strong> {event.location}
                  </p>
                )}

                <div className="host-actions">
                  <Link to={`/host/event/${event.id}`}>
                    <button className="host-btn">
                      Manage
                    </button>
                  </Link>

                  <Link to={`/event/${event.id}`}>
                    <button className="host-btn-ghost">
                      View Invite
                    </button>
                  </Link>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}