import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL  } from "node:url";
import dotenv from "dotenv";
import { Client, Collection, Events, GatewayIntentBits, REST, Routes } from "discord.js";
import redis from "redis";

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Redis 연결
const redisClient = redis.createClient({ legacyMode: true });
redisClient.on("connect", () => {
  console.log("Redis connected!");
});
redisClient.on("error", err => {
  console.error("Redis client error", err);
});
redisClient.connect().then();
const redisCli = redisClient.v4;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildIntegrations,
  ]
});
client.commands = new Collection();

const commands = [];
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = await import(pathToFileURL(filePath).href);

  if ("data" in command && "execute" in command) {
    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
  }
}

const rest = new REST().setToken(process.env.DISCORD_BOT_TOKEN);

// Deploy commands
(async () => {
  try {
    console.log(`Started refreshing ${commands.length} application (/) commands.`);

    const data = await rest.put(
      Routes.applicationCommands(process.env.DISCORD_BOT_CLIENT_ID),
      { body: commands }
    );

    console.log(`Successfully reloaded ${data.length} application (/) commands.`);
  } catch (error) {
    console.error(error);
  }
})();

client.once(Events.ClientReady, readyClient => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
		return;
  }

  try {
    await command.execute(interaction, redisClient);
  } catch (error) {
    console.error(error);

    if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
  }
})

client.on(Events.MessageCreate, async message => {
  if (!message.content.startsWith(`<@${client.user.id}>`)) return;

  const msg = message.content.replace(`<@${client.user.id}>`, "").trim();
  const guildId = message.guildId;

  let messageHistory = await redisClient.v4.get(guildId);

  if (messageHistory === null || messageHistory === undefined) {
    messageHistory = [];
  } else {
    messageHistory = JSON.parse(messageHistory);

    if (messageHistory.length > 10) {
      messageHistory = messageHistory.slice(-10);
    }
  }

  const prompt = await redisClient.v4.get(`${guildId}_prompt`);
  const param = {
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    n: 1,
    messages: [
      {
        role: "system",
        content: prompt ?? "you are helpful assistant."
      },
      ...messageHistory,
      {
        role: "user",
        content: msg
      }
    ]
  };

  await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + process.env.OPENAI_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(param)
  })
  .then(response => response.json())
  .then(data => {
    messageHistory.push({ role: "user", content: msg });
    messageHistory.push({ role: "assistant", content: data.choices[0].message.content });
    redisClient.v4.set(guildId, JSON.stringify(messageHistory));
    message.reply(data.choices[0].message);
  })
  .catch(error => {
    console.log('Something bad happened ' + error)
    message.reply("Something bad happened");
  });
})

client.login(process.env.DISCORD_BOT_TOKEN);