import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../components/supabaseClient";

function Auth() {
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  function getFriendlyAuthError(message) {
    const normalizedMessage = message?.toLowerCase() || "";

    if (normalizedMessage.includes("email not confirmed")) {
      return "Please verify your email before logging in. Check your inbox for the InvitePool confirmation email, then click the verification link.";
    }

    if (normalizedMessage.includes("email rate limit exceeded")) {
      return "A verification email was already sent. Please check your inbox or spam folder, then wait a few minutes before requesting another one.";
    }

    return message || "Something went wrong.";
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrorMessage("");
    setSuccessMessage("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) throw error;

        navigate("/host/events");
      } else {
        const { error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: window.location.origin + "/auth/callback",
          },
        });

        if (error) throw error;

        setSuccessMessage(
          "Account created. Please check your email and click the verification link before logging in."
        );
        setIsLogin(true);
        setFormData({
          email: formData.email,
          password: "",
        });
      }
    } catch (error) {
      console.error("Auth error:", error.message);
      setErrorMessage(getFriendlyAuthError(error.message));
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword() {
    setErrorMessage("");
    setSuccessMessage("");

    if (!formData.email) {
      setErrorMessage("Please enter your email first.");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(
      formData.email,
      {
        redirectTo: window.location.origin + "/auth",
      }
    );

    if (error) {
      console.error("Reset error:", error.message);
      setErrorMessage("Error sending reset email.");
    } else {
      setSuccessMessage("Password reset email sent. Check your inbox.");
    }
  }

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
      }}
    >
      <h2
        style={{
          marginBottom: "0.5rem",
          textAlign: "center",
          color: "#6f627d",
        }}
      >
        {isLogin ? "Host Login" : "Create Host Account"}
      </h2>

      <p
        style={{
          textAlign: "center",
          color: "#9b8daa",
          marginBottom: "1.5rem",
        }}
      >
        {isLogin
          ? "Log in to manage your events."
          : "Create an account, then verify your email before logging in."}
      </p>

      {errorMessage && (
        <div
          style={{
            background: "#fef2f2",
            color: "#b91c1c",
            border: "1px solid #fecaca",
            padding: "12px",
            borderRadius: "10px",
            marginBottom: "1rem",
            fontSize: "0.9rem",
          }}
        >
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div
          style={{
            background: "#ecfdf5",
            color: "#166534",
            border: "1px solid #bbf7d0",
            padding: "12px",
            borderRadius: "10px",
            marginBottom: "1rem",
            fontSize: "0.9rem",
          }}
        >
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem" }}>
        {!isLogin && (
          <div
            style={{
              background: "#f5f3ff",
              color: "#6f627d",
              border: "1px solid #ddd6fe",
              padding: "12px",
              borderRadius: "10px",
              fontSize: "0.9rem",
              lineHeight: "1.4",
            }}
          >
            After you create your account, InvitePool will email you a verification
            link. You will need to click that link before logging in.
          </div>
        )}

        <div>
          <label style={{ color: "#6f627d", fontWeight: "500" }}>
            Email
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            style={{
              width: "100%",
              padding: "12px",
              marginTop: "6px",
              borderRadius: "10px",
              border: "1px solid #d8cde6",
              background: "#faf9ff",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div>
          <label style={{ color: "#6f627d", fontWeight: "500" }}>
            Password
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            style={{
              width: "100%",
              padding: "12px",
              marginTop: "6px",
              borderRadius: "10px",
              border: "1px solid #d8cde6",
              background: "#faf9ff",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ textAlign: "right" }}>
          <button
            type="button"
            onClick={handleResetPassword}
            style={{
              background: "none",
              border: "none",
              color: "#8b5cf6",
              cursor: "pointer",
              fontSize: "0.9rem",
              fontWeight: "500",
            }}
          >
            Forgot Password?
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            background: "#8b5cf6",
            color: "white",
            border: "none",
            borderRadius: "12px",
            padding: "12px",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          {loading
            ? "Please wait..."
            : isLogin
            ? "Log In"
            : "Create Account"}
        </button>
      </form>

      <p
        style={{
          marginTop: "1.2rem",
          textAlign: "center",
          color: "#6f627d",
        }}
      >
        {isLogin ? "Need an account?" : "Already have an account?"}{" "}
        <button
          type="button"
          onClick={() => {
            setIsLogin((prev) => !prev);
            setErrorMessage("");
            setSuccessMessage("");
          }}
          style={{
            background: "none",
            border: "none",
            color: "#8b5cf6",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          {isLogin ? "Sign up" : "Log in"}
        </button>
      </p>
    </div>
  </div>
);
}

export default Auth;
