const { EmbedBuilder } = require('discord.js');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const { apiKey } = require('../../config/config.json');

const moneyPath = path.join(__dirname, '../../data/money.json');
const betsPath = path.join(__dirname, '../../data/bets.json');

module.exports = {
    name: 'payouts',
    description: 'Process bet results based on real game outcomes.',
    async execute(message) {
        try {
            if (!fs.existsSync(betsPath) || !fs.existsSync(moneyPath)) {
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('⚠️ No Bets or Balances Found')
                            .setColor(0xffcc00)
                            .setDescription('There are no active bets or balance records found. Place a bet using `?bet` before using payouts.')
                    ]
                });
            }

            const betsData = JSON.parse(fs.readFileSync(betsPath, 'utf8'));
            const moneyData = JSON.parse(fs.readFileSync(moneyPath, 'utf8'));

            const url = `https://api.the-odds-api.com/v4/sports/americanfootball_nfl/scores/?apiKey=${apiKey}&daysFrom=2`;

            const response = await fetch(url);
            if (!response.ok) throw new Error(`API request failed with status ${response.status}`);

            const gameResults = await response.json();
            if (!gameResults.length) {
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('⚠️ No Finalized Games Available')
                            .setColor(0xffcc00)
                            .setDescription('There are no completed games available for processing bets.')
                    ]
                });
            }

            let payoutsMessage = '';
            let processedBets = 0;

            for (const userId in betsData) {
                const userBets = betsData[userId];

                if (!moneyData[userId]) {
                    moneyData[userId] = { balance: 50 };
                }

                userBets.forEach((bet) => {
                    if (bet.status === 'pending') {
                        const game = gameResults.find(
                            (g) => g.completed && (g.home_team === bet.team || g.away_team === bet.team)
                        );

                        if (!game) {
                            payoutsMessage += `⚠️ <@${userId}> Bet on **${bet.team}** - No game found.\n`;
                            return;
                        }

                        const winningTeam = game.scores[0].score > game.scores[1].score ? game.home_team : game.away_team;

                        if (bet.team === winningTeam) {
                            const winnings = parseFloat(bet.payout);
                            moneyData[userId].balance += winnings;
                            bet.status = 'won';
                            payoutsMessage += `🏆 <@${userId}> **won** $${winnings.toFixed(2)} betting on **${winningTeam}**!\n`;
                        } else {
                            bet.status = 'lost';
                            payoutsMessage += `❌ <@${userId}> **lost** their bet on **${bet.team}**.\n`;
                        }
                        processedBets++;
                    }
                });
            }

            if (processedBets === 0) {
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('⚠️ No Pending Bets')
                            .setColor(0xffcc00)
                            .setDescription('There are no pending bets to process.')
                    ]
                });
            }

            // Save updated bets and balances
            fs.writeFileSync(moneyPath, JSON.stringify(moneyData, null, 2));
            fs.writeFileSync(betsPath, JSON.stringify(betsData, null, 2));

            message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('💰 Payouts Processed')
                        .setColor(0x00ff00)
                        .setDescription(payoutsMessage || '✅ No winnings this round.')
                ]
            });

        } catch (error) {
            console.error('❌ Error processing payouts:', error);
            message.reply('⚠️ An unexpected error occurred while processing bet payouts.');
        }
    }
};
