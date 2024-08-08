import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { Client, GatewayIntentBits } from "discord.js";

import setRedis from "./setRedis.js";
import setPrompts from "./setPrompts.js";
import setCommands from "./setCommands.js";
import setEvents from "./setEvents.js";

dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const botToken = process.env.DISCORD_BOT_TOKEN;
const botClientId = process.env.DISCORD_BOT_CLIENT_ID;

// Bot client 생성
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildIntegrations,
  ]
});

(async () => {
  const redisClient = await setRedis();
  await setPrompts(__dirname);
  await setCommands(client, __dirname, botToken, botClientId);
  setEvents(client, redisClient);

  client.login(process.env.DISCORD_BOT_TOKEN);
})();