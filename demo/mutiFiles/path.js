const fs = require("fs");

function mkdirIfNotExist(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath);
    return false;
  }
  return true;
}

async function isDir(dirPath) {
  return new Promise((resolve, reject) => {
    fs.stat(dirPath, (err, stats) => {
      if (err) {
        resolve(false);
      }
      resolve(stats.isDirectory());
    });
  });
}

module.exports = {
  mkdirIfNotExist,
  isDir,
};
