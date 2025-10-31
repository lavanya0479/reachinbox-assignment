import { Client } from "@elastic/elasticsearch";
import { categorizeEmail } from "./aiCategorizer";
import axios from "axios";
import { WebClient } from "@slack/web-api";

// ---- Setup ----
const es = new Client({
  node: process.env.ELASTIC_URL || "http://localhost:9200",
  auth: {
    username: process.env.ELASTIC_USERNAME || "elastic",
    password: process.env.ELASTIC_PASSWORD || "",
  },
  tls: { rejectUnauthorized: false },
});

const slack = process.env.SLACK_TOKEN
  ? new WebClient(process.env.SLACK_TOKEN)
  : null;

// ---- Slack + Webhook Notifier ----
export async function notifyInterested(emailData: any) {
  try {
    if (emailData.category !== "Interested") return;

    // ✅ Option 1 — Slack Bot API
    if (slack && process.env.SLACK_CHANNEL) {
      await slack.chat.postMessage({
        channel: process.env.SLACK_CHANNEL,
        text: `📩 *New Interested Email!*\nFrom: *${emailData.from}*\nSubject: _${emailData.subject}_\nAccount: ${emailData.account}`,
      });
      console.log("✅ Slack bot message sent");
    }

    // ✅ Option 2 — Slack Incoming Webhook URL
    if (process.env.SLACK_WEBHOOK_URL) {
      await axios.post(process.env.SLACK_WEBHOOK_URL, {
        text: `💌 New Interested Email\nFrom: ${emailData.from}\nSubject: ${emailData.subject}`,
      });
      console.log("✅ Slack webhook message sent");
    }

    // ✅ External webhook for automation (webhook.site, Zapier, etc.)
    if (process.env.WEBHOOK_URL) {
      await axios.post(process.env.WEBHOOK_URL, emailData);
      console.log("✅ External webhook triggered");
    }
  } catch (err: any) {
    console.error("❌ notifyInterested error:", err.message || err);
  }
}

// ---- Elasticsearch Indexer ----
export async function indexEmail(emailData: any) {
  try {
    // Step 1: Categorize
    const category = await categorizeEmail(emailData.subject, emailData.body || "");

    // Step 2: Prepare document
    const doc = { ...emailData, category, indexedAt: new Date().toISOString() };

    // Step 3: Index into Elasticsearch
    await es.index({
      index: "emails",
      document: doc,
    });

    console.log(`📥 Indexed email: ${emailData.subject} [${category}]`);

    // Step 4: Send Slack & webhook notifications if interested
    await notifyInterested(doc);
  } catch (error) {
    console.error("❌ Elasticsearch indexing failed:", error);
  }
}
