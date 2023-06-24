const { consoleInfo } = require("../utils");

// TODO 暂时按照优先级直接覆盖 ==> .d.ts -> .ts -> .js
function combineComments(fileList) {
  const dts = fileList.find((file) => file.extension === "d.ts");
  const ts = fileList.find((file) => file.extension === "ts");
  const js = fileList.find((file) => file.extension === "js");
  return dts || ts || js;
}

module.exports = {
  combineComments,
};
