import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("chat")
  .setDescription("GhatGPT")
  .addStringOption(option => 
    option.setName("message").setDescription("message!").setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)

export async function execute(interaction) {
  await interaction.reply(interaction.options._hoistedOptions[0].value)
}