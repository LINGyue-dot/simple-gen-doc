const fs = require("fs");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const generate = require("@babel/generator").default;
const types = require("@babel/types");
const { resolveType, parseComment,console } = require("./utils");
const render = require("./render");

const util = require("util");

const sourceCode = fs.readFileSync("./singleFileExample.ts").toString();

const res = [];

const ast = parser.parse(sourceCode, {
  sourceType: "unambiguous",
  plugins: ["typescript"],
});

traverse(ast, {
  // 独立函数解析
  FunctionDeclaration(path, state) {
    res.push({
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
      doc:
        path.node.leadingComments &&
        parseComment(path.node.leadingComments[0].value),
    };
    res.push(classInfo);

    path.traverse({
      ClassProperty(path) {
        classInfo.propertiesInfo.push({
          name: path.get("key").toString(),
          type: resolveType(path.getTypeAnnotation()),
          doc: [path.node.leadingComments, path.node.trailingComments]
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

console(res)

fs.writeFileSync("./temp.md", render(res));

// function 中 函数名相关信息是在 id 中
// class function 中的函数名相关信息是在 key 中
