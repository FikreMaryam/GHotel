// server.js
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

const RES_FILE = path.join(__dirname, "reservations.xlsx");
const ROOM_FILE = path.join(__dirname, "rooms.xlsx");

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
}));
app.use(bodyParser.json());

// Serve HTML/CSS/JS/images from this folder
app.use(express.static(path.join(__dirname)));

/* ----------------------- Helpers ----------------------- */
function ensureSheet(filePath, sheetName, initialRows) {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(initialRows);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filePath);
}

/* Reservations (stored as array of objects) */
function loadReservations() {
  if (!fs.existsSync(RES_FILE)) {
    ensureSheet(RES_FILE, "Reservations", []);
    return [];
  }
  const wb = XLSX.readFile(RES_FILE);
  const ws = wb.Sheets["Reservations"];
  return ws ? (XLSX.utils.sheet_to_json(ws) || []) : [];
}
function saveReservations(rows) {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, "Reservations");
  XLSX.writeFile(wb, RES_FILE);
}

/* Rooms (stored as array of strings under column `room`) */
function loadRooms() {
  if (!fs.existsSync(ROOM_FILE)) {
    ensureSheet(ROOM_FILE, "Rooms", [
      { room: "Deluxe Room" },
      { room: "Suite" },
      { room: "Standard Room" },
    ]);
  }
  const wb = XLSX.readFile(ROOM_FILE);
  const ws = wb.Sheets["Rooms"];
  const rows = ws ? (XLSX.utils.sheet_to_json(ws) || []) : [];
  // Support old shape {type: "..."} too:
  return rows.map(r => (r.room || r.type || "")).filter(Boolean);
}
function saveRooms(list) {
  const rows = list.map(name => ({ room: name }));
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, "Rooms");
  XLSX.writeFile(wb, ROOM_FILE);
}

/* ----------------------- API ----------------------- */
// Reservations
app.get("/admin/reservations", (req, res) => {
  res.json(loadReservations());
});

app.post("/reserve", (req, res) => {
  const { name, email, checkin, checkout, roomtype } = req.body || {};
  if (!name || !email || !checkin || !checkout || !roomtype) {
    return res.status(400).json({ success: false, message: "Missing fields" });
  }
  const reservations = loadReservations();
  reservations.push({
    name: String(name).trim(),
    email: String(email).trim(),
    checkin,
    checkout,
    roomtype,
    time: new Date().toISOString(),
  });
  saveReservations(reservations);
  res.json({ success: true, message: "Reservation saved" });
});

// Rooms (matches your admin.html)
app.get("/admin/rooms", (req, res) => {
  res.json(loadRooms());
});

app.post("/admin/rooms", (req, res) => {
  const { room } = req.body || {};
  const name = (room || "").trim();
  if (!name) {
    return res.status(400).json({ success: false, message: "Room name required" });
  }
  const rooms = loadRooms();
  const exists = rooms.some(r => r.toLowerCase() === name.toLowerCase());
  if (exists) {
    return res.status(409).json({ success: false, message: "Room already exists" });
  }
  rooms.push(name);
  saveRooms(rooms);
  res.json({ success: true, message: "Room added", room: name });
});

app.delete("/admin/rooms/:room", (req, res) => {
  const name = decodeURIComponent(req.params.room || "").trim();
  if (!name) return res.status(400).json({ success: false, message: "Room name missing" });

  const rooms = loadRooms();
  const remaining = rooms.filter(r => r.toLowerCase() !== name.toLowerCase());
  if (remaining.length === rooms.length) {
    return res.status(404).json({ success: false, message: "Room not found" });
  }
  saveRooms(remaining);
  res.json({ success: true, message: "Room deleted", room: name });
});

/* ----------------------- Root ----------------------- */
app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
