const express = require("express");
const axios = require("axios");
const { default: makeWASocket, useMultiFileAuthState, Browsers, delay, makeCacheableSignalKeyStore } = require("@whiskeysockets/baileys");
const pino = require("pino");

const app = express();
const PORT = process.env.PORT || 3000;
const PRIVATEBIN_URL = "https://privatebin.net";

const logger = pino({ level: "fatal" });

async function createWASession() {
  const { state, saveCreds } = await useMultiFileAuthState("./multi_file_auth/auth_info.json");
  let session;

  try {
    session = makeWASocket({
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger.child({ level: "fatal" })),
      },
      printQRInTerminal: true,
      logger: logger.child({ level: "fatal" }),
      browser: Browsers.macOS("Safari"),
    });

    session.ev.on("connection.update", async (update) => {
      const { connection, qr, lastDisconnect } = update;
      if (connection === "open") {
        logger.info("WhatsApp connection opened successfully.");

        if (session.user) {
          const sessionID = session.user.id;
          const data = JSON.stringify({ ...session.authState.creds, sessionID });

          try {
            const encodedData = Buffer.from(data).toString("base64");
            const response = await axios.post(`${PRIVATEBIN_URL}/?paste`, encodedData, {
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
            });

            const PASTE_KEY = response.data;
            logger.info(PASTE_KEY);
            const Bin_HATED = `${PRIVATEBIN_URL}/${PASTE_KEY}`;
            logger.info(`PrivateBin: ${Bin_HATED}`);

            await session.sendMessage(session.user.id, { text: "*Greetings*" });
            await session.sendMessage(session.user.id, {
              text: `*Dear*: ${session.user.name}\n*Your session ID*: ${sessionID}\n*PrivateBin*: ${Bin_HATED}\n\nFooter: 2024 Astrid`,
            });
          } catch (error) {
            logger.error(error);
          }
        } else {
          logger.error("Session user is undefined");
        }
      } else if (connection === "close") {
        logger.error("WhatsApp connection closed.");
        if (lastDisconnect?.error?.output?.statusCode === 401) {
          logger.error("Session expired or invalid credentials.");
        }
      } else if (qr) {
        logger.info(qr); 
      } else {
        logger.info(`Connection status: ${connection}`);
      }
    });
  } catch (error) {
    logger.error(error);
    throw error;
  }

  return session;
}

async function pairNumber(num, res, session) {
  if (!session.authState.creds.registered) {
    await delay(1500);
    num = num.replace(/[^0-9]/g, "");

    try {
      const code = await session.requestPairingCode(num);
      res.send({ code });
    } catch (error) {
      logger.error(error);
      res.status(500).send({ error: "Failed to request pairing code." });
    }
  } else {
    res.send({ message: "Session is already registered." });
  }
}

app.get("/pair", async (req, res) => {
  const { num } = req.query;

  if (!num) {
    return res.status(400).send({ error: "Phone number is required." });
  }

  try {
    const session = await createWASession();
    await pairNumber(num, res, session);
  } catch (error) {
    logger.error(error);
    res.status(500).send({ error: "Failed to pair." });
  }
});

app.listen(PORT, () => logger.info(`Server is running on port ${PORT}`));
