const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
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

/* ------------------ DATA GENERATION ------------------ */
let lastSensorValue = 25000;
// Generate a single sensor reading with continuity
function generateSingleReading() {
  lastSensorValue += (Math.random() - 0.5) * 25;
  return {
    ts: Date.now(),
    value: Number(lastSensorValue.toFixed(2))
  };
}

/* ------------------ DOWNSAMPLING ------------------ */
function downsampleMinMax(data, maxPoints) {
  if (data.length <= maxPoints) return data;

  const bucketSize = Math.ceil(data.length / maxPoints);
  const sampled = [];

  for (let i = 0; i < data.length; i += bucketSize) {
    const bucket = data.slice(i, i + bucketSize);
    if (!bucket.length) continue;

    let min = bucket[0];
    let max = bucket[0];

    for (const p of bucket) {
      if (p.value < min.value) min = p;
      if (p.value > max.value) max = p;
    }
    min.ts < max.ts ? sampled.push(min, max) : sampled.push(max, min);
  }

  return sampled;
}

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

/* ------------------ API ------------------ */
// Get sensor data for a range
app.get("/api/chart", async (req, res) => {
  const range = req.query.range || "1d";
  const { start, step, maxPoints } = getConfig(range);
  const now = Date.now();

  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query(
      "SELECT ts, value FROM sensor_readings WHERE ts >= ? AND ts <= ? ORDER BY ts ASC",
      [start, now]
    );
    connection.release();
    
    // If no data in database, generate sample data
    let raw = rows && rows.length > 0 ? rows : generateData(start, now, step);
    const points = downsampleMinMax(raw, maxPoints);
    console.log('Downsampled points=>', points.length);
    console.log('Original points=>', raw.length);
    res.json({ range, points });
  } catch (err) {
    console.error("Query error:", err);
    res.status(500).json({ error: "Failed to fetch data" });
  }
});



app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);

/* ------------------ AUTO INSERT TASK ------------------ */
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

// Graceful shutdown
process.on("SIGINT", async () => {
  await pool.end();
  console.log("MySQL connection pool closed");
  process.exit(0);

});
