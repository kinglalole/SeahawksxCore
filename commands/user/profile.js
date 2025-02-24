const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const { userXP, getRank } = require('../../utils/level');
const fs = require('fs');
const path = require('path');
const moment = require('moment');

const logsPath = path.join(__dirname, '../../data/moderationLogs.json');
const reportsPath = path.join(__dirname, '../../data/reports.json');

module.exports = {
  name: 'profile',
  description: 'View a user’s profile with XP, level, rank, warnings, roles, and more',
  async execute(message, args) {
    // Get mentioned user or default to command sender
    const user = message.mentions.users.first() || message.author;
    const member = message.guild.members.cache.get(user.id);

    // **🔗 User Information**
    const userID = user.id;
    const creationDate = moment(user.createdAt).format('MMMM Do YYYY');
    const avatarURL = user.displayAvatarURL({ dynamic: true, size: 1024 });

    // **📊 XP & Rank**
    const xpData = userXP[user.id] || { xp: 0, level: 1 };
    const { xp, level } = xpData;
    const rank = getRank(user.id) || 'Unranked';
    const xpNeeded = level * 1000;
    const progress = Math.min(Math.floor((xp / xpNeeded) * 10), 10);
    const progressBar = '█'.repeat(progress) + '░'.repeat(10 - progress);

    // **⚠️ Moderation History**
    let warnings = 0;
    if (fs.existsSync(logsPath)) {
      const logs = JSON.parse(fs.readFileSync(logsPath, 'utf8'));
      warnings = logs[user.id]?.filter(entry => entry.action === 'Warn').length || 0;
    }

    let reports = 0;
    if (fs.existsSync(reportsPath)) {
      const reportsData = JSON.parse(fs.readFileSync(reportsPath, 'utf8'));
      reports = reportsData[user.id]?.length || 0;
    }

    // **📜 Server Information**
    const joinDate = member?.joinedAt
      ? moment(member.joinedAt).format('MMMM Do YYYY')
      : 'Unknown';

    // Get roles (limit to 10 for cleaner display)
    const roles = member?.roles.cache
      .filter(role => role.id !== message.guild.id) // Exclude @everyone
      .map(role => role.name)
      .slice(0, 10)
      .join(', ') || 'No roles';

    // Get key server permissions (Checks for Admin, Manage Server, etc.)
    const permissions = member?.permissions.toArray().filter(perm => [
      'Administrator', 'ManageGuild', 'KickMembers', 'BanMembers', 'ManageMessages'
    ].includes(perm)).map(perm => `• ${perm.replace(/([A-Z])/g, ' $1')}`).join('\n') || 'No special permissions';

    // **Embed Profile**
    const embed = new EmbedBuilder()
      .setTitle(`${user.username}'s Profile`)
      .setColor(0x00FF00)
      .setThumbnail(avatarURL)
      .addFields(
        { name: '🔗 User Information', value: `**User ID:** ${userID}\n**Created:** ${creationDate}`, inline: false },
        { name: '📊 XP & Rank', value: `**Level:** ${level}\n**XP:** ${xp} / ${xpNeeded}\n**Rank:** ${rank}\n\`${progressBar}\``, inline: false },
        { name: '⚠️ Moderation History', value: `**Warnings:** ${warnings}\n**Reports:** ${reports}`, inline: false },
        { name: '📜 Server Information', value: `**Joined Server:** ${joinDate}\n**Roles:** ${roles}\n\n**Permissions:**\n${permissions}`, inline: false }
      )
      .setFooter({ text: 'Server Profile' })
      .setTimestamp();

    message.reply({ embeds: [embed] });
  }
};
