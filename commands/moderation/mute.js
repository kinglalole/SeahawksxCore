const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const { modRoles, modLogChannelId } = require('../../config/config.json');

module.exports = {
  name: 'mute',
  description: 'Mute a user in the server.',
  async execute(message, args) {
    if (!message.member.roles.cache.some(role => modRoles.includes(role.id))) {
      return message.reply('❌ You do not have permission to use this command.');
    }

    const user = message.mentions.members.first();
    if (!user) return message.reply('⚠️ Please mention a user to mute.');

    const muteRole = message.guild.roles.cache.find(role => role.name === 'Muted');
    if (!muteRole) return message.reply('⚠️ No "Muted" role found. Please create one.');

    await user.roles.add(muteRole);

    const embed = new EmbedBuilder()
      .setTitle('🔇 User Muted')
      .setColor(0x808080)
      .setDescription(`**${user.user.tag}** has been muted.`)
      .addFields({ name: 'Moderator', value: message.author.tag })
      .setTimestamp();

    const logChannel = message.guild.channels.cache.get(modLogChannelId);
    if (logChannel) logChannel.send({ embeds: [embed] });

    message.reply({ embeds: [embed] });

    // Log the mute
    const logsPath = '../../data/moderationLogs.json';
    const logs = fs.existsSync(logsPath) ? JSON.parse(fs.readFileSync(logsPath, 'utf8')) : {};
    if (!logs[user.id]) logs[user.id] = [];
    logs[user.id].push({ action: 'Mute', moderator: message.author.tag, timestamp: new Date().toISOString() });
    fs.writeFileSync(logsPath, JSON.stringify(logs, null, 2));
  }
};
