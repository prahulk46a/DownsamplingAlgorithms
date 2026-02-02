// Insert new sensor reading
app.post("/api/reading", async (req, res) => {
  const { ts, value } = req.body;
  
  if (ts === undefined || value === undefined) {
    return res.status(400).json({ error: "Missing ts or value" });
  }
  
  try {
    const connection = await pool.getConnection();
    const [result] = await connection.query(
      "INSERT INTO sensor_readings (ts, value) VALUES (?, ?)",
      [ts, value]
    );
    connection.release();
    res.json({ id: result.insertId, ts, value });
  } catch (err) {
    console.error("Insert error:", err);
    res.status(500).json({ error: "Failed to insert reading" });
  }
});
// Delete readings older than specified timestamp
app.delete("/api/readings/old", async (req, res) => {
  const { beforeTs } = req.query;
  
  if (!beforeTs) {
    return res.status(400).json({ error: "Missing beforeTs parameter" });
  }
  
  try {
    const connection = await pool.getConnection();
    const [result] = await connection.query(
      "DELETE FROM sensor_readings WHERE ts < ?",
      [beforeTs]
    );
    connection.release();
    res.json({ deletedCount: result.affectedRows });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: "Failed to delete readings" });
  }
});
// Get statistics
app.get("/api/stats", async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query(
      "SELECT COUNT(*) as count, MIN(value) as min, MAX(value) as max, AVG(value) as mean FROM sensor_readings"
    );
    connection.release();
    res.json(rows[0]);
  } catch (err) {
    console.error("Stats error:", err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// function generateData(start, end, stepMs) {
//   let value = 25000;
//   const data = [];

//   for (let t = start; t <= end; t += stepMs) {
//     value += (Math.random() - 0.5) * 25; 
//     data.push({
//       ts: t,
//       value: Number(value.toFixed(2))
//     });
//   }
//   return data;
// }
// module.exports = { generateData };