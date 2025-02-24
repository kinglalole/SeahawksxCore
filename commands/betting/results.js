module.exports = {
    name: 'results',
    description: 'Fetch final game results and process bets.',
    async execute(message) {
        try {
            const url = `https://api.the-odds-api.com/v4/sports/americanfootball_nfl/scores/?apiKey=${apiKey}&daysFrom=2`;
            const response = await fetch(url);
            const data = await response.json();

            if (!data.length) return message.reply('⚠️ **No finalized NFL games available.**');

            const embed = new EmbedBuilder()
                .setTitle('🏆 **Final Game Results**')
                .setColor(0xff0000)
                .setDescription(
                    data.filter(game => game.completed)
                        .map(game => `🏈 **${game.home_team}** vs **${game.away_team}** → Winner: **${game.scores[0].score > game.scores[1].score ? game.home_team : game.away_team}**`)
                        .join('\n\n')
                );

            message.reply({ embeds: [embed] });

        } catch (error) {
            console.error('❌ Error fetching game results:', error);
            message.reply('⚠️ Failed to retrieve game results.');
        }
    }
};
