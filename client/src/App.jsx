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
          <Dashboard
            dashboard={dashboard}
            user={user}
            onDashboardUpdate={setDashboard}
            onLogout={logout}
          />
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

function Dashboard({ dashboard, user, onDashboardUpdate, onLogout }) {
  const [activeSection, setActiveSection] = useState("overview");
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
  const sections = [
    ["overview", "Overview"],
    ["details", "Student Details"],
    ["entry", "Data Entry"],
    ["courses", "Courses"],
    ["marks", "Marks"],
    ["attendance", "Attendance"],
    ["notices", "Notices"]
  ];

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

  async function deleteEntry(collection, id) {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/${collection}/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not delete entry");
      }

      onDashboardUpdate(data);
    } catch (error) {
      alert(error.message);
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
          <div className="dashboard-options" aria-label="Dashboard sections">
            {sections.map(([value, label]) => (
              <button
                className={activeSection === value ? "active" : ""}
                key={value}
                type="button"
                onClick={() => setActiveSection(value)}
              >
                {label}
              </button>
            ))}
          </div>

          {activeSection === "overview" && (
            <div className="dashboard-section">
              <h3>Overview</h3>
              <div className="metrics">
                <Metric label="Attendance" value={`${stats.attendance}%`} />
                <Metric label="Active Courses" value={stats.activeCourses} />
                <Metric label="Completed" value={stats.completedAssignments} />
                <Metric label="Pending" value={stats.pendingAssignments} />
              </div>
            </div>
          )}

          {activeSection === "details" && (
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
          )}

          {activeSection === "entry" && <DataEntryPanel onDashboardUpdate={onDashboardUpdate} />}

          {activeSection === "courses" && (
            <div className="dashboard-section">
            <h3>Courses</h3>
            <div className="course-list">
              {courses.map((course) => (
                <article className="course" key={course.id}>
                  <div>
                    <h4>{course.title}</h4>
                    <p>{course.progress}% complete</p>
                  </div>
                  <button
                    className="delete-button"
                    type="button"
                    onClick={() => deleteEntry("courses", course.id)}
                  >
                    Delete
                  </button>
                  <div className="progress" aria-label={`${course.title} progress`}>
                    <span style={{ width: `${course.progress}%` }} />
                  </div>
                </article>
              ))}
            </div>
            </div>
          )}

          {activeSection === "marks" && (
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
                  <button
                    className="delete-button compact"
                    type="button"
                    onClick={() => deleteEntry("marks", item.id)}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
            </div>
          )}

          {activeSection === "attendance" && (
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
                    <button
                      className="delete-button"
                      type="button"
                      onClick={() => deleteEntry("attendance", item.id)}
                    >
                      Delete
                    </button>
                    <div className="progress attendance-progress">
                      <span style={{ width: `${attendancePercent}%` }} />
                    </div>
                  </article>
                );
              })}
            </div>
            </div>
          )}

          {activeSection === "notices" && (
            <div className="dashboard-section">
            <h3>Notices</h3>
            <ul className="notice-list">
              {notices.map((notice) => (
                <li key={notice.id}>
                  <span>{notice.message}</span>
                  <button
                    className="delete-button compact"
                    type="button"
                    onClick={() => deleteEntry("notices", notice.id)}
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function DataEntryPanel({ onDashboardUpdate }) {
  const [entryType, setEntryType] = useState("course");
  const [entry, setEntry] = useState({
    title: "",
    progress: "",
    subject: "",
    score: "",
    maxScore: "100",
    attended: "",
    total: "",
    message: ""
  });
  const [entryMessage, setEntryMessage] = useState("");
  const [adding, setAdding] = useState(false);

  const endpointByType = {
    course: "/api/courses",
    mark: "/api/marks",
    attendance: "/api/attendance",
    notice: "/api/notices"
  };

  function updateEntry(event) {
    setEntry((current) => ({
      ...current,
      [event.target.name]: event.target.value
    }));
  }

  async function addEntry(event) {
    event.preventDefault();
    setAdding(true);
    setEntryMessage("");

    const payloads = {
      course: { title: entry.title, progress: entry.progress },
      mark: { subject: entry.subject, score: entry.score, maxScore: entry.maxScore },
      attendance: { subject: entry.subject, attended: entry.attended, total: entry.total },
      notice: { message: entry.message }
    };

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}${endpointByType[entryType]}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payloads[entryType])
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not add entry");
      }

      onDashboardUpdate(data);
      setEntry({
        title: "",
        progress: "",
        subject: "",
        score: "",
        maxScore: "100",
        attended: "",
        total: "",
        message: ""
      });
      setEntryMessage("Entry added successfully");
    } catch (error) {
      setEntryMessage(error.message);
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="dashboard-section">
      <h3>Data Entry</h3>
      <form className="entry-form" onSubmit={addEntry}>
        <label>
          Type
          <select value={entryType} onChange={(event) => setEntryType(event.target.value)}>
            <option value="course">Course</option>
            <option value="mark">Marks</option>
            <option value="attendance">Attendance</option>
            <option value="notice">Notice</option>
          </select>
        </label>

        {entryType === "course" && (
          <>
            <label>
              Course Title
              <input
                name="title"
                value={entry.title}
                onChange={updateEntry}
                placeholder="Example: Python"
                required
              />
            </label>
            <label>
              Progress
              <input
                name="progress"
                type="number"
                min="0"
                max="100"
                value={entry.progress}
                onChange={updateEntry}
                placeholder="0-100"
                required
              />
            </label>
          </>
        )}

        {entryType === "mark" && (
          <>
            <label>
              Subject
              <input
                name="subject"
                value={entry.subject}
                onChange={updateEntry}
                placeholder="Example: Python"
                required
              />
            </label>
            <label>
              Score
              <input
                name="score"
                type="number"
                min="0"
                value={entry.score}
                onChange={updateEntry}
                placeholder="Marks scored"
                required
              />
            </label>
            <label>
              Max Score
              <input
                name="maxScore"
                type="number"
                min="1"
                value={entry.maxScore}
                onChange={updateEntry}
                required
              />
            </label>
          </>
        )}

        {entryType === "attendance" && (
          <>
            <label>
              Subject
              <input
                name="subject"
                value={entry.subject}
                onChange={updateEntry}
                placeholder="Example: Python"
                required
              />
            </label>
            <label>
              Attended
              <input
                name="attended"
                type="number"
                min="0"
                value={entry.attended}
                onChange={updateEntry}
                required
              />
            </label>
            <label>
              Total
              <input
                name="total"
                type="number"
                min="1"
                value={entry.total}
                onChange={updateEntry}
                required
              />
            </label>
          </>
        )}

        {entryType === "notice" && (
          <label className="wide">
            Notice
            <input
              name="message"
              value={entry.message}
              onChange={updateEntry}
              placeholder="Enter notice"
              required
            />
          </label>
        )}

        {entryMessage && <p className="save-message">{entryMessage}</p>}

        <button type="submit" disabled={adding}>
          {adding ? "Adding..." : "Add entry"}
        </button>
      </form>
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
