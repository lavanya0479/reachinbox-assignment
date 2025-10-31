import { Client } from "@elastic/elasticsearch";

export const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL || "https://localhost:9200",
  auth: {
    username: process.env.ELASTICSEARCH_USERNAME || "",
    password: process.env.ELASTICSEARCH_PASSWORD || "",
  },
  tls: {
    rejectUnauthorized: false, // for local SSL cert
  },
});

// Optional: test connection at startup
(async () => {
  try {
    const health = await esClient.cluster.health();
    console.log("✅ Elasticsearch connected:", health.status);
  } catch (err) {
    console.error("❌ Elasticsearch connection failed:", err);
  }
})();
