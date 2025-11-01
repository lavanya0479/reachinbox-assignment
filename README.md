# 📧 ReachInbox Backend Assignment

This is the **backend service** for the ReachInbox assignment.  
It connects to **Gmail IMAP accounts**, fetches messages, classifies them using **Cohere AI**, indexes them into **Elasticsearch**, and sends notifications via **Slack** and **Webhook** when new categorized emails arrive.

---

## 🚀 Features

Fetches emails from multiple Gmail IMAP accounts  
Uses **Cohere AI** to categorize and enrich email content  
Indexes emails into **Elasticsearch** for fast search  
Sends real-time notifications to **Slack** and **Webhook**  
Built in **TypeScript** with modular, clean architecture  

---

## 🧩 Tech Stack

- **Node.js + TypeScript**
- **Express.js**
- **IMAPFlow** — for reading emails
- **Elasticsearch 8.x** — for indexing and searching
- **Cohere AI API** — for text embeddings and classification
- **Slack SDK** — for real-time notifications
- **Axios** — for webhook communication
- **dotenv** — for configuration

---

## ⚙️ Setup Instructions

### Clone the Repository
```bash
git clone https://github.com/lavanya0479/reachinbox-assignment.git
cd reachinbox-assignment
```
---
2️⃣ Install Dependencies
```bash
npm install
```
---
3️⃣ Configure Environment Variables

Create a .env file in the project root and add the following:
```bash
# --- IMAP Email Accounts ---
IMAP_USER_1=l47773631@gmail.com
IMAP_PASS_1=xxxxxxxxx

IMAP_USER_2=madamsailavanya@gmail.com
IMAP_PASS_2=xxxxxxxx

# --- Elasticsearch Config ---
ELASTIC_URL=https://localhost:9200
ELASTIC_USERNAME=xxxxxxx
ELASTIC_PASSWORD=xxxxxxxx
ELASTIC_INDEX=emails

# --- Slack Integration ---
SLACK_TOKEN=xxxxxxx
SLACK_CHANNEL=email-updates

# --- Webhook Integration ---
WEBHOOK_URL=https://webhook.site/dcaf37d2-87bf-4169-b695-94f22416750d

# --- Cohere AI Integration ---
COHERE_API_KEY=pBIPrbQyzt4FWxbqcnf5jBzW77yjGfAUCFnUFrBi

# --- Server Config ---
PORT=10000
NODE_ENV=production

```
---

📝 Note:

- Use Gmail App Passwords for IMAP (not your login password).

- Ensure Elasticsearch is accessible and the index exists (emails).

- The Slack bot must be invited to the target channel.

---
## 🧠 Cohere AI Categorizer

Cohere AI is used to analyze the **email subject and body** and automatically categorize each message before indexing it into Elasticsearch.

---

### 🧩 Example Categories

- 💬 *Interested*
- 🚫 *Not Interested*
- 🏖️ *Out of Office*
- 📢 *Promotional / Marketing*

---

### ⚙️ How it Works

1. When an email is fetched from IMAP, its **subject and text** are sent to Cohere for classification:

   ```ts
   const response = await cohere.classify({
     inputs: [email.subject + ' ' + email.text],
     examples: [
       { text: "I'm interested in your product, let's connect!", label: "Interested" },
       { text: "Not looking for this right now, thanks.", label: "Not Interested" },
       { text: "I'm out of office until next week.", label: "Out of Office" },
       { text: "50% off sale this weekend!", label: "Promotional / Marketing" },
     ],
   });
2. Cohere returns a label like "Interested" or "Out of Office".

3. The email is stored in Elasticsearch with an added field:
```ts
{
  "from": "sender@gmail.com",
  "subject": "Let's schedule a demo",
  "body": "Hi, I'm interested in seeing your platform in action.",
  "category": "Interested"
}
```
4. Slack and Webhook receive this category in their notifications.

---
# 🧾 Example Slack Notification

📨 New Email Indexed!
From: sender@gmail.com
Subject: Let's schedule a demo
💬 Category: Interested
✅ Indexed successfully in Elasticsearch

---

Run Elasticsearch in Docker
```bash
docker run -d \
  --name elasticsearch \
  -p 9200:9200 \
  -e "discovery.type=single-node" \
  -e "ELASTIC_PASSWORD=your_password_here" \
  docker.elastic.co/elasticsearch/elasticsearch:8.14.0
```
---

5️⃣ Start the Server

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm run build
npm start
```
---
6️⃣ Verify Elasticsearch Connection

Visit the health-check route in your browser:
```bash
http://localhost:5000/
```
