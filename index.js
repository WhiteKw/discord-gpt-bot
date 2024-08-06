import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL  } from "node:url";
import dotenv from "dotenv";
import { Client, Collection, Events, GatewayIntentBits, REST, Routes, roleMention } from "discord.js";

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let messageHistory = [];

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
    await command.execute(interaction);
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

  if (messageHistory.length > 10) {
    messageHistory = messageHistory.slice(-10);
  }

  let messageHistoryString = "";
  messageHistory.forEach(item => {
    messageHistoryString += item + "\n";
  });

  const param = {
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    n: 1,
    messages: [
      {
        role: "assistant",
        content: messageHistoryString
      },
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
    messageHistory.push(`User : ${msg}`);
    messageHistory.push(`ChatBot : ${data.choices[0].message.content}`);
    message.reply(data.choices[0].message);
  })
  .catch(error => {
    console.log('Something bad happened ' + error)
    message.reply("Something bad happened");
  });
})

client.login(process.env.DISCORD_BOT_TOKEN);