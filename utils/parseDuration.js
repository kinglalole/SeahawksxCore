module.exports = {
  parseDuration: (duration) => {
    const match = duration.match(/(\d+)([smhd])/);
    if (!match) return null;
    const time = parseInt(match[1]);
    const unit = match[2];
    const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
    return time * multipliers[unit];
  }
};
