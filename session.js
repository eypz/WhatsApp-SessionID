let express = require("express");
let { toBuffer } = require("qrcode");
const { exec } = require("child_process");
const fs = require('fs');
const { PasteClient, Publicity } = require("pastebin-ts");
let app = global.app = express();
const PORT = process.env.PORT || 3000;
const pino = require("pino");
const router = express.Router();
const { delay, makeWASocket, useMultiFileAuthState, makeInMemoryStore, WAConnection, MessageType, MessageOptions, Mimetype } = require("@whiskeysockets/baileys").default;

const pastebin = new PasteClient("YOUR_PASTEBIN_API_KEY");

function GET_SESSION_ID() {
  const randomString = Math.random().toString(36).substring(2, 11);
  return `socket~${randomString}`;
}

app.use('/', router.get('/', (req, res) => {
  async function WhatsApp() {
    const { state, saveCreds } = useMultiFileAuthState("./auth_baileys_creds");
    try {
      const version = [2, 2140, 12];
      const socket = makeWASocket({
        logger: pino({ level: 'silent' }),
        browser: ["ALEXA MD", "Firefox", "3.0.0"],
        auth: state,
        version: version
      });

      socket.ev.on("connection.update", async (update) => {
        console.log(update);
        if (update.qr !== undefined) {
          res.end(await toBuffer(update.qr));
        }
        const { connection, lastDisconnect } = update;
        if (connection === 'open') {
          const sessionID = GET_SESSION_ID();
          const Data = JSON.stringify({ ...state.creds, sessionID });
          fs.writeFileSync("./auth_baileys_creds/creds.json", Data);

          const Message = {
            text: `Hello ${socket.user.name}, Here is your id\nPlease don't share it with anyone
            footer: 2024 Astrid`
          };
          await socket.sendMessage(socket.user.id, Message);

          const Content = fs.readFileSync("./auth_baileys_creds/creds.json", "utf-8");

          try {
            const pasteUrl = await pastebin.createPaste({
              code: Content,
              expireDate: 'N',
              publicity: Publicity.Unlisted,
              format: "json",
              name: "Session Data"
            });

            await socket.sendMessage(socket.user.id, {
              text: `*Session ID*: ${sessionID}`
            });

            await socket.sendMessage(socket.user.id, {
              document: fs.readFileSync("./auth_baileys_creds/creds.json"),
              mimetype: "application/json",
              fileName: "creds.json"
            });
          } catch (error) {
            console.error(error);
          }

          exec('rs');
          process.exit(0);
        }
        if (connection === "close" && lastDisconnect && lastDisconnect.error && lastDisconnect.error.output.statusCode != 409) {
          WhatsApp();
        }
      });
      socket.ev.on('creds.update', saveCreds);
      socket.ev.on("messages.upsert", () => {});
    } catch (error) {
      console.log(error);
    }
  }
  WhatsApp();
}));

app.listen(PORT, () => console.log(PORT));
  
