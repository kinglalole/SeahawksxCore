const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const { modRoles, modLogChannelId } = require('../../config/config.json');

module.exports = {
  name: 'ban',
  description: 'Ban a user from the server.',
  async execute(message, args) {
    // Check if the user has a moderator role
    if (!message.member.roles.cache.some(role => modRoles.includes(role.id))) {
      return message.reply('❌ You do not have permission to use this command.');
    }

    const user = message.mentions.members.first();
    if (!user) return message.reply('⚠️ Please mention a user to ban.');
    if (!user.bannable) return message.reply('❌ I cannot ban this user.');

    const reason = args.slice(1).join(' ') || 'No reason provided.';
    await user.ban({ reason });

    const embed = new EmbedBuilder()
      .setTitle('🔨 User Banned')
      .setColor(0xff0000)
      .setDescription(`**${user.user.tag}** has been banned.`)
      .addFields(
        { name: 'Moderator', value: message.author.tag },
        { name: 'Reason', value: reason }
      )
      .setTimestamp();

    const logChannel = message.guild.channels.cache.get(modLogChannelId);
    if (logChannel) logChannel.send({ embeds: [embed] });

    message.reply({ embeds: [embed] });

    // Log the ban in moderationLogs.json
    const logsPath = '../../data/moderationLogs.json';
    const logs = fs.existsSync(logsPath) ? JSON.parse(fs.readFileSync(logsPath, 'utf8')) : {};
    if (!logs[user.id]) logs[user.id] = [];
    logs[user.id].push({ action: 'Ban', moderator: message.author.tag, reason, timestamp: new Date().toISOString() });
    fs.writeFileSync(logsPath, JSON.stringify(logs, null, 2));
  }
};
