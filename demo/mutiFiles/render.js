/**
 * fork from guang
 * @param {*} docs
 * @returns
 */
module.exports = function (docs) {
  let str = "";

  docs.forEach((doc) => {
    if (doc.type === "function") {
      str += "##" + doc.name + "\n";
      str += doc.doc.description + "\n";
      if (doc.doc.tags) {
        doc.doc.tags.forEach((tag) => {
          str += tag.name + ": " + tag.description + "\n";
        });
      }
      str += ">" + doc.name + "(";
      if (doc.params) {
        str += doc.params
          .map((param) => {
            return param.name + ": " + param.type;
          })
          .join(", ");
      }
      str += ")\n";
      str += "#### Parameters:\n";
      if (doc.params) {
        str += doc.params
          .map((param) => {
            return "-" + param.name + "(" + param.type + ")";
          })
          .join("\n");
      }
      str += "\n";
    } else if (doc.type === "class") {
      str += `# ${doc.name} ${doc.doc ? doc.doc.description : ""} \n`;

      if (doc.doc) {
        if (doc.doc.tags) {
          doc.doc.tags.forEach((tag) => {
            str += tag.name + ": " + tag.description + "\n";
          });
        }
      }

      str += (doc.superClass ? "该类继承于 " + doc.superClass.name : "") + "\n";

      str += "> new " + doc.name + "(";
      if (doc.constructorInfo.params) {
        str += doc.constructorInfo.params
          .map((param) => {
            return param.name + ": " + param.type;
          })
          .join(", ");
      }
      str += ")\n";
      str += "## Properties:\n";
      if (doc.propertiesInfo) {
        doc.propertiesInfo.forEach((param) => {
          str += "### " + param.name + ":" + param.type + "\n";
        });
      }
      str += "## Methods:\n";
      if (doc.methodsInfo) {
        doc.methodsInfo.forEach((method) => {
          str += `### ${method.name}(${
            method.params &&
            method.params
              .map((param) => `${param.name}:${param.type}`)
              .join(", ")
          } ${method.return || " : void"})\n`;
        });
      }
      str += "\n";
    }
    str += "\n";
  });
  return str;
};
