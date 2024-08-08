import { Events } from "discord.js";

const setEvents = (client, redisClient) => {
  // Bot Client 준비 완료
  client.once(Events.ClientReady, readyClient => {
    console.log(`\u001b[1;34m✔ Ready! Logged in as ${readyClient.user.tag}\u001b[0m`);
  });

  // Slash (/) 명령어 처리
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
  });

  // 대화 처리
  client.on(Events.MessageCreate, async message => {
    if (!message.content.startsWith(`<@${client.user.id}>`)) return;

    message.channel.sendTyping();

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
    const model = await redisClient.v4.get(`${guildId}_model`);
    const param = {
      model: model ?? "gpt-3.5-turbo",
      temperature: 1,
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
      message.reply("오류가 발생하였습니다 : " + error);
    });
  });
};

export default setEvents;