
import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";


export const data = new SlashCommandBuilder()
  .setName("prompt")
  .setDescription("GPT Bot의 Prompt를 변경합니다.")
  .addStringOption(option => 
    option.setName("name")
      .setDescription("변경할 Prompt를 선택하세요.")
      .setRequired(true)
      .addChoices(...global.promptOptions)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)

export async function execute(interaction, redisClient) {
  const selected = interaction.options.getString('name');
  const guildId = interaction.guildId;

  await redisClient.v4.set(`${guildId}_prompt`, global.prompts[selected].prompt);
  await redisClient.v4.del(`${guildId}`);
  await interaction.reply(`프롬프트가 ${global.prompts[selected].name}(으)로 변경되었습니다.${global.prompts[selected].caution ? "\n(⚠ " + global.prompts[selected].caution + ")" : ""}`);
}