const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { modRoles, modLogChannelId } = require('../../config/config.json');

const logsPath = path.join(__dirname, '../../data/moderationLogs.json');

module.exports = {
    name: 'mute',
    aliases: ['timeout'],
    description: 'Timeout (mute) a user for a specified duration and log the action.',
    async execute(message, args) {
        if (!message.member.roles.cache.some(role => modRoles.includes(role.id))) {
            return message.reply('❌ You do not have permission to use this command.');
        }

        const user = message.mentions.members.first();
        if (!user) return message.reply('⚠️ Please mention a user to timeout.');

        if (!args[1]) return message.reply('⚠️ Please specify a duration (e.g., `10m`, `1h`, `1d`).');

        const durationString = args[1];
        const durationMs = parseDuration(durationString);

        if (!durationMs) return message.reply('⚠️ Invalid duration format. Use `m` for minutes, `h` for hours, or `d` for days (e.g., `10m`, `2h`, `1d`).');

        const reason = args.slice(2).join(' ') || 'No reason provided.';
        if (!fs.existsSync(logsPath)) fs.writeFileSync(logsPath, JSON.stringify({}, null, 2));

        const logs = JSON.parse(fs.readFileSync(logsPath, 'utf8'));
        if (!logs[user.id]) logs[user.id] = [];
        logs[user.id].push({ moderator: message.author.tag, action: 'Timeout', duration: durationString, reason, date: new Date().toISOString() });

        fs.writeFileSync(logsPath, JSON.stringify(logs, null, 2));

        await user.timeout(durationMs, reason);

        const embed = new EmbedBuilder()
            .setTitle('⏳ User Timed Out')
            .setColor(0xffa500)
            .setThumbnail(user.user.displayAvatarURL())
            .addFields(
                { name: 'User', value: `${user.user.tag} (ID: ${user.id})`, inline: true },
                { name: 'Moderator', value: `${message.author.tag} (ID: ${message.author.id})`, inline: true },
                { name: 'Reason', value: reason, inline: false },
                { name: '⏳ Duration', value: durationString, inline: true }
            )
            .setTimestamp();

        message.channel.send({ embeds: [embed] });

        const logChannel = message.guild.channels.cache.get(modLogChannelId);
        if (logChannel) logChannel.send({ embeds: [embed] });
    }
};

function parseDuration(duration) {
    const match = duration.match(/^(\d+)(m|h|d)$/);
    if (!match) return null;

    const amount = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
        case 'm': return amount * 60 * 1000;
        case 'h': return amount * 60 * 60 * 1000;
        case 'd': return amount * 24 * 60 * 60 * 1000;
        default: return null;
    }
}


