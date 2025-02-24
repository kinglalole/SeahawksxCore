const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { modRoles } = require('../../config/config.json');

const logsPath = path.join(__dirname, '../../data/moderationLogs.json');

module.exports = {
    name: 'cases',
    description: 'View a user’s moderation history.',
    async execute(message, args) {
        if (!message.member.roles.cache.some(role => modRoles.includes(role.id))) {
            return message.reply('❌ You do not have permission to use this command.');
        }

        const user = message.mentions.users.first();
        if (!user) return message.reply('⚠️ Please mention a user to view their cases.');

        if (!fs.existsSync(logsPath)) return message.reply('❌ No moderation logs found.');

        const logs = JSON.parse(fs.readFileSync(logsPath, 'utf8'));
        const userLogs = logs[user.id] || [];

        if (userLogs.length === 0) {
            return message.reply(`✅ **${user.tag}** has no moderation cases.`);
        }

        const caseList = userLogs.map((log, index) => 
            `**Case ${index + 1}:** ${log.action}\n📜 **Reason:** ${log.reason}\n👮 **Moderator:** ${log.moderator}\n📅 **Date:** ${new Date(log.date).toLocaleString()}\n`
        ).join('\n');

        const embed = new EmbedBuilder()
            .setTitle(`📂 Moderation History for ${user.tag}`)
            .setColor(0x3498db)
            .setDescription(caseList)
            .setTimestamp();

        message.channel.send({ embeds: [embed] });
    }
};
