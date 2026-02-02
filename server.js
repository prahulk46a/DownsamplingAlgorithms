const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const { downsampleMinMax } = require("./sampling_algo/BasicDownsampling.js");
const { lttb } = require("./sampling_algo/LTTB.js");
const { decimate } = require("./sampling_algo/Decimation.js");
const { swingingDoor } = require("./sampling_algo/SwingingDoor.js");
const { generateBatch } = require("./utils/helpers.js");
const { generateSingleReading } = require("./utils/helpers.js");
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

/* ------------------ DATABASE SETUP ------------------ */
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "root",
  database: "test_aggregation",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Initialize database table
(async () => {
  try {
    const connection = await pool.getConnection();
    await connection.query(`
      CREATE TABLE IF NOT EXISTS sensor_readings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ts BIGINT NOT NULL,
        value DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_ts (ts)
      )
    `);
    connection.release();
    console.log("Connected to MySQL database and table ready");
  } catch (err) {
    console.error("Database initialization error:", err);
  }
})();

/* ------------------ RANGE CONFIG ------------------ */
function getConfig(range) {
  const now = Date.now();

  switch (range) {
    case "1h":
      return {
        start: now - 1 * 60 * 60 * 1000,
        step: 1000,
        maxPoints: 400
      };
    case "1d":
      return {
        start: now - 24 * 60 * 60 * 1000,
        step: 5000,
        maxPoints: 400
      };
    case "1w":
      return {
        start: now - 7 * 24 * 60 * 60 * 1000,
        step: 60000,
        maxPoints: 300
      };
    default:
      throw new Error("Invalid range");
  }
}


app.get("/api/chart", (req, res) => {
  const range = req.query.range || "1d";

  let rawData;
  let processedData;

  if (range === "1h") {
    rawData = generateBatch(3600);             // 1 hour
    processedData = decimate(rawData, 5);      // fast live view
  }

  else if (range === "1d") {
    rawData = generateBatch(86400);            // 1 day
    processedData = swingingDoor(rawData, 5);  // accurate
  }

  else if (range === "1w") {
    rawData = generateBatch(604800);            // 1 week
    processedData = lttb(rawData, 300);         // UI-friendly
  }

  else {
    return res.status(400).json({ error: "Invalid range" });
  }

  res.json({
    range,
    points: processedData
  });
});

app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);

setInterval(async () => {
  try {
    const reading = generateSingleReading();
    const connection = await pool.getConnection();
    await connection.query(
      "INSERT INTO sensor_readings (ts, value) VALUES (?, ?)",
      [reading.ts, reading.value]
    );
    connection.release();
    console.log(`[${new Date().toISOString()}] Inserted reading: ts=${reading.ts}, value=${reading.value}`);
  } catch (err) {
    console.error("Auto insert error:", err.message);
  }
}, 1000); // 1 seconds


process.on("SIGINT", async () => {
  await pool.end();
  console.log("MySQL connection pool closed");
  process.exit(0);

});