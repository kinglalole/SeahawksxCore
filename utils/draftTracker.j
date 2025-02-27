const { EmbedBuilder } = require('discord.js');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { announcementsChannelId } = require('../../config/config.json');

const dataPath = path.join(__dirname, '../../data/draftPicks.json');

module.exports = {
    name: 'drafttracker',
    description: 'Fetch Seahawks draft picks and post updates.',
    async execute(client) {
        console.log('📢 Checking for new draft picks...');

        try {
            const response = await axios.get('https://www.seahawks.com/draft/');
            const html = response.data;

            // Extract draft picks using regex (or use a parsing library if needed)
            const picks = extractDraftPicks(html); // Custom function to process data

            if (!fs.existsSync(dataPath)) fs.writeFileSync(dataPath, JSON.stringify([], null, 2));
            const postedPicks = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

            const newPicks = picks.filter(pick => !postedPicks.includes(pick.pickNumber));

            if (newPicks.length === 0) {
                console.log('✅ No new draft picks found.');
                return;
            }

            const channel = client.channels.cache.get(announcementsChannelId);
            if (!channel) {
                console.error('❌ Announcements channel not found. Check your config.');
                return;
            }

            for (const pick of newPicks) {
                const embed = new EmbedBuilder()
                    .setTitle(`🏈 Seahawks Draft Pick #${pick.pickNumber}`)
                    .setColor(0x00ff00)
                    .setThumbnail(pick.playerImage || '')
                    .addFields(
                        { name: 'Player', value: pick.playerName, inline: true },
                        { name: 'Position', value: pick.position, inline: true },
                        { name: 'College', value: pick.college, inline: true },
                        { name: 'Round', value: `Round ${pick.round}`, inline: true }
                    )
                    .setTimestamp()
                    .setFooter({ text: 'Seahawks Draft Tracker', iconURL: 'https://upload.wikimedia.org/wikipedia/en/thumb/2/2c/Seattle_Seahawks_logo.svg/1200px-Seattle_Seahawks_logo.svg.png' });

                await channel.send({ embeds: [embed] });

                postedPicks.push(pick.pickNumber);
            }

            fs.writeFileSync(dataPath, JSON.stringify(postedPicks, null, 2));
            console.log(`✅ Posted ${newPicks.length} new draft picks.`);
        } catch (error) {
            console.error('❌ Error fetching Seahawks draft data:', error);
        }
    }
};

// Custom function to extract picks from HTML (Modify based on structure)
function extractDraftPicks(html) {
    // Parse HTML and extract player data
    // Use regex or a library like cheerio to scrape draft picks
    return [
        {
            pickNumber: 20,
            playerName: 'John Doe',
            position: 'Quarterback',
            college: 'Washington State',
            round: 1,
            playerImage: 'https://example.com/player-image.jpg'
        }
    ];
}
