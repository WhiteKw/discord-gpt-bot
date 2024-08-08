import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("model")
  .setDescription("GPT 모델을 변경합니다.")
  .addStringOption(option => 
    option.setName("name")
      .setDescription("변경할 모델을 선택하세요.")
      .setRequired(true)
      .addChoices(
        {name: "GPT-4o", value: "GPT-4o"},
        {name: "GPT-3.5-turbo", value: "GPT-3.5-turbo"}
      )
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)

export async function execute(interaction, redisClient) {
  const selected = interaction.options.getString('name');
  const guildId = interaction.guildId;

  await redisClient.v4.set(`${guildId}_model`, selected.toLowerCase());
  await interaction.reply(`GPT 모델이 ${selected}(으)로 변경되었습니다.`);
}