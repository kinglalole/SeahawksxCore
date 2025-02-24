const fs = require('fs');
const path = require('path');

// Path to xpData.json (located in the root directory)
const XP_FILE_PATH = path.join(__dirname, '../xpData.json');

// In-memory storage for user XP and levels
const userXP = {};

// Load XP data from xpData.json if it exists
function loadUserXP() {
  if (fs.existsSync(XP_FILE_PATH)) {
    const data = fs.readFileSync(XP_FILE_PATH, 'utf-8');
    return JSON.parse(data);
  }
  return {};
}

// Save XP data to xpData.json
function saveUserXP() {
  fs.writeFileSync(XP_FILE_PATH, JSON.stringify(userXP, null, 2));
}

// Initialize userXP with saved data
function initializeUserXP() {
  const savedData = loadUserXP();
  Object.assign(userXP, savedData);
}

initializeUserXP();

// Function to get a user's rank based on their level
function getRank(userID) {
  const level = userXP[userID]?.level || 1;
  if (level >= 50) return 'Greatest of All Time';
  if (level >= 40) return 'Hall of Famer';
  if (level >= 31) return 'MVP';
  if (level >= 20) return 'Veteran';
  if (level >= 15) return 'All-Pro';
  if (level >= 10) return 'Sophomore Superstar';
  if (level >= 5) return 'Rookie of the Year';
  return 'Practice Squad';
}

// Function to add XP to a user and level them up if necessary
function addXP(userID, xpToAdd) {
  if (!userXP[userID]) {
    userXP[userID] = { xp: 0, level: 1 };
  }

  userXP[userID].xp += xpToAdd;

  // Level up logic: Each level requires current level * 1000 XP
  while (userXP[userID].xp >= userXP[userID].level * 1000) {
    userXP[userID].xp -= userXP[userID].level * 1000;
    userXP[userID].level++;
  }

  saveUserXP();
}

module.exports = {
  userXP,
  getRank,
  addXP,
};
