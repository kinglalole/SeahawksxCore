// /utils/modHistory.js

let moderationCases = {};

function addCase(userID, modCase) {
  if (!moderationCases[userID]) {
    moderationCases[userID] = [];
  }
  moderationCases[userID].push(modCase);
}

function getCases(userID) {
  return moderationCases[userID] || [];
}

module.exports = {
  addCase,
  getCases,
};
