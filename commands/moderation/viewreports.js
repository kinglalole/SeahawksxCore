const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { modRoles, modLogChannelId } = require('../../config/config.json');

const reportsPath = path.join(__dirname, '../../data/reports.json');

module.exports = {
  name: 'viewreports',
  description: 'View the reports against a specific user.',
  async execute(message, args) {
    // Check if user has a mod role
    if (!message.member.roles.cache.some(role => modRoles.includes(role.id))) {
      return message.reply('❌ You do not have permission to use this command.');
    }

    const user = message.mentions.users.first();
    if (!user) return message.reply('⚠️ Please mention a user to view their reports.');

    if (!fs.existsSync(reportsPath)) {
      return message.reply('📂 No reports have been logged yet.');
    }

    const reportsData = JSON.parse(fs.readFileSync(reportsPath, 'utf8'));
    const userReports = reportsData[user.id] || [];

    if (userReports.length === 0) {
      return message.reply(`✅ No reports found for **${user.tag}**.`);
    }

    // Build report details
    const reportDetails = userReports
      .slice(-5) // Show last 5 reports (to prevent spam)
      .map((report, index) => 
        `**#${index + 1}**\n📅 **Date:** ${new Date(report.timestamp).toLocaleString()}\n👤 **Reporter:** ${report.reporter}\n📝 **Reason:** ${report.reason}`
      )
      .join('\n\n');

    // Create an embed response
    const embed = new EmbedBuilder()
      .setTitle(`📄 Reports for ${user.tag}`)
      .setColor(0xffcc00)
      .setThumbnail(user.displayAvatarURL({ dynamic: true }))
      .setDescription(reportDetails)
      .setFooter({ text: `Total Reports: ${userReports.length}` })
      .setTimestamp();

    message.reply({ embeds: [embed] });

    // Log report view action in the mod log channel
    const logChannel = message.guild.channels.cache.get(modLogChannelId);
    if (logChannel) {
      const logEmbed = new EmbedBuilder()
        .setTitle('📋 Reports Viewed')
        .setColor(0x3498db)
        .setDescription(`${message.author.tag} viewed reports for **${user.tag}**.`)
        .setTimestamp();
      logChannel.send({ embeds: [logEmbed] });
    }
  }
};
