import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function FindInvite() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");

  function handleSubmit(e) {
    e.preventDefault();

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      alert("Please enter your email.");
      return;
    }

    navigate(`/auth?email=${encodeURIComponent(cleanEmail)}&redirect=/my-invites`);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f6f2fb", padding: "2rem" }}>
      <Navbar />
      <div
        style={{
          maxWidth: "600px",
          margin: "0 auto",
          background: "#fbf8fd",
          border: "1px solid #e8dff0",
          borderRadius: "22px",
          padding: "2rem",
          boxShadow: "0 10px 30px rgba(80, 60, 100, 0.08)",
        }}
      >
        <h1 style={{ color: "#6f627d" }}>Find My Invites</h1>

        <p style={{ color: "#7c6f88" }}>
          Enter your email to find invites connected to your RSVP.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem" }}>
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "10px",
              border: "1px solid #d8cde6",
              boxSizing: "border-box",
            }}
          />

          <button
            type="submit"
            style={{
              padding: "14px 24px",
              border: "none",
              borderRadius: "12px",
              background: "#8b5cf6",
              color: "white",
              fontWeight: "700",
              cursor: "pointer",
            }}
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}