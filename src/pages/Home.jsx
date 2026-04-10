import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f7f7fb",
        padding: "2rem",
      }}
    >
      <div
        style={{
          maxWidth: "700px",
          textAlign: "center",
          background: "white",
          padding: "3rem",
          borderRadius: "20px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
        }}
      >
        <h1 style={{ fontSize: "3rem", marginBottom: "1rem" }}>InvitePool</h1>

        <p style={{ fontSize: "1.1rem", color: "#555", marginBottom: "2rem" }}>
          Create beautiful event pages, share invite details, and collect RSVPs all in one place.
        </p>

        <button
          onClick={() => navigate("/auth")}
          style={{
            padding: "14px 24px",
            border: "none",
            borderRadius: "12px",
            background: "#8b5cf6",
            color: "white",
            fontSize: "1rem",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          Host an Invite
        </button>
        <button
          onClick={() => navigate("/host/events")}
          style={{
            padding: "14px 24px",
            border: "1px solid #8b5cf6",
            borderRadius: "12px",
            background: "white",
            color: "#8b5cf6",
            fontSize: "1rem",
            fontWeight: "600",
            cursor: "pointer",
            marginTop: "12px",
          }}
        >
          Host Dashboard
        </button>
          <div
          style={{
            marginTop: "2rem",
            textAlign: "center",
            fontSize: "0.85rem",
            color: "#777",
          }}
        >
          © {new Date().getFullYear()} InvitePool by Angelina Gutierrez
        </div>
      </div>

    </div>
  );
}

export default Home;