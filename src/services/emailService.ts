
// import { ImapFlow } from "imapflow";
// import { indexEmail } from "./emailIndexer";

// export const fetchEmails = async (imap: ImapFlow, account: string) => {
//   try {
//     console.log(`📨 Fetching emails for ${account}...`);

//     if (!imap.authenticated) {
//       await imap.connect();
//     }

//     const lock = await imap.getMailboxLock("INBOX");
//     try {
//       const mailbox = imap.mailbox;
//       if (!mailbox) {
//         console.error("❌ Mailbox not available.");
//         return;
//       }

//       const total = mailbox.exists ?? 0;
//       if (total === 0) {
//         console.log(`📭 No emails found for ${account}.`);
//         return;
//       }

//       // Calculate date 30 days ago
//       const thirtyDaysAgo = new Date();
//       thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

//       // Fetch all emails and filter by date
//       for await (const msg of imap.fetch(`1:*`, { 
//         envelope: true, 
//         source: true 
//       })) {
//         const envelope = msg.envelope!;
//         const emailDate = envelope.date ? new Date(envelope.date) : new Date();
        
//         // Skip emails older than 30 days
//         if (emailDate < thirtyDaysAgo) {
//           continue;
//         }

//         const rawSource = msg.source ? msg.source.toString() : "";

//         const emailData = {
//           subject: envelope.subject || "(No Subject)",
//           from: envelope.from?.map((f) => f.address).join(", ") || "Unknown",
//           to: envelope.to?.map((t) => t.address).join(", ") || "Unknown",
//           date: emailDate.toISOString(),
//           body: rawSource.slice(0, 8000),
//           account,
//         };

//         await indexEmail(emailData);
//       }

//       console.log(`✅ Fetched and indexed emails for ${account}`);
//     } finally {
//       lock.release();
//     }
//   } catch (error) {
//     console.error(`❌ Error fetching emails for ${account}:`, error);
//   }
// };

// export const setupIdleConnection = async (imap: ImapFlow, account: string) => {
//   try {
//     console.log(`🔔 Setting up IDLE mode for ${account}...`);

//     if (!imap.authenticated) {
//       await imap.connect();
//     }

//     const lock = await imap.getMailboxLock("INBOX");
    
//     try {
//       // Listen for new emails in real-time
//       imap.on("exists", async (data) => {
//         console.log(`📬 New email detected for ${account}! (Total: ${data.count})`);
        
//         try {
//           // Fetch the latest email
//           for await (const msg of imap.fetch(`${data.count}`, { envelope: true, source: true })) {
//             const envelope = msg.envelope!;
//             const rawSource = msg.source ? msg.source.toString() : "";

//             const emailData = {
//               subject: envelope.subject || "(No Subject)",
//               from: envelope.from?.map((f) => f.address).join(", ") || "Unknown",
//               to: envelope.to?.map((t) => t.address).join(", ") || "Unknown",
//               date: envelope.date ? new Date(envelope.date).toISOString() : new Date().toISOString(),
//               body: rawSource.slice(0, 8000),
//               account,
//             };

//             await indexEmail(emailData);
//             console.log(`✅ Indexed new email: ${emailData.subject}`);
//           }
//         } catch (error) {
//           console.error(`❌ Error processing new email:`, error);
//         }
//       });

//       // Start IDLE mode
//       console.log(`✅ IDLE mode active for ${account} - monitoring for new emails...`);
      
//       // Keep the connection alive
//       while (true) {
//         await imap.idle();
//       }
      
//     } catch (error) {
//       console.error(`❌ IDLE error for ${account}:`, error);
//       lock.release();
      
//       // Reconnect after error
//       setTimeout(() => {
//         console.log(`🔄 Reconnecting IDLE for ${account}...`);
//         setupIdleConnection(imap, account);
//       }, 5000);
//     }
//   } catch (error) {
//     console.error(`❌ Error setting up IDLE for ${account}:`, error);
//   }
// };
import { ImapFlow } from "imapflow";
import { indexEmail } from "./emailIndexer";

export const fetchEmails = async (imap: ImapFlow, account: string) => {
  try {
    console.log(`📨 Fetching emails for ${account}...`);
    if (!imap.authenticated) await imap.connect();

    const lock = await imap.getMailboxLock("INBOX");
    try {
      const mailbox = imap.mailbox;
      if (!mailbox) return console.error("❌ Mailbox not available.");

      const total = mailbox.exists ?? 0;
      if (total === 0) return console.log(`📭 No emails found for ${account}.`);

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      for await (const msg of imap.fetch("1:*", { envelope: true, source: true })) {
        const envelope = msg.envelope!;
        const emailDate = envelope.date ? new Date(envelope.date) : new Date();

        if (emailDate < thirtyDaysAgo) continue;

        const emailData = {
          subject: envelope.subject || "(No Subject)",
          from: envelope.from?.map(f => f.address).join(", ") || "Unknown",
          to: envelope.to?.map(t => t.address).join(", ") || "Unknown",
          date: emailDate.toISOString(),
          body: msg.source?.toString().slice(0, 8000) || "",
          account,
        };

        await indexEmail(emailData);
      }

      console.log(`✅ Fetched and indexed emails for ${account}`);
    } finally {
      lock.release();
    }
  } catch (error) {
    console.error(`❌ Error fetching emails for ${account}:`, error);
  }
};

// ---- Real-time IDLE mode ----
export const setupIdleConnection = async (imap: ImapFlow, account: string) => {
  try {
    console.log(`🔔 Setting up IDLE mode for ${account}...`);
    if (!imap.authenticated) await imap.connect();

    const lock = await imap.getMailboxLock("INBOX");
    imap.on("exists", async data => {
      console.log(`📬 New email detected for ${account}!`);
      for await (const msg of imap.fetch(`${data.count}`, { envelope: true, source: true })) {
        const envelope = msg.envelope!;
        const emailData = {
          subject: envelope.subject || "(No Subject)",
          from: envelope.from?.map(f => f.address).join(", ") || "Unknown",
          to: envelope.to?.map(t => t.address).join(", ") || "Unknown",
          date: envelope.date ? new Date(envelope.date).toISOString() : new Date().toISOString(),
          body: msg.source?.toString().slice(0, 8000) || "",
          account,
        };

        await indexEmail(emailData);
        console.log(`✅ Indexed new email: ${emailData.subject}`);
      }
    });

    console.log(`✅ IDLE mode active for ${account}`);
    while (true) await imap.idle();
  } catch (error) {
    console.error(`❌ IDLE error for ${account}:`, error);
    setTimeout(() => setupIdleConnection(imap, account), 5000);
  }
};
