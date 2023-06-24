const path = require("path");
const SupportExtensions = [".d.ts", ".ts", ".js"];

const dir = "../example";
const dirPath = path.resolve(__dirname, dir);

const externalDir = "../_external";
const externalDirPath = path.resolve(__dirname, externalDir);

const docDirName = "doc";
const docDir = path.resolve("../vitepress", docDirName);
const absoluteDocDir = path.resolve(__dirname, docDir);
const otherDocPath = path.resolve(absoluteDocDir, "other");
const specialDocPath = path.resolve(absoluteDocDir, "special");
const externalDocPath = path.resolve(absoluteDocDir, "external");
const DocExtension = "md";
module.exports = {
  SupportExtensions,
  dirPath,
  externalDirPath,
  absoluteDocDir,
  otherDocPath,
  specialDocPath,
  externalDocPath,
  DocExtension,
  docDirName,
};
