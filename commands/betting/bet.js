const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const { apiKey } = require('../../config/config.json');

const moneyPath = path.join(__dirname, '../../data/money.json');
const betsPath = path.join(__dirname, '../../data/bets.json');

module.exports = {
    name: 'bet',
    description: 'Place a bet on an NFL team using live odds.',
    async execute(message, args) {
        try {
            const user = message.author;
            const team = args[0]?.toUpperCase();
            const amount = parseFloat(args[1]);

            if (!team || isNaN(amount) || amount <= 0) {
                return message.reply('⚠️ **Usage:** `?bet <team> <amount>`');
            }

            if (!fs.existsSync(moneyPath)) fs.writeFileSync(moneyPath, JSON.stringify({}, null, 2));
            if (!fs.existsSync(betsPath)) fs.writeFileSync(betsPath, JSON.stringify({}, null, 2));

            const moneyData = JSON.parse(fs.readFileSync(moneyPath, 'utf8'));
            const betsData = JSON.parse(fs.readFileSync(betsPath, 'utf8'));

            if (!moneyData[user.id]) moneyData[user.id] = { balance: 50 };
            if (moneyData[user.id].balance < amount) {
                return message.reply(`❌ **Insufficient funds.** You have **$${moneyData[user.id].balance.toFixed(2)}**.`);
            }

            const url = `https://api.the-odds-api.com/v4/sports/americanfootball_nfl/odds/?apiKey=${apiKey}&regions=us&markets=h2h&oddsFormat=decimal`;
            const response = await fetch(url);
            const data = await response.json();

            const game = data.find(g => g.home_team === team || g.away_team === team);
            if (!game) return message.reply(`❌ **No upcoming games found for ${team}.**`);

            const odds = game.bookmakers[0]?.markets[0]?.outcomes.find(o => o.name === team)?.price || 1.5;
            const possiblePayout = (amount * parseFloat(odds)).toFixed(2);

            moneyData[user.id].balance -= amount;
            if (!betsData[user.id]) betsData[user.id] = [];
            betsData[user.id].push({
                team,
                amount,
                odds,
                payout: possiblePayout,
                status: 'pending',
                date: game.commence_time
            });

            fs.writeFileSync(moneyPath, JSON.stringify(moneyData, null, 2));
            fs.writeFileSync(betsPath, JSON.stringify(betsData, null, 2));

            const embed = new EmbedBuilder()
                .setTitle('✅ **Bet Placed**')
                .setColor(0x00ff00)
                .setDescription(`Your balance in this server is now **$${moneyData[user.id].balance.toFixed(2)}.**`)
                .addFields(
                    { name: '🏈 **Bet**', value: `${team} to WIN`, inline: false },
                    { name: '📅 **Game Date**', value: new Date(game.commence_time).toDateString(), inline: false },
                    { name: '💰 **Amount Placed**', value: `$${amount.toFixed(2)}`, inline: true },
                    { name: '💸 **Possible Payout**', value: `$${possiblePayout}`, inline: true }
                )
                .setFooter({ text: "⚠️ FootballBot's simulated betting system does not involve any real currency." });

            const cancelButton = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`cancel_bet_${user.id}`)
                    .setLabel('Cancel Bet')
                    .setStyle(ButtonStyle.Danger)
            );

            const betMessage = await message.reply({ embeds: [embed], components: [cancelButton] });

            const filter = (interaction) => interaction.customId === `cancel_bet_${user.id}` && interaction.user.id === user.id;
            const collector = betMessage.createMessageComponentCollector({ filter, time: 120000 });

            collector.on('collect', async (interaction) => {
                betsData[user.id].pop();
                moneyData[user.id].balance += amount;
                fs.writeFileSync(moneyPath, JSON.stringify(moneyData, null, 2));
                fs.writeFileSync(betsPath, JSON.stringify(betsData, null, 2));

                await interaction.update({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('❌ **Bet Canceled**')
                            .setColor(0xff0000)
                            .setDescription(`Your bet on **${team}** has been **canceled**, and **$${amount.toFixed(2)}** has been refunded.`)
                            .addFields({ name: '💰 **Updated Balance**', value: `$${moneyData[user.id].balance.toFixed(2)}`, inline: true })
                            .setFooter({ text: "⚠️ FootballBot's simulated betting system does not involve any real currency." })
                    ],
                    components: []
                });

                collector.stop();
            });

            collector.on('end', async () => {
                if (betMessage.editable) {
                    await betMessage.edit({ components: [] });
                }
            });

        } catch (error) {
            console.error('❌ Error placing bet:', error);
            message.reply('⚠️ An unexpected error occurred while placing your bet.');
        }
    }
};
