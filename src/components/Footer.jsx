import { useNavigate } from "react-router-dom";

export default function Footer() {
  const navigate = useNavigate();

  return (
    <footer
      style={{
        marginTop: "3rem",
        padding: "1.5rem 1rem",
        borderTop: "1px solid #e8dff0",
        background: "#fbf8fd",
      }}
    >
      <div
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        {/* LEFT */}
        <div
          style={{
            fontSize: "0.85rem",
            color: "#9b8daa",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          © {new Date().getFullYear()} InvitePool by Angelina Race
        </div>

        {/* RIGHT LINKS */}
        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            flexWrap: "wrap",
          }}
        >

          <button style={link} onClick={() => navigate("/find-invite")}>
            Find Invite
          </button>

          <button style={link} onClick={() => navigate("/my-invites")}>
            My Invites
          </button>

          <button style={link} onClick={() => navigate("/host/events")}>
            Dashboard
          </button>
        </div>
      </div>
    </footer>
  );
}

const link = {
  background: "none",
  border: "none",
  color: "#6f627d",
  fontWeight: "600",
  cursor: "pointer",
  fontSize: "0.9rem",
};