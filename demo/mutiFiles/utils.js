const doctrine = require("doctrine");
const util = require("util");

const typeMap = {
  TSStringKeyword: "string",
  TSNumberKeyword: "number",
  TSBooleanKeyword: "boolean",
};

/**
 * 将 babel 的 type 转译回 ts type
 */
function resolveType(tsType) {
  const typeAnnotation = tsType.type;
  if (!typeAnnotation) {
    return;
  }
  return typeMap[typeAnnotation];
}

function parseComment(comment) {
  return doctrine.parse(comment, {
    unwrap: true,
  });
}

function consoleInfo(obj) {
  console.log(
    util.inspect(obj, { showHidden: false, depth: null, colors: true })
  );
}

module.exports = {
  resolveType,
  parseComment,
  consoleInfo,
};
