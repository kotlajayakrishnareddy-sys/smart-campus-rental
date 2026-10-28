
const express = require("express");
const path = require("path");
const Database = require("better-sqlite3");

const app = express();
const PORT = 3000;

const db = new Database("campusrent.db");

db.exec(`
  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ownerName TEXT NOT NULL,
    ownerPhone TEXT NOT NULL,
    studentName TEXT NOT NULL,
    studentPhone TEXT NOT NULL,
    itemName TEXT NOT NULL,
    startDate TEXT NOT NULL,
    endDate TEXT NOT NULL,
    pickupLocation TEXT NOT NULL,
    returnLocation TEXT NOT NULL,
    totalAmount INTEGER NOT NULL,
    paymentMethod TEXT NOT NULL,
    paymentStatus TEXT NOT NULL DEFAULT 'Pending',
    createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

app.get("/api/health", (req, res) => {
  res.json({
    status: "success",
    message: "Smart Campus Rental backend is running!"
  });
});

app.post("/api/bookings", (req, res) => {
  const {
    ownerName, ownerPhone, studentName, studentPhone,
    itemName, startDate, endDate, pickupLocation,
    returnLocation, paymentMethod
  } = req.body;

  const prices = {
    "Laptop": 200,
    "Mobile Phone": 100,
    "Calculator": 30
  };

  if (
    !ownerName || !ownerPhone || !studentName || !studentPhone ||
    !prices[itemName] || !startDate || !endDate ||
    !pickupLocation || !returnLocation || !paymentMethod
  ) {
    return res.status(400).json({
      status: "error",
      message: "Please provide all required booking details."
    });
  }

  if (endDate <= startDate) {
    return res.status(400).json({
      status: "error",
      message: "Return date must be after the start date."
    });
  }

  const days = Math.round(
    (Date.parse(endDate + "T00:00:00Z") -
     Date.parse(startDate + "T00:00:00Z")) / 86400000
  );

  if (!Number.isInteger(days) || days < 1 || days > 365) {
    return res.status(400).json({
      status: "error",
      message: "Invalid rental duration."
    });
  }

  const totalAmount = prices[itemName] * days;

  const result = db.prepare(`
    INSERT INTO bookings (
      ownerName, ownerPhone, studentName, studentPhone,
      itemName, startDate, endDate, pickupLocation,
      returnLocation, totalAmount, paymentMethod
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    ownerName.trim(), ownerPhone.trim(), studentName.trim(),
    studentPhone.trim(), itemName, startDate, endDate,
    pickupLocation.trim(), returnLocation.trim(),
    totalAmount, paymentMethod
  );

  res.status(201).json({
    status: "success",
    bookingId: result.lastInsertRowid,
    totalAmount,
    paymentStatus: "Pending",
    message: "Booking request saved. Payment is still pending."
  });
});

app.listen(PORT, () => {
  console.log(`Smart Campus Rental running at http://localhost:${PORT}`);
});
