const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const logsPath = path.join(__dirname, '../../data/moderationLogs.json');

module.exports = {
    name: 'warn',
    description: 'Warn a user',
    async execute(message, args) {
        try {
            if (!message.member.permissions.has('KICK_MEMBERS')) {
                return message.reply('❌ You do not have permission to warn members.');
            }

            const user = message.mentions.users.first();
            if (!user) return message.reply('⚠️ Please mention a user to warn.');

            const reason = args.slice(1).join(' ') || 'No reason provided.';

            // Check if the file exists, create it if not
            if (!fs.existsSync(logsPath)) {
                fs.writeFileSync(logsPath, JSON.stringify({}, null, 2));
            }

            const logs = JSON.parse(fs.readFileSync(logsPath, 'utf8'));
            if (!logs[user.id]) logs[user.id] = [];
            logs[user.id].push({ moderator: message.author.tag, reason, date: new Date().toISOString() });

            fs.writeFileSync(logsPath, JSON.stringify(logs, null, 2));

            const embed = new EmbedBuilder()
                .setTitle('⚠️ User Warned')
                .setColor(0xffcc00)
                .setDescription(`**${user.tag}** has been warned.`)
                .addFields(
                    { name: '👮 Moderator', value: message.author.tag, inline: true },
                    { name: '📜 Reason', value: reason, inline: false }
                )
                .setTimestamp();

            message.channel.send({ embeds: [embed] });

        } catch (error) {
            console.error('❌ Error in warn command:', error);
            message.reply('⚠️ Failed to warn the user due to an error.');
        }
    }
};
