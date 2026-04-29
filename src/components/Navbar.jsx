import { useNavigate } from "react-router-dom";
import { supabase } from "../components/supabaseClient";
import { useEffect, useState } from "react";

export default function Navbar() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  // 👇 check if user is logged in
  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    setUser(user);
  }

  // 👇 logout function
  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/");
  }

  return (
    <div
      style={{
        width: "100%",
        padding: "0.6rem 1.2rem",
        borderBottom: "1px solid #e8dff0",
        background: "#fbf8fd",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      {/* Logo */}
      <div
        onClick={() => navigate("/")}
        style={{
          fontWeight: "700",
          fontSize: "1.1rem",
          color: "#6f627d",
          cursor: "pointer",
        }}
      >
        InvitePool
      </div>

      {/* Links */}
      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
        <button style={link} onClick={() => navigate("/find-invite")}>
          Find Invite
        </button>

        <button style={link} onClick={() => navigate("/my-invites")}>
          My Invites
        </button>

        <button style={link} onClick={() => navigate("/host/events")}>
          Dashboard
        </button>

        {/* 👇 Only show if logged in */}
        {user && (
          <button style={logout} onClick={handleLogout}>
            Logout
          </button>
        )}
      </div>
    </div>
  );
}

const link = {
  background: "none",
  border: "none",
  color: "#6f627d",
  fontWeight: "500",
  fontSize: "0.9rem",
  cursor: "pointer",
};

const logout = {
  background: "transparent",
  border: "none",
  color: "#6f627d",
  fontWeight: "600",
  fontSize: "0.85rem",
  cursor: "pointer",
};