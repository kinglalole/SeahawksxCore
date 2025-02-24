const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { modRoles } = require('../../config/config.json');

const logsPath = path.join(__dirname, '../../data/moderationLogs.json');

module.exports = {
    name: 'kick',
    description: 'Kick a user from the server.',
    async execute(message, args) {
        if (!message.member.roles.cache.some(role => modRoles.includes(role.id))) {
            return message.reply('❌ You do not have permission to use this command.');
        }

        const user = message.mentions.members.first();
        if (!user) return message.reply('⚠️ Please mention a user to kick.');

        const reason = args.slice(1).join(' ') || 'No reason provided.';
        if (!fs.existsSync(logsPath)) fs.writeFileSync(logsPath, JSON.stringify({}, null, 2));

        const logs = JSON.parse(fs.readFileSync(logsPath, 'utf8'));
        if (!logs[user.id]) logs[user.id] = [];
        logs[user.id].push({ moderator: message.author.tag, action: 'Kick', reason, date: new Date().toISOString() });

        fs.writeFileSync(logsPath, JSON.stringify(logs, null, 2));

        await user.kick(reason);

        const embed = new EmbedBuilder()
            .setTitle('👢 User Kicked')
            .setColor(0xffa500)
            .setDescription(`**${user.user.tag}** has been kicked.`)
            .addFields(
                { name: '👮 Moderator', value: message.author.tag, inline: true },
                { name: '📜 Reason', value: reason, inline: false }
            )
            .setTimestamp();

        message.channel.send({ embeds: [embed] });
    }
};
