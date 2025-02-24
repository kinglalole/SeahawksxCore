const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { modRoles } = require('../../config/config.json');

const moneyPath = path.join(__dirname, '../../data/money.json');

module.exports = {
    name: 'givecurrency',
    description: 'Admin command to add virtual currency to a user.',
    async execute(message, args) {
        if (!message.member.roles.cache.some(role => modRoles.includes(role.id))) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('❌ Permission Denied')
                        .setColor(0xff0000)
                        .setDescription('You do not have permission to use this command.')
                        .setFooter({ text: 'Only designated admins/moderators can use this command.' })
                ]
            });
        }

        const user = message.mentions.members.first();
        const amount = parseInt(args[1]);

        if (!user || isNaN(amount) || amount <= 0) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('⚠️ Invalid Command Usage')
                        .setColor(0xffcc00)
                        .setDescription('Please provide a valid user mention and a positive amount.')
                        .addFields(
                            { name: 'Usage', value: '`?givecurrency <@user> <amount>`' },
                            { name: 'Example', value: '`?givecurrency @User 500`' }
                        )
                        .setFooter({ text: 'Make sure to use a valid user and number.' })
                ]
            });
        }

        if (!fs.existsSync(moneyPath)) {
            fs.writeFileSync(moneyPath, JSON.stringify({}, null, 2));
        }

        const moneyData = JSON.parse(fs.readFileSync(moneyPath, 'utf8'));
        if (!moneyData[user.id]) moneyData[user.id] = { balance: 1000 };

        moneyData[user.id].balance += amount;
        fs.writeFileSync(moneyPath, JSON.stringify(moneyData, null, 2));

        const embed = new EmbedBuilder()
            .setTitle('✅ Currency Granted')
            .setColor(0x00ff00)
            .setDescription(`Successfully added **${amount} coins** to **${user.user.tag}**.`)
            .addFields(
                { name: '👤 Recipient', value: `<@${user.id}>`, inline: true },
                { name: '💰 New Balance', value: `${moneyData[user.id].balance} coins`, inline: true },
                { name: '🛠 Given By', value: `${message.author.tag}`, inline: false }
            )
            .setFooter({ text: 'Use ?balance to check your current coin balance!' });

        message.reply({ embeds: [embed] });
    }
};
