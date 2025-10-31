import { CohereClient } from "cohere-ai";
import dotenv from "dotenv";
import axios from "axios";
import { WebClient } from "@slack/web-api";

// Load environment variables
dotenv.config();

// Initialize the Cohere client
const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY!,
});

// Setup Slack WebClient
const slack = process.env.SLACK_TOKEN ? new WebClient(process.env.SLACK_TOKEN) : null;

// Define the categories for your email classification
const categories = [
  "Interested",
  "Not Interested",
  "Follow Up",
  "Out of Office",
  "Spam",
];

/**
 * Categorize an email using Cohere's Rerank model
 */
export async function categorizeEmail(subject: string, body: string): Promise<string> {
  try {
    const text = `${subject}\n\n${body.slice(0, 1000)}`;

    // Use the rerank API
    const response = await cohere.rerank({
      query: text,
      documents: categories.map((label) => `This email should be labeled as: ${label}`),
      topN: 1,
      model: "rerank-english-v3.0",
    });

    const best = response.results?.[0];
    const label = best ? categories[best.index] : "Not Interested";

    console.log(`✅ Cohere categorized: ${label}`);
    return label;
  } catch (err: any) {
    console.error("❌ categorizeEmail error:", err.message || err);
    return "Not Interested";
  }
}

/**
 * Notify interested email via Slack and Webhook
 */
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

    // ✅ Option 2 — Slack Incoming Webhook
    if (process.env.SLACK_WEBHOOK_URL) {
      await axios.post(process.env.SLACK_WEBHOOK_URL, {
        text: `💌 New Interested Email\nFrom: ${emailData.from}\nSubject: ${emailData.subject}`,
      });
      console.log("✅ Slack webhook message sent");
    }

    // ✅ External webhook for automation (Webhook.site, Zapier, etc.)
    if (process.env.WEBHOOK_URL) {
      await axios.post(process.env.WEBHOOK_URL, emailData);
      console.log("✅ External webhook triggered");
    }
  } catch (err: any) {
    console.error("❌ notifyInterested error:", err.message || err);
  }
}

/**
 * Index the email into Elasticsearch and trigger notifications
 */
export async function indexEmail(emailData: any) {
  try {
    // Step 1: Categorize the email
    const category = await categorizeEmail(emailData.subject, emailData.body || "");

    // Step 2: Prepare the email document
    const doc = { ...emailData, category, indexedAt: new Date().toISOString() };

    // Step 3: Send Slack & webhook notifications if interested
    await notifyInterested(doc);
  } catch (error) {
    console.error("❌ Email processing failed:", error);
  }
}

