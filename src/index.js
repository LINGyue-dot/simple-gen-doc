const fs = require("fs-extra");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const path = require("path");

const {
  resolveType,
  parseComment,
  consoleInfo,
  getFileExtension,
  isClassIgnore,
  isClassSpecial,
  getFileName,
} = require("./utils");
const render = require("./render");

const { isDir } = require("./path");
const {
  specialTree,
  otherTree,
  externalTree,
  genFileObject,
  genImportCallback,
  execCallbacks,
} = require("./store");
const { importDeclaration } = require("@babel/types");

const dir = "../example";
const dirPath = path.resolve(__dirname, dir);

const externalDir = "../_external";
const externalDirPath = path.resolve(__dirname, externalDir);

const docDir = "../vitepress/doc";
const absoluteDocDir = path.resolve(__dirname, "../vitepress/doc");
const otherDocPath = path.resolve(__dirname, docDir, "other");
const specialDocPath = path.resolve(__dirname, docDir, "special");
const externalDocPath = path.resolve(__dirname, docDir, "external");
const DocExtension = "md";

/**
 * 1. 第一次解析先将对象全部都解析出来，区分 special other external
 * 2. 解析 superClass ，添加属性以支持 link 以及属性/方法继承
 * 3. 同名文件，按照扩展名进行优先级覆盖
 * 4. extends 的是复合函数
 * 4. 自动推断类型，例如 returnType 等
 * 5. 添加源码文件索引/位置
 * 6. import as ==> :(
 */
Promise.all([
  resolveDir(dirPath, otherTree),
  resolveDir(externalDirPath, externalTree),
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

async function resolveDir(dirPath, fatherNode) {
  const files = fs.readdirSync(dirPath);
  await Promise.all(
    files
      .map((file) => {
        return async function () {
          const filePath = path.resolve(dirPath, file);
          if (await isDir(filePath)) {
            fatherNode[file] = {
              isDir: true,
              absolutePath: filePath,
              children: {},
            };
            await resolveDir(filePath, fatherNode[file].children);
          } else {
            await resolveFile(fatherNode, file, filePath);
          }
        };
      })
      .map((fn) => fn())
  );
}

async function resolveFile(fatherNode, file, filePath) {
  const sourceCode = fs.readFileSync(filePath).toString();

  const ast = parser.parse(sourceCode, {
    sourceType: "unambiguous",
    plugins: ["typescript"],
  });

  // 先解析 import
  const importObj = resolveImport(ast);

  traverse(ast, {
    ClassDeclaration(path, state) {
      if (isClassIgnore(path.node.leadingComments)) {
        return;
      }
      const classInfo = {
        type: "class",
        name: path.get("id").toString(),
        constructorInfo: {},
        methodsInfo: [],
        propertiesInfo: [],
        doc:
          path.node.leadingComments &&
          parseComment(path.node.leadingComments[0].value),
      };
      const isSpecial = isClassSpecial(path.node.leadingComments);
      const fileNode = genFileObject(
        isSpecial ? specialTree : fatherNode,
        file,
        filePath
      );
      classInfo.special = isSpecial;
      fileNode.data.push(classInfo);

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

function ensureDir() {
  fs.ensureDirSync(otherDocPath);
  fs.ensureDirSync(specialDocPath);
  fs.ensureDirSync(externalDocPath);
}

function genDoc(otherTree, prefixPath) {
  for (const [key, val] of Object.entries(otherTree)) {
    if (val.isDir) {
      const docDirPath = path.resolve(prefixPath, key);
      fs.ensureDirSync(docDirPath);
      genDoc(val.children, docDirPath);
    } else {
      // TODO redesign
      const docFileName = key.replace(`.${val.extension}`, `.${DocExtension}`);
      const docFilePath = path.resolve(prefixPath, docFileName);
      fs.writeFileSync(docFilePath, render(val.data));
    }
  }
}
