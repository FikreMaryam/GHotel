// server.js
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;
const FILE_PATH = "reservations.xlsx";

app.use(cors());
app.use(bodyParser.json());

// Serve static files (HTML, CSS, JS, images)
app.use(express.static(path.join(__dirname)));

// 🔹 Load reservations from Excel
function loadReservations() {
  if (!fs.existsSync(FILE_PATH)) {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet([]);
    XLSX.utils.book_append_sheet(wb, ws, "Reservations");
    XLSX.writeFile(FILE_PATH);
    return [];
  }
  const wb = XLSX.readFile(FILE_PATH);
  const ws = wb.Sheets["Reservations"];
  return XLSX.utils.sheet_to_json(ws) || [];
}

// 🔹 Save reservations to Excel
function saveReservations(data) {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, "Reservations");
  XLSX.writeFile(wb, FILE_PATH);
}

// 🔹 API route: Get all reservations
app.get("/admin/reservations", (req, res) => {
  const reservations = loadReservations();
  res.json(reservations);
});

// 🔹 API route: Add new reservation
app.post("/reserve", (req, res) => {
  const reservations = loadReservations();
  const newReservation = {
    name: req.body.name,
    email: req.body.email,
    checkin: req.body.checkin,
    checkout: req.body.checkout,
    roomtype: req.body.roomtype,
    time: new Date().toISOString()
  };
  reservations.push(newReservation);
  saveReservations(reservations);
  res.json({ success: true, message: "Reservation saved" });
});

// 🔹 Optional: Catch-all route to serve index.html for /
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
