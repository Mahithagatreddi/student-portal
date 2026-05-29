const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET || "change-this-secret";
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  ...(process.env.CLIENT_URL ? process.env.CLIENT_URL.split(",") : [])
].map((origin) => origin.trim());

app.use(express.json());
app.use(
  cors({
    origin(origin, callback) {
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        /^http:\/\/localhost:517\d$/.test(origin)
      ) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true
  })
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    rollNumber: { type: String, trim: true, default: "" },
    department: { type: String, trim: true, default: "" },
    year: { type: String, trim: true, default: "" },
    phone: { type: String, trim: true, default: "" },
    address: { type: String, trim: true, default: "" }
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

function createToken(user) {
  return jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, {
    expiresIn: "7d"
  });
}

function sanitizeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    rollNumber: user.rollNumber || "",
    department: user.department || "",
    year: user.year || "",
    phone: user.phone || "",
    address: user.address || ""
  };
}

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Authorization token is required" });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

app.get("/", (req, res) => {
  res.json({ message: "Student Portal API is running" });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
  });
});

app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email is already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword });

    return res.status(201).json({
      token: createToken(user),
      user: sanitizeUser(user)
    });
  } catch (error) {
    return res.status(500).json({ message: "Registration failed" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    return res.json({
      token: createToken(user),
      user: sanitizeUser(user)
    });
  } catch (error) {
    return res.status(500).json({ message: "Login failed" });
  }
});

app.get("/api/profile", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ user: sanitizeUser(user) });
  } catch (error) {
    return res.status(500).json({ message: "Could not load profile" });
  }
});

app.get("/api/dashboard", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      user: sanitizeUser(user),
      stats: {
        attendance: 92,
        completedAssignments: 8,
        pendingAssignments: 2,
        activeCourses: 4
      },
      courses: [
        { id: "cs101", title: "Web Development", progress: 78 },
        { id: "db201", title: "Database Systems", progress: 64 },
        { id: "js301", title: "JavaScript Programming", progress: 86 },
        { id: "ux110", title: "UI Design Basics", progress: 58 }
      ],
      marks: [
        { id: "m1", subject: "Web Development", score: 86, maxScore: 100 },
        { id: "m2", subject: "Database Systems", score: 78, maxScore: 100 },
        { id: "m3", subject: "JavaScript Programming", score: 91, maxScore: 100 },
        { id: "m4", subject: "UI Design Basics", score: 74, maxScore: 100 }
      ],
      attendance: [
        { id: "a1", subject: "Web Development", attended: 34, total: 38 },
        { id: "a2", subject: "Database Systems", attended: 29, total: 34 },
        { id: "a3", subject: "JavaScript Programming", attended: 36, total: 39 },
        { id: "a4", subject: "UI Design Basics", attended: 27, total: 32 }
      ],
      notices: [
        "Submit database assignment before Friday.",
        "Web Development practical review is scheduled this week.",
        "Attendance report has been updated."
      ]
    });
  } catch (error) {
    return res.status(500).json({ message: "Could not load dashboard" });
  }
});

app.put("/api/profile", requireAuth, async (req, res) => {
  try {
    const { rollNumber, department, year, phone, address } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        rollNumber: rollNumber || "",
        department: department || "",
        year: year || "",
        phone: phone || "",
        address: address || ""
      },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ user: sanitizeUser(user) });
  } catch (error) {
    return res.status(500).json({ message: "Could not update profile" });
  }
});

async function startServer() {
  if (!MONGO_URI) {
    console.error("MONGO_URI is missing. Add it to server/.env before starting.");
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGO_URI);
    app.listen(PORT, () => {
      console.log(`API running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Database connection failed:", error.message);
    process.exit(1);
  }
}

startServer();
