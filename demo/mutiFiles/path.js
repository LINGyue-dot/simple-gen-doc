const fs = require("fs");

function mkdirIfNotExist(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath);
    return false;
  }
  return true;
}

module.exports = {
  mkdirIfNotExist,
};
