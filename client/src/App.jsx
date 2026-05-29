import { useEffect, useMemo, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function App() {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");
  const [user, setUser] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const isRegister = mode === "register";
  const title = useMemo(() => (isRegister ? "Create your account" : "Welcome back"), [isRegister]);

  useEffect(() => {
    if (!token) return;

    fetch(`${API_URL}/api/dashboard`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Dashboard request failed");
        setUser(data.user);
        setDashboard(data);
      })
      .catch(() => {
        localStorage.removeItem("token");
        setToken("");
        setDashboard(null);
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
      setDashboard(null);
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
    setDashboard(null);
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
          <Dashboard dashboard={dashboard} user={user} onLogout={logout} />
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

function Dashboard({ dashboard, user, onLogout }) {
  const [profile, setProfile] = useState({
    rollNumber: user.rollNumber || "",
    department: user.department || "",
    year: user.year || "",
    phone: user.phone || "",
    address: user.address || ""
  });
  const [saveMessage, setSaveMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const stats = dashboard?.stats;
  const courses = dashboard?.courses || [];
  const marks = dashboard?.marks || [];
  const attendance = dashboard?.attendance || [];
  const notices = dashboard?.notices || [];
  const totalScore = marks.reduce((sum, item) => sum + item.score, 0);
  const totalMaxScore = marks.reduce((sum, item) => sum + item.maxScore, 0);
  const percentage = totalMaxScore ? Math.round((totalScore / totalMaxScore) * 100) : 0;

  useEffect(() => {
    setProfile({
      rollNumber: user.rollNumber || "",
      department: user.department || "",
      year: user.year || "",
      phone: user.phone || "",
      address: user.address || ""
    });
  }, [user]);

  function updateProfileField(event) {
    setProfile((current) => ({
      ...current,
      [event.target.name]: event.target.value
    }));
  }

  async function saveProfile(event) {
    event.preventDefault();
    setSaving(true);
    setSaveMessage("");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(profile)
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Profile update failed");
      }

      setSaveMessage("Profile saved successfully");
    } catch (error) {
      setSaveMessage(error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="dashboard">
      <div className="dashboard-head">
        <div>
          <p className="eyebrow">Student Dashboard</p>
          <h2>{user.name}</h2>
          <p>{user.email}</p>
        </div>
        <button type="button" onClick={onLogout}>
          Logout
        </button>
      </div>

      {!dashboard ? (
        <p className="loading">Loading dashboard...</p>
      ) : (
        <>
          <div className="metrics">
            <Metric label="Attendance" value={`${stats.attendance}%`} />
            <Metric label="Active Courses" value={stats.activeCourses} />
            <Metric label="Completed" value={stats.completedAssignments} />
            <Metric label="Pending" value={stats.pendingAssignments} />
          </div>

          <div className="dashboard-section">
            <h3>Student Details</h3>
            <form className="details-form" onSubmit={saveProfile}>
              <label>
                Roll Number
                <input
                  name="rollNumber"
                  value={profile.rollNumber}
                  onChange={updateProfileField}
                  placeholder="Example: 22CS101"
                />
              </label>

              <label>
                Department
                <input
                  name="department"
                  value={profile.department}
                  onChange={updateProfileField}
                  placeholder="Example: Computer Science"
                />
              </label>

              <label>
                Year
                <input
                  name="year"
                  value={profile.year}
                  onChange={updateProfileField}
                  placeholder="Example: 3rd Year"
                />
              </label>

              <label>
                Phone
                <input
                  name="phone"
                  value={profile.phone}
                  onChange={updateProfileField}
                  placeholder="Example: 9876543210"
                />
              </label>

              <label className="wide">
                Address
                <input
                  name="address"
                  value={profile.address}
                  onChange={updateProfileField}
                  placeholder="Your address"
                />
              </label>

              {saveMessage && <p className="save-message">{saveMessage}</p>}

              <button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save details"}
              </button>
            </form>
          </div>

          <div className="dashboard-section">
            <h3>Courses</h3>
            <div className="course-list">
              {courses.map((course) => (
                <article className="course" key={course.id}>
                  <div>
                    <h4>{course.title}</h4>
                    <p>{course.progress}% complete</p>
                  </div>
                  <div className="progress" aria-label={`${course.title} progress`}>
                    <span style={{ width: `${course.progress}%` }} />
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="dashboard-section">
            <div className="section-title">
              <h3>Marks</h3>
              <span>{percentage}% Overall</span>
            </div>
            <div className="marks-table">
              <div className="marks-row marks-head">
                <span>Subject</span>
                <span>Marks</span>
                <span>Status</span>
              </div>
              {marks.map((item) => (
                <div className="marks-row" key={item.id}>
                  <span>{item.subject}</span>
                  <span>
                    {item.score}/{item.maxScore}
                  </span>
                  <span className={item.score >= 40 ? "pass" : "fail"}>
                    {item.score >= 40 ? "Pass" : "Fail"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="dashboard-section">
            <h3>Attendance</h3>
            <div className="attendance-list">
              {attendance.map((item) => {
                const attendancePercent = Math.round((item.attended / item.total) * 100);

                return (
                  <article className="attendance-card" key={item.id}>
                    <div className="attendance-top">
                      <div>
                        <h4>{item.subject}</h4>
                        <p>
                          {item.attended}/{item.total} classes attended
                        </p>
                      </div>
                      <strong>{attendancePercent}%</strong>
                    </div>
                    <div className="progress attendance-progress">
                      <span style={{ width: `${attendancePercent}%` }} />
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          <div className="dashboard-section">
            <h3>Notices</h3>
            <ul className="notice-list">
              {notices.map((notice) => (
                <li key={notice}>{notice}</li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="metric">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}
