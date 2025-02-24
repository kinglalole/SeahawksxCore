const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { modRoles, modLogChannelId } = require('../../config/config.json');

const logsPath = path.join(__dirname, '../../data/moderationLogs.json');

module.exports = {
    name: 'warn',
    description: 'Warn a user and log the action.',
    async execute(message, args) {
        if (!message.member.roles.cache.some(role => modRoles.includes(role.id))) {
            return message.reply('❌ You do not have permission to use this command.');
        }

        const user = message.mentions.users.first();
        if (!user) return message.reply('⚠️ Please mention a user to warn.');

        const reason = args.slice(1).join(' ') || 'No reason provided.';
        if (!fs.existsSync(logsPath)) fs.writeFileSync(logsPath, JSON.stringify({}, null, 2));

        const logs = JSON.parse(fs.readFileSync(logsPath, 'utf8'));
        if (!logs[user.id]) logs[user.id] = [];
        logs[user.id].push({ moderator: message.author.tag, action: 'Warn', reason, date: new Date().toISOString() });

        fs.writeFileSync(logsPath, JSON.stringify(logs, null, 2));

        const embed = new EmbedBuilder()
            .setTitle('⚠️ User Warned')
            .setColor(0xffcc00)
            .setThumbnail(user.displayAvatarURL())
            .addFields(
                { name: 'User', value: `${user.tag} (ID: ${user.id})`, inline: true },
                { name: 'Moderator', value: `${message.author.tag} (ID: ${message.author.id})`, inline: true },
                { name: 'Reason', value: reason, inline: false }
            )
            .setTimestamp();

        message.channel.send({ embeds: [embed] });

        const logChannel = message.guild.channels.cache.get(modLogChannelId);
        if (logChannel) logChannel.send({ embeds: [embed] });
    }
};
