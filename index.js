const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Import config from JSON file
const config = require('./config/config.json');
const prefix = config.PREFIX;

// Import addXP from utils/level.js
const { addXP } = require('./utils/level');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// Global error handler for unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Promise Rejection:', reason);
});

// Dynamically load commands from the "commands" folder recursively
const commands = new Map();

const loadCommands = (dir) => {
  fs.readdirSync(dir).forEach((file) => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      loadCommands(fullPath);
    } else if (file.endsWith('.js')) {
      try {
        const command = require(fullPath);
        if (command.name) {
          commands.set(command.name, command);
          console.log(`Loaded command: ${command.name}`);
        } else {
          console.warn(`Skipping invalid command file (missing name): ${file}`);
        }
      } catch (error) {
        console.error(`Failed to load command ${file}:`, error);
      }
    }
  });
};

loadCommands(path.join(__dirname, 'commands'));

client.once('ready', () => {
  console.log(`${client.user.tag} is online!`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  console.log(`📩 Message received: "${message.content}" from ${message.author.tag}`);

  // Award XP for every message (adjust XP as needed)
  addXP(message.author.id, 10);

  if (!message.content.startsWith(prefix)) return;
  const args = message.content.slice(prefix.length).trim().split(/\s+/);
  const commandName = args.shift().toLowerCase();

  if (!commands.has(commandName)) {
    console.log(`⚠️ Command "${commandName}" not found.`);
    return;
  }

  const command = commands.get(commandName);
  try {
    await command.execute(message, args);
    console.log(`✅ Executed command: ${commandName}`);
  } catch (error) {
    console.error(`❌ Error executing command "${commandName}":`, error);
    message.reply('An error occurred while executing this command.');
  }
});

client.login(process.env.TOKEN);
