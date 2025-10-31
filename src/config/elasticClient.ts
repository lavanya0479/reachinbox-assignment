
import { Client } from "@elastic/elasticsearch";

export const esClient = new Client({
  node: process.env.ELASTIC_URL || "https://localhost:9200",
  auth: {
    username: process.env.ELASTIC_USERNAME || "elastic",
    password: process.env.ELASTIC_PASSWORD || "567Ir8tFXfOMXhxWAv+O",
  },
  tls: {
    rejectUnauthorized: false, // for local self-signed SSL cert
  },
});

// Test connection at startup
(async () => {
  try {
    console.log("🔍 Testing Elasticsearch connection...");
    const health = await esClient.cluster.health();
    console.log("✅ Elasticsearch connected:", health.status);
    
    // Check if index exists, create if not
    const indexExists = await esClient.indices.exists({ index: 'emails' });
    if (!indexExists) {
      console.log("📝 Creating 'emails' index...");
      await esClient.indices.create({
        index: 'emails',
        body: {
          mappings: {
            properties: {
              subject: { type: 'text' },
              from: { 
                type: 'text',
                fields: {
                  keyword: { type: 'keyword' }
                }
              },
              to: { 
                type: 'text',
                fields: {
                  keyword: { type: 'keyword' }
                }
              },
              date: { type: 'date' },
              body: { type: 'text' },
              account: {
                type: 'text',
                fields: {
                  keyword: { type: 'keyword' }
                }
              }
            }
          }
        }
      });
      console.log("✅ Index 'emails' created successfully");
    } else {
      console.log("✅ Index 'emails' already exists");
    }
  } catch (err: any) {
    console.error("❌ Elasticsearch connection failed:", err.message);
    console.error("\n🔧 Troubleshooting steps:");
    console.error("1. Make sure Elasticsearch Docker container is running:");
    console.error("   docker ps | grep elasticsearch");
    console.error("\n2. Check if Elasticsearch is accessible:");
    console.error("   curl -k -u elastic:567Ir8tFXfOMXhxWAv+O https://localhost:9200");
    console.error("\n3. Verify .env file has correct credentials:");
    console.error("   ELASTIC_URL=https://localhost:9200");
    console.error("   ELASTIC_USERNAME=elastic");
    console.error("   ELASTIC_PASSWORD=567Ir8tFXfOMXhxWAv+O");
  }
})();