const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const reportsPath = path.join(__dirname, '../../data/reports.json');

module.exports = {
  name: 'report',
  description: 'Report a user for breaking server rules.',
  async execute(message, args) {
    const user = message.mentions.users.first();
    if (!user) return message.reply('⚠️ Please mention a user to report.');

    const reason = args.slice(1).join(' ') || 'No reason provided.';
    
    // Log the report
    const reportEntry = {
      reporter: message.author.tag,
      reportedUser: user.tag,
      reason,
      timestamp: new Date().toISOString()
    };

    let reports = {};
    if (fs.existsSync(reportsPath)) {
      reports = JSON.parse(fs.readFileSync(reportsPath, 'utf8'));
    }

    if (!reports[user.id]) reports[user.id] = [];
    reports[user.id].push(reportEntry);
    fs.writeFileSync(reportsPath, JSON.stringify(reports, null, 2));

    // Send report confirmation
    const reportEmbed = new EmbedBuilder()
      .setTitle('🚨 User Reported')
      .setColor(0xff0000)
      .setDescription(`A report has been filed against **${user.tag}**.`)
      .addFields(
        { name: 'Reporter', value: message.author.tag, inline: true },
        { name: 'Reported User', value: user.tag, inline: true },
        { name: 'Reason', value: reason },
        { name: 'Date', value: new Date().toLocaleString() }
      )
      .setFooter({ text: 'Seahawk Server Reports' })
      .setTimestamp();

    message.reply({ embeds: [reportEmbed] });

    // Send report to reports channel
    const reportsChannelId = '1343187810303086685'; // Replace with actual channel ID
    const reportsChannel = message.guild.channels.cache.get(reportsChannelId);

    if (reportsChannel) {
      reportsChannel.send({ embeds: [reportEmbed] });
    }
  },
};




// 1343187810303086685
