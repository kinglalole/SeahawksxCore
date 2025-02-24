const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { modRoles } = require('../../config/config.json');

const logsPath = path.join(__dirname, '../../data/moderationLogs.json');

module.exports = {
    name: 'mute',
    aliases: ['timeout'], // Allows both ?mute and ?timeout to work
    description: 'Timeout (mute) a user for a specified duration.',
    async execute(message, args) {
        if (!message.member.roles.cache.some(role => modRoles.includes(role.id))) {
            return message.reply('❌ You do not have permission to use this command.');
        }

        const user = message.mentions.members.first();
        if (!user) return message.reply('⚠️ Please mention a user to timeout.');

        if (!args[1]) return message.reply('⚠️ Please specify a duration (e.g., `10m`, `1h`, `1d`).');

        // Convert duration argument to milliseconds
        const durationString = args[1];
        const durationMs = parseDuration(durationString);

        if (!durationMs) return message.reply('⚠️ Invalid duration format. Use `m` for minutes, `h` for hours, or `d` for days (e.g., `10m`, `2h`, `1d`).');

        if (!user.moderatable || user.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply('❌ I cannot timeout this user. They may have a higher role than me.');
        }

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
            .setDescription(`**${user.user.tag}** has been timed out.`)
            .addFields(
                { name: '👮 Moderator', value: message.author.tag, inline: true },
                { name: '📜 Reason', value: reason, inline: false },
                { name: '⏳ Duration', value: durationString, inline: true }
            )
            .setTimestamp();

        message.channel.send({ embeds: [embed] });
    }
};

// Helper function to convert duration string to milliseconds
function parseDuration(duration) {
    const match = duration.match(/^(\d+)(m|h|d)$/);
    if (!match) return null;

    const amount = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
        case 'm': return amount * 60 * 1000;  // Minutes
        case 'h': return amount * 60 * 60 * 1000; // Hours
        case 'd': return amount * 24 * 60 * 60 * 1000; // Days
        default: return null;
    }
}

