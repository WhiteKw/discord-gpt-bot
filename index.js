import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL  } from "node:url";
import dotenv from "dotenv";
import { Client, Collection, Events, GatewayIntentBits } from "discord.js";

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildIntegrations
  ]
});
client.commands = new Collection();

const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = await import(pathToFileURL(filePath).href);

  if ("data" in command && "execute" in command) {
    const commandName = command.data.name;
    client.commands.set(commandName, command);
    console.log(`Set command : ${commandName}`);
  }
}

client.once(Events.ClientReady, readyClient => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {
  console.log(interaction);
})

client.on(Events.MessageCreate, async message => {
  console.log(message.content);
})

client.login(process.env.DISCORD_BOT_TOKEN);