const doctrine = require("doctrine");
const util = require("util");
const fs = require("fs-extra");
const path = require("path");

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
 * fork from https://github.com/silverwind/file-extension/blob/master/file-extension.js
 * @description 对 .d.ts 需做额外处理
 * @param {*} fileName
 */
function getFileExtension(fileName) {
  if (!fileName) return "";
  if (fileName.endsWith(".d.ts")) {
    return "d.ts";
  }
  var ext = (/[^./\\]*$/.exec(fileName) || [""])[0];
  return ext.toLowerCase();
}

/**
 * not include extension
 * @param {*} fileName
 */
function getFileName(fileName) {
  return fileName.replace("." + getFileExtension(fileName), "");
}

function isClassIgnore(leadingComments) {
  if (!(leadingComments && leadingComments[0].value)) {
    return false;
  }
  const comments = parseComment(leadingComments[0].value);
  return comments.tags.some((tag) => tag.title === "ignore");
}
function isClassSpecial(leadingComments) {
  if (!(leadingComments && leadingComments[0].value)) {
    return false;
  }
  const comments = parseComment(leadingComments[0].value);
  return comments.tags.some((tag) => tag.title === "special");
}

function resolveSuperClass() {}

module.exports = {
  resolveType,
  parseComment,
  consoleInfo,
  getFileExtension,
  getFileName,
  isClassIgnore,
  isClassSpecial,
};
