
import dotenv from "dotenv";
dotenv.config(); // Load .env first

import express from "express";
import cors from "cors";
import { ImapFlow } from "imapflow";
import { imapConfig } from "./config/imapConfig";
import { fetchEmails, setupIdleConnection } from "./services/emailService";
import emailRoutes from "./services/emailRoutes";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount email search routes
app.use("/api/emails", emailRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/", (req, res) => {
  res.send("🚀 ReachInbox Backend is running and connected!");
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("❌ Error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: err.message,
  });
});

app.listen(PORT, async () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📧 Email Search API: http://localhost:${PORT}/api/emails`);
  console.log(
    "IMAP Accounts:",
    imapConfig.map((acc) => acc.auth.user)
  );

  // Start IMAP connections in background
  connectAndFetchEmails();
});

// 📨 Function to connect and fetch emails
async function connectAndFetchEmails() {
  for (const cfg of imapConfig) {
    console.log(`🔄 Connecting to ${cfg.auth.user}...`);

    const imap = new ImapFlow({
      host: cfg.imap.host,
      port: cfg.imap.port,
      secure: cfg.imap.secure,
      auth: {
        user: cfg.auth.user,
        pass: cfg.auth.pass,
      },
    });

    try {
      await imap.connect();
      console.log(`📬 Connected to ${cfg.auth.user}`);

      // First, fetch existing emails from last 30 days
      await fetchEmails(imap, cfg.auth.user);

      // Then setup IDLE mode for real-time sync (keep connection alive)
      console.log(`🔔 Starting real-time sync for ${cfg.auth.user}...`);
      setupIdleConnection(imap, cfg.auth.user);

      // Don't logout - keep connection alive for IDLE mode
    } catch (error) {
      console.error(`❌ Error for ${cfg.auth.user}:`, error);
    }
  }
}
