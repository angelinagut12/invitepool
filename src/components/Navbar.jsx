import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../components/supabaseClient";

export default function Navbar() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    setUser(user);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setMenuOpen(false);
    navigate("/");
  }

  function goTo(path) {
    setMenuOpen(false);
    navigate(path);
  }

  return (
    <nav style={navWrapper}>
      <div style={navInner}>
        <button style={logoButton} onClick={() => goTo("/")}>
          InvitePool
        </button>

        <button
          style={menuButton}
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="Toggle navigation menu"
        >
          {menuOpen ? "×" : "☰"}
        </button>
      </div>

      {menuOpen && (
        <div style={dropdown}>
          <button style={dropdownLink} onClick={() => goTo("/")}>
            Home
          </button>

          <button style={dropdownLink} onClick={() => goTo("/find-invite")}>
            Find Invite
          </button>

          <button style={dropdownLink} onClick={() => goTo("/my-invites")}>
            My Invites
          </button>

          <button style={dropdownLink} onClick={() => goTo("/host/events")}>
            Host Dashboard
          </button>

          <button style={primaryLink} onClick={() => goTo("/create")}>
            + Create Event
          </button>

          {user && (
            <button style={logoutLink} onClick={handleLogout}>
              Logout
            </button>
          )}
        </div>
      )}
    </nav>
  );
}

const navWrapper = {
  width: "100%",
  background: "#fbf8fd",
  borderBottom: "1px solid #e8dff0",
  position: "relative",
  zIndex: 50,
};

const navInner = {
  maxWidth: "1100px",
  margin: "0 auto",
  padding: "0.75rem 1rem",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  minHeight: "64px",
};

const logoButton = {
  background: "none",
  border: "none",
  color: "#6f627d",
  fontFamily: "'Playfair Display', serif",
  fontSize: "1.35rem",
  fontWeight: "700",
  cursor: "pointer",
};

const menuButton = {
  background: "#eee7f5",
  border: "1px solid #d8cde6",
  color: "#6f627d",
  borderRadius: "10px",
  width: "42px",
  height: "38px",
  fontSize: "1.3rem",
  fontWeight: "700",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  lineHeight: 1,
  padding: 0,
};

const dropdown = {
  maxWidth: "1100px",
  margin: "0 auto",
  padding: "0 1rem 1rem",
  display: "grid",
  gap: "0.65rem",
};

const dropdownLink = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "12px",
  border: "1px solid #e8dff0",
  background: "white",
  color: "#6f627d",
  fontWeight: "700",
  fontSize: "0.95rem",
  cursor: "pointer",
  textAlign: "left",
};

const primaryLink = {
  ...dropdownLink,
  background: "#6f627d",
  color: "white",
  border: "1px solid #6f627d",
  textAlign: "center",
};

const logoutLink = {
  ...dropdownLink,
  color: "#9f4f5f",
};