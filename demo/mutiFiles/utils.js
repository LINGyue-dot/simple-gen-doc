const doctrine = require("doctrine");
const util = require("util");
const fs = require("fs-extra");

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

/**
 * 将 绝对路径为名称的对象转换为类树结构
 * @example
 * {
 *  '/Users/qianlong/Desktop/code/simple-gen-doc/demo/mutiFiles/example/father.ts:{xxx} ,
 *  '
 * }
 */
function resolvePathTree(basePath, res) {}

/**
 * fork from https://github.com/silverwind/file-extension/blob/master/file-extension.js
 * @description 对 .d.ts 需做额外处理
 * @param {*} fileName
 */
function getFileExtension(fileName) {
  if (!fileName) return "";
  if (fileName.endsWith(".d.ts")) {
    return ".d.ts";
  }
  var ext = (/[^./\\]*$/.exec(fileName) || [""])[0];
  return ext.toLowerCase();
}



module.exports = {
  resolveType,
  parseComment,
  consoleInfo,
  getFileExtension,
};
