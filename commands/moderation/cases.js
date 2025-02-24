const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { modRoles, modLogChannelId } = require('../../config/config.json');

const logsPath = path.join(__dirname, '../../data/moderationLogs.json');

module.exports = {
  name: 'cases',
  description: 'View a user’s moderation history.',
  async execute(message, args) {
    // Check if user has a mod role
    if (!message.member.roles.cache.some(role => modRoles.includes(role.id))) {
      return message.reply('❌ You do not have permission to use this command.');
    }

    const user = message.mentions.users.first();
    if (!user) return message.reply('⚠️ Please mention a user to view their moderation history.');

    if (!fs.existsSync(logsPath)) {
      return message.reply('📂 No moderation logs found.');
    }

    const logsData = JSON.parse(fs.readFileSync(logsPath, 'utf8'));
    const userCases = logsData[user.id] || [];

    if (userCases.length === 0) {
      return message.reply(`✅ No moderation history found for **${user.tag}**.`);
    }

    // Build case details
    const caseDetails = userCases
      .slice(-5) // Show last 5 cases (prevents spam)
      .map((entry, index) =>
        `**#${index + 1}**\n📅 **Date:** ${new Date(entry.timestamp).toLocaleString()}\n👮 **Moderator:** ${entry.moderator}\n⚖️ **Action:** ${entry.action}\n📝 **Reason:** ${entry.reason || 'No reason provided.'}`
      )
      .join('\n\n');

    // Create an embed response
    const embed = new EmbedBuilder()
      .setTitle(`⚖️ Moderation History for ${user.tag}`)
      .setColor(0xff0000)
      .setThumbnail(user.displayAvatarURL({ dynamic: true }))
      .setDescription(caseDetails)
      .setFooter({ text: `Total Cases: ${userCases.length}` })
      .setTimestamp();

    message.reply({ embeds: [embed] });

    // Log case view action in the mod log channel
    const logChannel = message.guild.channels.cache.get(modLogChannelId);
    if (logChannel) {
      const logEmbed = new EmbedBuilder()
        .setTitle('🔍 Cases Viewed')
        .setColor(0x3498db)
        .setDescription(`${message.author.tag} viewed cases for **${user.tag}**.`)
        .setTimestamp();
      logChannel.send({ embeds: [logEmbed] });
    }
  }
};
