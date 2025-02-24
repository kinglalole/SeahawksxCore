const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Create a new client instance with necessary intents
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// Load bot token from .env
const TOKEN = process.env.TOKEN;

// Initialize command collection
client.commands = new Collection();

// Function to load commands dynamically
const loadCommands = (dir) => {
    const files = fs.readdirSync(dir);
    files.forEach((file) => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            loadCommands(fullPath); // Recursively load subdirectories
        } else if (file.endsWith('.js')) {
            try {
                const command = require(fullPath);
                if (command.name) {
                    client.commands.set(command.name, command);
                    console.log(`✅ Loaded command: ${command.name}`);
                } else {
                    console.warn(`⚠️ Skipping invalid command file: ${file} (missing name)`);
                }
            } catch (error) {
                console.error(`❌ Failed to load command ${file}:`, error);
            }
        }
    });
};

// Load all commands from the "commands" directory
loadCommands(path.join(__dirname, 'commands'));

// Handle unhandled promise rejections globally
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Promise Rejection:', reason);
});

// Handle client ready event
client.once('ready', () => {
    console.log(`✅ ${client.user.tag} is online and ready!`);
});

// Command handler
client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return; // Ignore bot messages and DMs

    const prefix = '?';
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/\s+/);
    const commandName = args.shift().toLowerCase();

    if (!client.commands.has(commandName)) {
        console.log(`⚠️ Command "${commandName}" not found.`);
        return;
    }

    const command = client.commands.get(commandName);

    try {
        await command.execute(message, args);
        console.log(`✅ Executed command: ${commandName}`);
    } catch (error) {
        console.error(`❌ Error executing command "${commandName}":`, error);
        message.reply({
            content: '⚠️ An error occurred while executing this command. Please try again later.',
            ephemeral: true  // Prevents repeated error messages
        });
    }
});

// Log the bot in with the token
client.login(TOKEN);

