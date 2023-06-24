const { getFileName, getFileExtension, consoleInfo } = require("./utils");
const path = require("path");
const { SupportExtensions } = require("./config");

const otherTree = {};
const specialTree = {};
const externalTree = {};

/**
 * 以文件名为维度
 */
function genFileObject(node, file, filePath, isExternal) {
  const name = getFileName(file);
  const extension = getFileExtension(file);
  if (!node[name]) {
    node[name] = [];
  }
  const fileObj = node[name].find((i) => i.extension === extension);
  if (fileObj) {
    return fileObj;
  }

  const obj = {
    name,
    isDir: false,
    absolutePath: filePath,
    extension: extension,
    data: [],
    external: isExternal,
  };
  node[name].push(obj);
  return obj;
}

// 第一次生成 tree 之后需要执行的函数
let callbacks = [];

/**
 * TODO: reduce args
 *  1. import 来是相对路径 ==> 生成绝对路径路径，去所有 tree 中寻找
    2. import 来的 node_module ==> 直接在 externalTree 中寻找
    3. 父类在同文件 ==> 直接在 data 中寻找
    4. 错误处理 ==>
 */
function genImportCallback(importObj, superClassName, classInfo, fileNode) {
  function exec() {
    const importPath = importObj[superClassName];
    // 3
    if (!importPath) {
      fileNode.data.forEach((item) => {
        if (item.name === superClassName) {
          classInfo.superClassInfo = item;
        }
      });
      return;
    }

    // 1
    if (importPath.startsWith(".")) {
      const absolutePaths = SupportExtensions.map((extension) =>
        path.resolve(
          path.dirname(fileNode.absolutePath),
          importPath + "." + extension
        )
      );

      let superClassInfo,
        idx = 0;
      do {
        superClassInfo =
          findClassInfoByAbsolutePathAndName(
            absolutePaths[idx],
            superClassName,
            specialTree
          ) ||
          findClassInfoByAbsolutePathAndName(
            absolutePaths[idx],
            superClassName,
            otherTree
          );
        idx++;
      } while (!superClassInfo && idx < absolutePaths.length);
      classInfo.superClassInfo = superClassInfo;
    } else {
      // 2
      classInfo.superClassInfo = findClassInfoInExternal(
        importPath,
        superClassName
      );
    }
  }
  callbacks.push(exec);
}

function execCallbacks() {
  callbacks.forEach((fn) => fn());
  callbacks = [];
}

// TODO short function name how to short ?
function findClassInfoByAbsolutePathAndName(absolutePath, className, tree) {
  for (let [key, val] of Object.entries(tree)) {
    if (val.isDir) {
      return findClassInfoByAbsolutePathAndName(
        absolutePath,
        className,
        val.children
      );
    }
    let target;
    if ((target = val.find((item) => item.absolutePath === absolutePath))) {
      return target.data.find((item) => item.name === className);
    }
  }
}

// 必须是一层，而且只能是一层
// TODO add support deep search
function findClassInfoInExternal(importPath, superClassName) {
  const node = externalTree[importPath];
  for (let [key, val] of Object.entries(node.children)) {
    // TODO support external dir .d.ts .ts .js muti type 
    const res = val[0].data.find((item) => item.name === superClassName);
    if (res) return res;
  }
}
module.exports = {
  otherTree,
  specialTree,
  externalTree,
  genFileObject,
  genImportCallback,
  execCallbacks,
};
