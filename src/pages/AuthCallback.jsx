import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../components/supabaseClient";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    async function finishAuth() {
      const { error } = await supabase.auth.getSession();

      if (error) {
        setMessage("We could not verify your email. Please try logging in again.");
        return;
      }

      setMessage("Email verified successfully!");
    }

    finishAuth();
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f6f2fb",
        padding: "2rem",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "#fff",
          padding: "2rem",
          borderRadius: "20px",
          boxShadow: "0 6px 18px rgba(80, 60, 100, 0.08)",
          textAlign: "center",
        }}
      >
        <h1 style={{ color: "#6f627d", fontSize: "1.8rem", marginBottom: "0.75rem" }}>
          {message}
        </h1>
        <p style={{ color: "#7c6f88", marginBottom: "1.5rem" }}>
          You can now log in and manage your InvitePool events.
        </p>
        <button
          type="button"
          onClick={() => navigate("/auth")}
          style={{
            background: "#8b5cf6",
            color: "white",
            border: "none",
            borderRadius: "12px",
            padding: "12px 18px",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          Go to Login
        </button>
      </div>
    </div>
  );
}
