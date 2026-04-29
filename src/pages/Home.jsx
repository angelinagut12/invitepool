import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";

function Home() {
  const navigate = useNavigate();

  const primaryButton = {
    padding: "14px 24px",
    border: "none",
    borderRadius: "12px",
    background: "#6f627d",
    color: "white",
    fontSize: "1rem",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 6px 14px rgba(111, 98, 125, 0.25)",
  };

  const secondaryButton = {
    padding: "14px 24px",
    border: "1px solid #d8cde6",
    borderRadius: "12px",
    background: "white",
    color: "#6f627d",
    fontSize: "1rem",
    fontWeight: "700",
    cursor: "pointer",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f6f2fb",
        padding: "2rem 1.5rem",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          maxWidth: "760px",
          width: "100%",
          margin: "0 auto",
          textAlign: "center",
          background: "#fbf8fd",
          border: "1px solid #e8dff0",
          padding: "3rem 2rem",
          borderRadius: "22px",
          boxShadow: "0 10px 30px rgba(80, 60, 100, 0.08)",
        }}
      >
        <div
          style={{
            display: "inline-block",
            background: "#eee7f5",
            color: "#6f627d",
            padding: "8px 14px",
            borderRadius: "999px",
            fontSize: "0.85rem",
            fontWeight: "700",
            marginBottom: "1rem",
          }}
        >
          Create • Share • Track RSVPs
        </div>

        <h1
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "3.4rem",
            color: "#6f627d",
            margin: "0 0 1rem",
          }}
        >
          InvitePool
        </h1>

        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "1.1rem",
            color: "#7c6f88",
            lineHeight: "1.7",
            maxWidth: "580px",
            margin: "0 auto 2rem",
          }}
        >
          Create beautiful event pages, share invite details, and collect RSVPs
          all in one simple place.
        </p>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "0.8rem",
            flexWrap: "wrap",
          }}
        >
          <button onClick={() => navigate("/auth")} style={primaryButton}>
            Host an Invite
          </button>

          <button
            onClick={() => navigate("/host/events")}
            style={secondaryButton}
          >
            Host Dashboard
          </button>

          <button
            onClick={() => navigate("/find-invite")}
            style={secondaryButton}
          >
            Find My Invites
          </button>
        </div>

        <Footer />
      </div>
    </div>
  );
}

export default Home;