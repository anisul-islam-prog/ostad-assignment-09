const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const os = require("os");

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST,
  port: 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Health check for ALB
app.get("/api/health", async (req, res) => {
  try {
    const start = Date.now();
    await pool.query("SELECT 1");
    res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        status: "connected",
        responseTime: `${Date.now() - start}ms`,
      },
    });
  } catch (err) {
    res.status(503).json({
      status: "unhealthy",
      error: err.message,
    });
  }
});

app.get("/api/deployment-info", (req, res) => {
  res.json({
    version: process.env.APP_VERSION || "2.1.0",
    commit: process.env.GIT_COMMIT || "unknown",
    deployedAt: process.env.DEPLOYMENT_TIME || new Date().toISOString(),
    environment: process.env.NODE_ENV || "production",
    hostname: os.hostname(),
    instanceId: process.env.INSTANCE_ID || "unknown",
  });
});

// Sample data endpoint
app.get("/api/users", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users ORDER BY id");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend running on port ${PORT}`);
});
