const fs = require("fs");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const generate = require("@babel/generator").default;
const types = require("@babel/types");

const sourceCode = fs.readFileSync("./code.js").toString();

const ast = parser.parse(sourceCode, {
  sourceType: "unambiguous",
});

traverse(ast, {
  CallExpression(path, state) {
    if (
      types.isMemberExpression(path.node.callee) &&
      path.node.callee.object.name === "console" &&
      ["log", "info"].includes(path.node.callee.property.name)
    ) {
      const { line } = path.node.loc.start;
      path.node.arguments.unshift(types.stringLiteral(`[line#${line}]:`));
    }
  },
});

const { code, map } = generate(ast);
fs.writeFileSync("./afterProcess.js", code);
