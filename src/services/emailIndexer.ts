// // import { Client } from "@elastic/elasticsearch";
// // import { categorizeEmail } from "./aiCategorizer";
// // import axios from "axios";
// // import { WebClient } from "@slack/web-api";

// // // ---- Setup ----
// // const es = new Client({
// //   node: process.env.ELASTIC_URL || "http://localhost:9200",
// //   auth: {
// //     username: process.env.ELASTIC_USERNAME || "elastic",
// //     password: process.env.ELASTIC_PASSWORD || "",
// //   },
// //   tls: { rejectUnauthorized: false },
// // });

// // const slack = process.env.SLACK_TOKEN
// //   ? new WebClient(process.env.SLACK_TOKEN)
// //   : null;

// // // ---- Slack + Webhook Notifier ----
// // export async function notifyInterested(emailData: any) {
// //   try {
// //     if (emailData.category !== "Interested") return;

// //     // ✅ Option 1 — Slack Bot API
// //     if (slack && process.env.SLACK_CHANNEL) {
// //       await slack.chat.postMessage({
// //         channel: process.env.SLACK_CHANNEL,
// //         text: `📩 *New Interested Email!*\nFrom: *${emailData.from}*\nSubject: _${emailData.subject}_\nAccount: ${emailData.account}`,
// //       });
// //       console.log("✅ Slack bot message sent");
// //     }

// //     // ✅ Option 2 — Slack Incoming Webhook URL
// //     if (process.env.SLACK_WEBHOOK_URL) {
// //       await axios.post(process.env.SLACK_WEBHOOK_URL, {
// //         text: `💌 New Interested Email\nFrom: ${emailData.from}\nSubject: ${emailData.subject}`,
// //       });
// //       console.log("✅ Slack webhook message sent");
// //     }

// //     // ✅ External webhook for automation (webhook.site, Zapier, etc.)
// //     if (process.env.WEBHOOK_URL) {
// //       await axios.post(process.env.WEBHOOK_URL, emailData);
// //       console.log("✅ External webhook triggered");
// //     }
// //   } catch (err: any) {
// //     console.error("❌ notifyInterested error:", err.message || err);
// //   }
// // }

// // // ---- Elasticsearch Indexer ----
// // export async function indexEmail(emailData: any) {
// //   try {
// //     // Step 1: Categorize
// //     const category = await categorizeEmail(emailData.subject, emailData.body || "");

// //     // Step 2: Prepare document
// //     const doc = { ...emailData, category, indexedAt: new Date().toISOString() };

// //     // Step 3: Index into Elasticsearch
// //     await es.index({
// //       index: "emails",
// //       document: doc,
// //     });

// //     console.log(`📥 Indexed email: ${emailData.subject} [${category}]`);

// //     // Step 4: Send Slack & webhook notifications if interested
// //     await notifyInterested(doc);
// //   } catch (error) {
// //     console.error("❌ Elasticsearch indexing failed:", error);
// //   }
// // }
// import { Client } from "@elastic/elasticsearch";
// import { categorizeEmail } from "./aiCategorizer";
// import axios from "axios";
// import { WebClient } from "@slack/web-api";

// // ---- Elasticsearch Client (Bonsai compatible) ----
// const bonsaiUrl =
//   process.env.ELASTIC_URL ||
//   "https://9ea1a2bc4d:c7046f233a43b967fd4a@effervescent-ebony-1hxppx2z.us-east-1.bonsaisearch.net";

// export const esClient = new Client({
//   node: bonsaiUrl,
//   auth: undefined, // credentials are already in the URL for Bonsai
//   tls: { rejectUnauthorized: false },
  
// });

// // ✅ Test connection
// (async () => {
//   try {
//     const info = await esClient.info();
//     console.log("✅ Elasticsearch connected:", info.version.number);
//   } catch (err: any) {
//     console.error("❌ Elasticsearch connection failed:", err.message);
//   }
// })();

// // ---- Slack Setup ----
// const slack = process.env.SLACK_TOKEN
//   ? new WebClient(process.env.SLACK_TOKEN)
//   : null;

// // ---- Slack + Webhook Notifier ----
// export async function notifyInterested(emailData: any) {
//   try {
//     if (emailData.category !== "Interested") return;

//     // ✅ Option 1 — Slack Bot
//     if (slack && process.env.SLACK_CHANNEL) {
//       await slack.chat.postMessage({
//         channel: process.env.SLACK_CHANNEL,
//         text: `📩 *New Interested Email!*\nFrom: *${emailData.from}*\nSubject: _${emailData.subject}_\nAccount: ${emailData.account}`,
//       });
//       console.log("✅ Slack bot message sent");
//     }

//     // ✅ Option 2 — Incoming Webhook
//     if (process.env.SLACK_WEBHOOK_URL) {
//       await axios.post(process.env.SLACK_WEBHOOK_URL, {
//         text: `💌 New Interested Email\nFrom: ${emailData.from}\nSubject: ${emailData.subject}`,
//       });
//       console.log("✅ Slack webhook message sent");
//     }

//     // ✅ Option 3 — External Webhook (Zapier, webhook.site, etc.)
//     if (process.env.WEBHOOK_URL) {
//       await axios.post(process.env.WEBHOOK_URL, emailData);
//       console.log("✅ External webhook triggered");
//     }
//   } catch (err: any) {
//     console.error("❌ notifyInterested error:", err.message);
//   }
// }

// // ---- Elasticsearch Indexer ----
// export async function indexEmail(emailData: any) {
//   try {
//     // Step 1: Categorize with AI
//     const category = await categorizeEmail(
//       emailData.subject,
//       emailData.body || ""
//     );

//     // Step 2: Prepare document
//     const doc = { ...emailData, category, indexedAt: new Date().toISOString() };

//     // Step 3: Index to Elasticsearch (v8+ syntax)
//     await esClient.index({
//       index: "emails",
//       document: doc, // ✅ correct field (was `body`)
//     });

//     console.log(`📥 Indexed email: ${emailData.subject} [${category}]`);

//     // Step 4: Notify if interested
//     await notifyInterested(doc);
//   } catch (error: any) {
//     console.error("❌ Elasticsearch indexing failed:", error.message);
//   }
// }
import { Client } from "@elastic/elasticsearch";
import { categorizeEmail } from "./aiCategorizer";
import axios from "axios";
import { WebClient } from "@slack/web-api";

// ============================
// 🧠 Elasticsearch Client Setup
// ============================
const bonsaiUrl =
  process.env.ELASTIC_URL ||
  "https://9ea1a2bc4d:c7046f233a43b967fd4a@effervescent-ebony-1hxppx2z.us-east-1.bonsaisearch.net";

export const esClient = new Client({
  node: bonsaiUrl, // Bonsai URL contains credentials
  tls: { rejectUnauthorized: false }, // allow self-signed certs (Render/Railway safe)
});

// ✅ Test connection on startup
(async () => {
  try {
    const info = await esClient.info();
    console.log("✅ Elasticsearch connected:", info.version.number);
  } catch (err: any) {
    console.error("❌ Elasticsearch connection failed:", err.message);
  }
})();

// ======================
// 💬 Slack Configuration
// ======================
const slack = process.env.SLACK_TOKEN
  ? new WebClient(process.env.SLACK_TOKEN)
  : null;

// ============================
// 📢 Notifier for Interested Emails
// ============================
export async function notifyInterested(emailData: any) {
  try {
    if (emailData.category !== "Interested") return;

    // ✅ Option 1: Slack Bot API
    if (slack && process.env.SLACK_CHANNEL) {
      await slack.chat.postMessage({
        channel: process.env.SLACK_CHANNEL,
        text: `📩 *New Interested Email!*\nFrom: *${emailData.from}*\nSubject: _${emailData.subject}_\nAccount: ${emailData.account}`,
      });
      console.log("✅ Slack bot message sent");
    }

    // ✅ Option 2: Slack Incoming Webhook URL
    if (process.env.SLACK_WEBHOOK_URL) {
      await axios.post(process.env.SLACK_WEBHOOK_URL, {
        text: `💌 New Interested Email\nFrom: ${emailData.from}\nSubject: ${emailData.subject}`,
      });
      console.log("✅ Slack webhook message sent");
    }

    // ✅ Option 3: External Webhook (Zapier, webhook.site, etc.)
    if (process.env.WEBHOOK_URL) {
      await axios.post(process.env.WEBHOOK_URL, emailData);
      console.log("✅ External webhook triggered");
    }
  } catch (err: any) {
    console.error("❌ notifyInterested error:", err.message);
  }
}

// ============================
// 📥 Email Indexer Function
// ============================
export async function indexEmail(emailData: any) {
  try {
    // Step 1: Categorize with AI
    const category = await categorizeEmail(
      emailData.subject,
      emailData.body || ""
    );

    // Step 2: Prepare document
    const doc = {
      ...emailData,
      category,
      indexedAt: new Date().toISOString(),
    };

    // Step 3: Index into Elasticsearch (v8 syntax)
    await esClient.index({
      index: "emails",
      document: doc, // ✅ correct field name for Elasticsearch 8+
    });

    console.log(`📥 Indexed email: ${emailData.subject} [${category}]`);

    // Step 4: Notify interested parties
    await notifyInterested(doc);
  } catch (error: any) {
    console.error("❌ Elasticsearch indexing failed:", error.message);
  }
}
