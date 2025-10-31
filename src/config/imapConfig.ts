import dotenv from "dotenv";
dotenv.config(); // 👈 ensures .env is loaded before anything else

export interface ImapAccount {
  imap: {
    host: string;
    port: number;
    secure: boolean;
  };
  auth: {
    user: string;
    pass: string;
  };
}

export const imapConfig: ImapAccount[] = [
  {
    imap: {
      host: "imap.gmail.com",
      port: 993,
      secure: true,
    },
    auth: {
      user: process.env.IMAP_USER_1 || "",
      pass: process.env.IMAP_PASS_1 || "",
    },
  },
  {
    imap: {
      host: "imap.gmail.com",
      port: 993,
      secure: true,
    },
    auth: {
      user: process.env.IMAP_USER_2 || "",
      pass: process.env.IMAP_PASS_2 || "",
    },
  },
];
