const fs = require("fs-extra");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const path = require("path");

const {
  resolveType,
  parseComment,
  consoleInfo,
  isClassIgnore,
  isClassSpecial,
} = require("./utils");
const render = require("./render/index.js");

const { isDir } = require("./path");
const {
  specialTree,
  otherTree,
  externalTree,
  genFileObject,
  genImportCallback,
  execCallbacks,
} = require("./store");
const {
  dirPath,
  externalDirPath,
  externalDocPath,
  specialDocPath,
  absoluteDocDir,
  otherDocPath,
  DocExtension,
} = require("./config");
const { combineComments } = require("./render/combine");

/**
 * 1. 第一次解析先将对象全部都解析出来，区分 special other external
 * 2. 解析 superClass ，添加属性以支持 link 以及属性/方法继承
 * 3. 同名文件，按照扩展名进行优先级覆盖 ==> 将同一目录下同名的存储起来，在第二次遍历之后进行合并
 * 4. extends 的是复合函数
 * 4. vite sidebar
 * 4. 自动推断类型，例如 returnType 等
 * 5. 添加源码文件索引/位置
 * 6. import as ==> :(
 */
Promise.all([
  resolveDir(dirPath, otherTree),
  resolveDir(externalDirPath, externalTree, true),
]).then(() => {
  execCallbacks();
  consoleInfo(specialTree);
  // consoleInfo(otherTree);
  // consoleInfo(externalTree);
  fs.emptyDirSync(absoluteDocDir);
  ensureDir();
  genDoc(otherTree, otherDocPath);
  genDoc(specialTree, specialDocPath);
  genDoc(externalTree, externalDocPath);
});

async function resolveDir(dirPath, fatherNode, isExternal) {
  const files = fs.readdirSync(dirPath);
  await Promise.all(
    files
      .map((file) => {
        return async function () {
          const filePath = path.resolve(dirPath, file);
          if (await isDir(filePath)) {
            fatherNode[file] = {
              name: file,
              isDir: true,
              absolutePath: filePath,
              children: {},
              external: isExternal,
            };
            await resolveDir(filePath, fatherNode[file].children, isExternal);
          } else {
            await resolveFile(fatherNode, file, filePath, isExternal);
          }
        };
      })
      .map((fn) => fn())
  );
}

async function resolveFile(fatherNode, file, filePath, isExternal) {
  const sourceCode = fs.readFileSync(filePath).toString();

  const ast = parser.parse(sourceCode, {
    sourceType: "unambiguous",
    plugins: ["typescript"],
  });

  // 先解析 import
  const importObj = resolveImport(ast);

  // 解析 export
  const exportDeclarations = resolveExport(ast);

  traverse(ast, {
    ClassDeclaration(path, state) {
      // 将 export 的 comments 移到 class 上
      let comments = path.node.leadingComments;
      if (
        exportDeclarations.find((item) => item.declaration === path.node) &&
        !comments
      ) {
        comments = exportDeclarations.find(
          (item) => item.declaration === path.node
        ).leadingComments;
      }

      if (isClassIgnore(comments)) {
        return;
      }

      const classInfo = {
        type: "class",
        name: path.get("id").toString(),
        constructorInfo: {},
        methodsInfo: [],
        propertiesInfo: [],
        doc: comments && parseComment(comments[0].value),
      };
      const isSpecial = isClassSpecial(comments);
      const fileNode = genFileObject(
        isSpecial ? specialTree : fatherNode,
        file,
        filePath,
        isExternal
      );
      classInfo.special = isSpecial;
      classInfo.parentNode = fileNode;
      fileNode.data.push(classInfo);

      if (classInfo.name === "Son") {
        // consoleInfo(exportDeclarations[0].leadingComments);
        // consoleInfo(isSpecial);
      }

      // resolve super class
      if (path.node.superClass) {
        classInfo.superClass = path.node.superClass;
        genImportCallback(
          importObj,
          path.node.superClass.name,
          classInfo,
          fileNode
        );
      }

      path.traverse({
        ClassProperty(path) {
          classInfo.propertiesInfo.push({
            name: path.get("key").toString(),
            type: resolveType(path.getTypeAnnotation()),
            doc: [path.node.leadingComments]
              .filter(Boolean)
              .map((comment) => {
                return parseComment(comment[0].value);
              })
              .filter(Boolean),
          });
        },
        ClassMethod(path) {
          if (path.node.kind === "constructor") {
            classInfo.constructorInfo = {
              params: path.get("params").map((paramPath) => {
                return {
                  name: paramPath.toString(),
                  type: resolveType(paramPath.getTypeAnnotation()),
                  doc:
                    path.node.leadingComments &&
                    parseComment(path.node.leadingComments[0].value),
                };
              }),
            };
          } else {
            //
            // path.node.trailingComments
            classInfo.methodsInfo.push({
              name: path.get("key").toString(),
              doc: parseComment(path.node.leadingComments[0].value),
              params: path.get("params").map((paramPath) => {
                return {
                  name: paramPath.toString(),
                  type: resolveType(paramPath.getTypeAnnotation()),
                };
              }),
              return: resolveType(path.getTypeAnnotation()),
            });
          }
        },
      });
    },
  });
}

function resolveImport(ast) {
  const importObj = {};
  traverse(ast, {
    ImportDeclaration(path, state) {
      path.node.specifiers.forEach((specifier) => {
        importObj[specifier.local.name] = path.node.source.value;
      });
    },
  });
  return importObj;
}

function resolveExport(ast) {
  let node = [];
  traverse(ast, {
    ExportNamedDeclaration(path) {
      node.push(path.node);
    },
  });

  return node;
}

function ensureDir() {
  fs.ensureDirSync(otherDocPath);
  fs.ensureDirSync(specialDocPath);
  fs.ensureDirSync(externalDocPath);
}

function genDoc(tree, prefixPath) {
  for (const [key, val] of Object.entries(tree)) {
    if (val.isDir) {
      const docDirPath = path.resolve(prefixPath, key);
      fs.ensureDirSync(docDirPath);
      genDoc(val.children, docDirPath);
    } else {
      // TODO redesign
      const docFileName = key + "." + DocExtension;
      const docFilePath = path.resolve(prefixPath, docFileName);
      // val 此时是一个数组
      // consoleInfo(combineComments(val))
      const info = combineComments(val).data
      fs.writeFileSync(docFilePath, render(info));
    }
  }
}
