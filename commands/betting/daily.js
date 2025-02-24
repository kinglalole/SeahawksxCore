const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const moneyPath = path.join(__dirname, '../../data/money.json');
const dailyClaimsPath = path.join(__dirname, '../../data/dailyClaims.json');

module.exports = {
    name: 'daily',
    description: 'Claim your daily reward of $5. Can only be claimed once every 12 hours.',
    async execute(message) {
        const user = message.author;
        const currentTime = Date.now();
        const cooldownTime = 12 * 60 * 60 * 1000; // 12 hours in milliseconds

        if (!fs.existsSync(moneyPath)) {
            fs.writeFileSync(moneyPath, JSON.stringify({}, null, 2));
        }

        if (!fs.existsSync(dailyClaimsPath)) {
            fs.writeFileSync(dailyClaimsPath, JSON.stringify({}, null, 2));
        }

        const moneyData = JSON.parse(fs.readFileSync(moneyPath, 'utf8'));
        const dailyClaims = JSON.parse(fs.readFileSync(dailyClaimsPath, 'utf8'));

        if (!moneyData[user.id]) {
            moneyData[user.id] = { balance: 50 }; // Default user balance
        }

        if (dailyClaims[user.id] && currentTime - dailyClaims[user.id] < cooldownTime) {
            const remainingTime = cooldownTime - (currentTime - dailyClaims[user.id]);
            const hours = Math.floor(remainingTime / (60 * 60 * 1000));
            const minutes = Math.floor((remainingTime % (60 * 60 * 1000)) / (60 * 1000));

            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('⏳ Daily Reward Cooldown')
                        .setColor(0xffcc00)
                        .setDescription(`You have already claimed your daily reward! You can claim it again in **${hours} hours and ${minutes} minutes.**`)
                        .setFooter({ text: 'Check back later for more rewards!' })
                ]
            });
        }

        moneyData[user.id].balance += 15;
        dailyClaims[user.id] = currentTime;

        fs.writeFileSync(moneyPath, JSON.stringify(moneyData, null, 2));
        fs.writeFileSync(dailyClaimsPath, JSON.stringify(dailyClaims, null, 2));

        message.reply({
            embeds: [
                new EmbedBuilder()
                    .setTitle('🎉 Daily Reward Claimed!')
                    .setColor(0x00ff00)
                    .setDescription(`✅ **You received $15!** Come back in **12 hours** for your next reward.`)
                    .addFields(
                        { name: '💰 New Balance', value: `$${moneyData[user.id].balance}`, inline: true }
                    )
                    .setFooter({ text: 'Keep coming back for more rewards!' })
            ]
        });
    }
};
