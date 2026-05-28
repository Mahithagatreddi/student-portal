import { useEffect, useMemo, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function App() {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const isRegister = mode === "register";
  const title = useMemo(() => (isRegister ? "Create your account" : "Welcome back"), [isRegister]);

  useEffect(() => {
    if (!token) return;

    fetch(`${API_URL}/api/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Profile request failed");
        setUser(data.user);
      })
      .catch(() => {
        localStorage.removeItem("token");
        setToken("");
      });
  }, [token]);

  function updateField(event) {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const endpoint = isRegister ? "/api/auth/register" : "/api/auth/login";
    const payload = isRegister ? form : { email: form.email, password: form.password };

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Request failed");
      }

      localStorage.setItem("token", data.token);
      setToken(data.token);
      setUser(data.user);
      setForm({ name: "", email: "", password: "" });
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem("token");
    setToken("");
    setUser(null);
    setMessage("");
  }

  return (
    <main className="shell">
      <section className="panel intro">
        <p className="eyebrow">Student Portal</p>
        <h1>Manage student access with a clean MERN stack starter.</h1>
        <p>
          Register, sign in, and verify protected profile data from an Express API
          connected to MongoDB.
        </p>
        <div className="status">
          <span>React + Vite</span>
          <span>Express</span>
          <span>MongoDB</span>
        </div>
      </section>

      <section className="panel auth-card">
        {user ? (
          <div className="profile">
            <p className="eyebrow">Signed in</p>
            <h2>{user.name}</h2>
            <p>{user.email}</p>
            <button type="button" onClick={logout}>
              Logout
            </button>
          </div>
        ) : (
          <>
            <div className="tabs" aria-label="Authentication mode">
              <button
                className={mode === "login" ? "active" : ""}
                type="button"
                onClick={() => setMode("login")}
              >
                Login
              </button>
              <button
                className={mode === "register" ? "active" : ""}
                type="button"
                onClick={() => setMode("register")}
              >
                Register
              </button>
            </div>

            <h2>{title}</h2>

            <form onSubmit={handleSubmit}>
              {isRegister && (
                <label>
                  Name
                  <input
                    name="name"
                    value={form.name}
                    onChange={updateField}
                    placeholder="Your name"
                    required
                  />
                </label>
              )}

              <label>
                Email
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={updateField}
                  placeholder="you@example.com"
                  required
                />
              </label>

              <label>
                Password
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={updateField}
                  placeholder="Minimum 6 characters"
                  minLength="6"
                  required
                />
              </label>

              {message && <p className="error">{message}</p>}

              <button type="submit" disabled={loading}>
                {loading ? "Please wait..." : isRegister ? "Create account" : "Login"}
              </button>
            </form>
          </>
        )}
      </section>
    </main>
  );
}
