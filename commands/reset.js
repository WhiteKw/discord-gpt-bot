import { SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("reset")
  .setDescription("대화 기록을 초기화 합니다.");

export async function execute(interaction, redisClient) {
  const guildId = interaction.guildId;
  await redisClient.v4.del(`${guildId}`);
  await interaction.reply(`대화 기록이 초기화되었습니다.`);
}