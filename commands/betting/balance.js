const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const moneyPath = path.join(__dirname, '../../data/money.json');
const betsPath = path.join(__dirname, '../../data/bets.json');

module.exports = {
    name: 'balance',
    description: 'Check your detailed virtual betting balance and stats.',
    async execute(message) {
        try {
            const user = message.author;

            // Ensure money.json and bets.json exist
            if (!fs.existsSync(moneyPath)) fs.writeFileSync(moneyPath, JSON.stringify({}, null, 2));
            if (!fs.existsSync(betsPath)) fs.writeFileSync(betsPath, JSON.stringify({}, null, 2));

            const moneyData = JSON.parse(fs.readFileSync(moneyPath, 'utf8'));
            const betsData = JSON.parse(fs.readFileSync(betsPath, 'utf8'));

            // If user doesn't exist, initialize them
            if (!moneyData[user.id]) {
                moneyData[user.id] = {
                    balance: 50,
                    peakBalance: 50,
                    favoriteTeam: 'N/A',
                    votes: 0,
                    totalPlaced: 0,
                    totalWon: 0
                };
            }

            const userStats = moneyData[user.id];

            // Ensure all necessary properties exist and default to 0 if missing
            userStats.balance = userStats.balance ?? 50;
            userStats.peakBalance = userStats.peakBalance ?? 50;
            userStats.totalPlaced = userStats.totalPlaced ?? 0;
            userStats.totalWon = userStats.totalWon ?? 0;
            userStats.votes = userStats.votes ?? 0;
            userStats.favoriteTeam = userStats.favoriteTeam ?? 'N/A';

            // Save the defaults in case anything was missing
            fs.writeFileSync(moneyPath, JSON.stringify(moneyData, null, 2));

            // Calculate betting stats
            const userBets = betsData[user.id] || [];
            const totalBets = userBets.length;
            const wonBets = userBets.filter(bet => bet.status === 'won').length;
            const lostBets = userBets.filter(bet => bet.status === 'lost').length;
            const parlayBets = userBets.filter(bet => bet.type === 'parlay');
            const wonParlays = parlayBets.filter(bet => bet.status === 'won').length;
            const lostParlays = parlayBets.filter(bet => bet.status === 'lost').length;

            const bettingRecord = totalBets > 0 ? `${wonBets}-${lostBets} (${((wonBets / totalBets) * 100).toFixed(1)}%)` : '0-0 (0%)';
            const parlayRecord = parlayBets.length > 0 ? `${wonParlays}-${lostParlays} (${((wonParlays / parlayBets.length) * 100).toFixed(1)}%)` : '0-0 (0%)';

            // Peak balance tracking
            if (userStats.balance > userStats.peakBalance) {
                userStats.peakBalance = userStats.balance;
                fs.writeFileSync(moneyPath, JSON.stringify(moneyData, null, 2));
            }

            const embed = new EmbedBuilder()
                .setTitle('💰 **Betting Balance & Stats**')
                .setColor(0x0099ff)
                .setDescription('⚠️ **Disclaimer:** FootballBot\'s simulated betting system does not involve real currency.')
                .addFields(
                    { name: '💰 **Current Balance**', value: `$${userStats.balance.toFixed(2)}`, inline: true },
                    { name: '⭐ **Favorite Team**', value: `${userStats.favoriteTeam} 🏈`, inline: true },
                    { name: '🎖️ **Votes**', value: `${userStats.votes}`, inline: true },
                    { name: '📊 **Betting Record**', value: `Bets: ${bettingRecord}\nParlays: ${parlayRecord}`, inline: false },
                    { name: '💵 **Total Returns**', value: `Placed: $${userStats.totalPlaced.toFixed(2)}\nWon: $${userStats.totalWon.toFixed(2)}`, inline: false },
                    { name: '📈 **Peak Balance**', value: `$${userStats.peakBalance.toFixed(2)}`, inline: true },
                    { name: '🏆 **Server Ranking**', value: `1/31`, inline: true }
                )
                .setFooter({ text: 'Get $5 by using ?daily' });

            message.reply({ embeds: [embed] });

        } catch (error) {
            console.error('❌ Error in balance command:', error);
            message.reply('⚠️ An unexpected error occurred while fetching your balance.');
        }
    }
};
