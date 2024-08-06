import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import prompts from "../prompts.js";

export const data = new SlashCommandBuilder()
  .setName("prompt")
  .setDescription("GPT Bot의 Prompt를 변경합니다.")
  .addStringOption(option => 
    option.setName("name")
      .setDescription("변경할 Prompt를 선택하세요.")
      .setRequired(true)
      .addChoices(
        {name: "기본", value: "default"},
        {name: "분조장", value: "angry"},
        {name: "메스가키", value: "mesugaki"}
      )
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)

export async function execute(interaction, redisClient) {
  const selected = interaction.options.getString('name');
  const guildId = interaction.guildId;

  await redisClient.v4.set(`${guildId}_prompt`, prompts[selected].prompt);
  await redisClient.v4.del(`${guildId}`);
  await interaction.reply(`Prompt를 ${prompts[selected].name}(으)로 변경합니다.`);
}