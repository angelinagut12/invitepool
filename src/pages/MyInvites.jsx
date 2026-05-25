import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../components/supabaseClient";
import Navbar from "../components/Navbar";

export default function MyInvites() {
  const navigate = useNavigate();
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyInvites();
  }, []);

  async function fetchMyInvites() {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/auth?redirect=/my-invites");
        return;
      }

      const userEmail = user.email?.toLowerCase();

      const { data, error } = await supabase
        .from("rsvps")
        .select(`
          id,
          guest_name,
          email,
          attending,
          guest_count,
          message,
          edit_token,
          events (
            id,
            event_title,
            event_date,
            event_time,
            location,
            invite_image_url
          )
        `)
        .eq("email", userEmail)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setInvites(data || []);
    } catch (error) {
      console.error("Error loading invites:", error.message);
      alert("There was a problem loading your invites.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div style={{ padding: "2rem" }}>Loading your invites...</div>;
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f6f2fb", padding: "2rem" }}>
        <Navbar />
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <h1 style={{ color: "#6f627d" }}>My Invites</h1>

        {invites.length === 0 ? (
          <div style={cardStyle}>
            <p style={{ color: "#7c6f88" }}>
              No invites were found for your email.
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "1rem" }}>
            {invites.map((invite) => (
              <div key={invite.id} style={cardStyle}>
                <h2 style={{ color: "#6f627d" }}>
                  {invite.events?.event_title || "Untitled Event"}
                </h2>

                <p><strong>Date:</strong> {invite.events?.event_date || "Not set"}</p>
                <p><strong>Time:</strong> {invite.events?.event_time || "Not set"}</p>
                <p><strong>Location:</strong> {invite.events?.location || "Not set"}</p>
                <p>
                  <strong>Your RSVP:</strong>{" "}
                  {{
                    yes: "Attending",
                    maybe: "Maybe",
                    no: "Not Attending",
                  }[invite.attending] || "Not Attending"}
                </p>

                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                  <button
                    onClick={() => navigate(`/event/${invite.events.id}`)}
                    style={mainButton}
                  >
                    View Invite
                  </button>

                  <button
                    onClick={() => navigate(`/rsvp/edit/${invite.edit_token}`)}
                    style={ghostButton}
                  >
                    Edit RSVP
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const cardStyle = {
  background: "#fbf8fd",
  border: "1px solid #e8dff0",
  borderRadius: "18px",
  padding: "1.5rem",
  boxShadow: "0 6px 18px rgba(80, 60, 100, 0.08)",
};

const mainButton = {
  padding: "10px 14px",
  border: "none",
  borderRadius: "10px",
  background: "#8b5cf6",
  color: "white",
  fontWeight: "700",
  cursor: "pointer",
};

const ghostButton = {
  padding: "10px 14px",
  border: "1px solid #d8cde6",
  borderRadius: "10px",
  background: "white",
  color: "#6f627d",
  fontWeight: "700",
  cursor: "pointer",
};
