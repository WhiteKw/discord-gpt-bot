import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { REST, Routes, Collection } from "discord.js";

const setCommands = async (client, __dirname, token, clientId) => {
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

  const rest = new REST().setToken(token);

  try {
    console.log(`Started refreshing ${commands.length} application (/) commands...`);

    const data = await rest.put(
      Routes.applicationCommands(clientId),
      { body: commands }
    );

    console.log(`\u001b[1;32mSuccessfully reloaded ${data.length} application (/) commands.\u001b[0m`);
  } catch (error) {
    console.error(error);
  }
};

export default setCommands;