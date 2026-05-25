import { useEffect, useState } from "react";
import { supabase } from "../components/supabaseClient";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

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

    .host-card.past {
      background: #f3f4f6;
      border-color: #e5e7eb;
      opacity: 0.82;
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

    .host-badge {
      display: inline-flex;
      align-items: center;
      width: fit-content;
      padding: 4px 10px;
      border-radius: 999px;
      background: #e5e7eb;
      color: #4b5563;
      font-size: 0.78rem;
      font-weight: 700;
      margin-bottom: 0.65rem;
    }
  `;
  document.head.appendChild(style);
}

function getEventDate(event) {
  if (!event.event_date) return null;

  const [year, month, day] = event.event_date.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function isPastEvent(event) {
  const eventDate = getEventDate(event);
  if (!eventDate) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  eventDate.setHours(0, 0, 0, 0);

  return eventDate < today;
}

function sortEventsByDate(events) {
  return [...events].sort((a, b) => {
    const aPast = isPastEvent(a);
    const bPast = isPastEvent(b);

    if (aPast !== bPast) return aPast ? 1 : -1;

    const aDate = getEventDate(a);
    const bDate = getEventDate(b);

    if (!aDate && !bDate) return 0;
    if (!aDate) return 1;
    if (!bDate) return -1;

    const aTime = aDate.getTime();
    const bTime = bDate.getTime();

    if (aPast && bPast) return bTime - aTime;
    return aTime - bTime;
  });
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

      setEvents(sortEventsByDate(data || []));
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
        <Navbar />
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
            {events.map((event) => {
              const pastEvent = isPastEvent(event);

              return (
              <div key={event.id} className={`host-card${pastEvent ? " past" : ""}`}>

                {pastEvent && <span className="host-badge">Past Event</span>}

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
                    <button className="host-btn">Manage</button>
                  </Link>

                  <Link to={`/edit/event/${event.id}`}>
                    <button className="host-btn-ghost">Edit Invite</button>
                  </Link>

                  <Link to={`/event/${event.id}`}>
                    <button className="host-btn-ghost">View Invite</button>              
                  </Link>
                </div>

              </div>
            );
            })}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
