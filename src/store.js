const { getFileName, getFileExtension } = require("./utils");
const path = require("path");
const { SupportExtensions } = require("./config");

const otherTree = {};
const specialTree = {};
const externalTree = {};

function genFileObject(node, file, filePath) {
  if (node[file]) {
    return node[file];
  } else {
    return (node[file] = {
      name: getFileName(file),
      isDir: false,
      absolutePath: filePath,
      extension: getFileExtension(file),
      data: [],
    });
  }
}

// 第一次生成 tree 之后需要执行的函数
const callbacks = [];

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
      fatherNode.data.forEach((item) => {
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
          importPath + "" + extension
        )
      );
      console.log(absolutePaths);

      let superClassInfo,
        idx = 0;
      do {
        superClassInfo =
          findFileNodeByAbsolutePathAndName(
            absolutePaths[idx],
            superClassName,
            specialTree
          ) ||
          findFileNodeByAbsolutePathAndName(
            absolutePaths[idx],
            superClassName,
            otherTree
          );
        idx++;
      } while (!superClassInfo && idx < absolutePaths.length);
      classInfo.superClassInfo = superClassInfo;
    } else {
      // 2
      classInfo.superClassInfo = findFileNodeInExternal(
        importPath,
        superClassName
      );
    }
  }
  callbacks.push(exec);
}

function execCallbacks() {
  callbacks.forEach((fn) => fn());
}

// TODO short function name how to short ?
function findFileNodeByAbsolutePathAndName(absolutePath, className, tree) {
  for (let [key, val] of Object.entries(tree)) {
    if (val.isDir) {
      return findFileNodeByAbsolutePathAndName(
        absolutePath,
        className,
        val.children
      );
    }
    if (val.absolutePath === absolutePath) {
      return val.data.find((item) => item.name === className);
    }
  }
}

// 必须是一层，而且只能是一层
// TODO add support deep search
function findFileNodeInExternal(importPath, superClassName) {
  const node = externalTree[importPath];
  const children = node.children;
  for (let [key, val] of children) {
    const res = val.data.find((item) => item.name === superClassName);
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
