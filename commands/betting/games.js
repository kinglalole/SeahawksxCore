const { EmbedBuilder } = require('discord.js');
const fetch = require('node-fetch');
const { apiKey } = require('../../config/config.json');

module.exports = {
    name: 'games',
    description: 'Fetch live NFL games and betting odds.',
    async execute(message) {
        try {
            const url = `https://api.the-odds-api.com/v4/sports/americanfootball_nfl/odds/?apiKey=${apiKey}&regions=us&markets=h2h&oddsFormat=decimal`;
            const response = await fetch(url);
            const data = await response.json();

            if (!data.length) return message.reply('⚠️ **No upcoming NFL games available.**');

            const embed = new EmbedBuilder()
                .setTitle('🏈 **Live NFL Games & Betting Odds**')
                .setColor(0xff9900)
                .setDescription(
                    data.map(game => `**${game.home_team} vs ${game.away_team}**\n📅 ${new Date(game.commence_time).toDateString()}\n🔹 **Odds:** ${
                        game.bookmakers[0]?.markets[0]?.outcomes.map(o => `${o.name}: ${o.price}`).join(' | ')
                    }`).join('\n\n')
                )
                .setFooter({ text: 'Odds are subject to change before the game starts.' });

            message.reply({ embeds: [embed] });

        } catch (error) {
            console.error('❌ Error fetching games:', error);
            message.reply('⚠️ Failed to retrieve NFL betting odds.');
        }
    }
};
