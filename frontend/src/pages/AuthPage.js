import React, { useState } from "react";
import { loginUser, registerUser } from "../api";

function AuthPage({ onAuthSuccess }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = {
        email: form.email.trim(),
        password: form.password,
      };

      if (mode === "register") {
        payload.name = form.name.trim();
      }

      const response =
        mode === "register" ? await registerUser(payload) : await loginUser(payload);

      onAuthSuccess(response.token, response.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-panel">
        <h1>Mountain Logbook</h1>
        <p>Track your mountain trips, stats, weather, and photos.</p>

        <form onSubmit={handleSubmit} className="grid-form">
          {mode === "register" && (
            <label>
              Name
              <input name="name" value={form.name} onChange={handleChange} required />
            </label>
          )}

          <label>
            Email
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              minLength={6}
            />
          </label>

          {error && <div className="error-box">{error}</div>}

          <button type="submit" disabled={loading}>
            {loading ? "Please wait..." : mode === "register" ? "Create account" : "Login"}
          </button>
        </form>

        <button
          type="button"
          className="text-btn"
          onClick={() => setMode((prev) => (prev === "login" ? "register" : "login"))}
        >
          {mode === "login" ? "Need an account? Register" : "Have an account? Login"}
        </button>
      </div>
    </div>
  );
}

export default AuthPage;
