const fs = require("fs-extra");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const path = require("path");

const {
  resolveType,
  parseComment,
  consoleInfo,
  getFileExtension,
} = require("./utils");
const render = require("./render");

const { isDir } = require("./path");

const dir = "./example";
const dirPath = path.resolve(__dirname, dir);

const docDir = "../../vitepress/doc";
const docPath = path.resolve(__dirname, docDir);
const DocExtension = "md";

const tree = {};

resolveDir(dirPath, tree).then(() => {
  // consoleInfo(tree);
  fs.emptyDirSync(docPath);
  genDoc(tree, docPath);
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
            fatherNode[file] = {
              isDir: false,
              absolutePath: filePath,
              extension: getFileExtension(file),
              data: [],
            };
            await resolveFile(filePath, fatherNode[file].data);
          }
        };
      })
      .map((fn) => fn())
  );
}

async function resolveFile(filePath, data) {
  const sourceCode = fs.readFileSync(filePath).toString();

  const ast = parser.parse(sourceCode, {
    sourceType: "unambiguous",
    plugins: ["typescript"],
  });

  traverse(ast, {
    FunctionDeclaration(path, state) {
      data.push({
        type: "function",
        name: path.get("id").toString(),
        params: path.get("params").map((paramPath) => {
          return {
            name: paramPath.toString(),
            type: resolveType(paramPath.getTypeAnnotation()),
          };
        }),
        return: resolveType(path.get("returnType").getTypeAnnotation()),
        doc:
          path.node.leadingComments &&
          parseComment(path.node.leadingComments[0].value),
      });
    },
    //
    ClassDeclaration(path, state) {
      const classInfo = {
        type: "class",
        name: path.get("id").toString(),
        constructorInfo: {},
        methodsInfo: [],
        propertiesInfo: [],
        superClass: path.node.superClass,
        doc:
          path.node.leadingComments &&
          parseComment(path.node.leadingComments[0].value),
      };
      data.push(classInfo);

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
  // fileMap.set(fileName, res);
}

function genDoc(tree, prefixPath) {
  for (const [key, val] of Object.entries(tree)) {
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
