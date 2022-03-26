import {NodePath, PluginObj, PluginPass} from "@babel/core";
import {
    CallExpression,
    ExportDefaultDeclaration,
    ImportDeclaration,
    isArrayExpression,
    isArrayPattern,
    isArrowFunctionExpression,
    isAssignmentExpression,
    isAssignmentPattern, isAwaitExpression,
    isBinaryExpression,
    isBlockStatement,
    isBooleanLiteral, isBreakStatement,
    isCallExpression,
    isConditionalExpression,
    isExpressionStatement,
    isFunctionExpression,
    isIdentifier,
    isIfStatement,
    isImportDefaultSpecifier,
    isImportSpecifier,
    isJSXAttribute,
    isJSXClosingElement,
    isJSXElement,
    isJSXExpressionContainer,
    isJSXIdentifier,
    isJSXMemberExpression,
    isJSXOpeningElement,
    isJSXText,
    isLogicalExpression,
    isMemberExpression,
    isNewExpression,
    isNullLiteral,
    isNumericLiteral,
    isObjectExpression,
    isObjectPattern,
    isObjectProperty, isOptionalMemberExpression, isRestElement,
    isReturnStatement, isSequenceExpression, isSpreadElement,
    isStringLiteral, isSwitchCase, isSwitchStatement,
    isTemplateElement,
    isTemplateLiteral,
    isThisExpression, isThrowStatement, isTryStatement,
    isTSAnyKeyword,
    isTSAsExpression,
    isTSNonNullExpression,
    isTSTupleType, isTSTypeOperator, isTSTypeQuery,
    isUnaryExpression,
    isVariableDeclaration,
    isVariableDeclarator, isWhileStatement, isYieldExpression,
    SourceLocation,
    VariableDeclaration
} from "@babel/types";

const getPosition: (loc: SourceLocation | null ) => string = (loc) => {
    let pos = "" ;
    if(loc){
        pos += loc.start.line ;
        pos += ":"
        pos += ("["+loc.start.column+","+loc.end.column+"]")
    }
    return pos ;
}
const getFileName: (state: PluginPass) => string = (state) => {
    return state.filename?.slice(state.cwd.length + 1) || "";
}

const getExpressionStr: (node: any) => string = (node) => {
    if (isIdentifier(node) || isJSXIdentifier(node)) {
        return node.name;
    } else if (isJSXClosingElement(node)) {
        return "</" + getExpressionStr(node.name) + ">"
    } else if (isJSXElement(node)) {
        if (node.children.length > 0) {
            return "<" + getExpressionStr(node.openingElement) + ">" + node.children.map(getExpressionStr).join(" ") + getExpressionStr(node.closingElement);
        } else {
            return "<" + getExpressionStr(node.openingElement) + "/>";
        }
    } else if (isJSXOpeningElement(node)) {
        return getExpressionStr(node.name) + " " + node.attributes.map(getExpressionStr).join(" ");
    } else if (isJSXAttribute(node)) {
        return getExpressionStr(node.name) + "=" + getExpressionStr(node.value);
    } else if (isJSXExpressionContainer(node)) {
        return "{" + getExpressionStr(node.expression) + "}"
    } else if (isJSXText(node) || isNumericLiteral(node) || isBooleanLiteral(node)) {
        return node.value + "";
    } else if (isStringLiteral(node)) {
        return "'" + node.value + "'";
    } else if (isArrayExpression(node) || isArrayPattern(node)) {
        return "[" + node.elements.map(getExpressionStr).join(",") + "]";
    } else if (isUnaryExpression(node)) {
        return node.operator + " " + getExpressionStr(node.argument);
    } else if (isBinaryExpression(node) || isAssignmentExpression(node) || isLogicalExpression(node)) {
        return getExpressionStr(node.left) + node.operator + getExpressionStr(node.right)
    } else if (isObjectExpression(node)) {
        return "{" + node.properties.map(getExpressionStr).join(",") + "}";
    } else if (isMemberExpression(node) || isJSXMemberExpression(node)) {
        return getExpressionStr(node.object) + "." + getExpressionStr(node.property);
    } else if (isCallExpression(node)) {
        let line = getExpressionStr(node.callee);
        line += "(";
        line += node.arguments.map(getExpressionStr).join(",");
        line += ")";
        return line;
    } else if (isArrowFunctionExpression(node)) {
        let line = "(";
        line += node.params.map(getExpressionStr).join(",");
        line += ")";
        line += "=> ";
        line += getExpressionStr(node.body)
        return line;
    } else if (isBlockStatement(node)) {
        return "{" + node.body.map(getExpressionStr).join(" ") + "; }"
    } else if (isReturnStatement(node)) {
        return "return " + getExpressionStr(node.argument);
    } else if (isThisExpression(node)) {
        return "this"
    } else if (isExpressionStatement(node)) {
        return getExpressionStr(node.expression);
    } else if (isAssignmentPattern(node)) {
        return getExpressionStr(node.left) + "=" + getExpressionStr(node.right);
    } else if (isVariableDeclaration(node)) {
        return node.kind + " " + node.declarations.map(getExpressionStr).join(",");
    } else if (isVariableDeclarator(node)) {
        return getExpressionStr(node.id) + "=" + getExpressionStr(node.init);
    } else if (isTemplateLiteral(node)) {
        return node.quasis.map(getExpressionStr).join("") + node.expressions.map(getExpressionStr).join("")
    } else if (isTemplateElement(node)) {
        return "`" + node.value.raw + "`";
    } else if (isConditionalExpression(node)) {
        return getExpressionStr(node.test) + "?" + getExpressionStr(node.consequent) + ":" + getExpressionStr(node.alternate);
    } else if (isIfStatement(node)) {
        return "if(" + getExpressionStr(node.test) + ")" + getExpressionStr(node.consequent);
    } else if (isObjectPattern(node)) {
        return node.properties.map(getExpressionStr).join(",");
    } else if (isObjectProperty(node)) {
        return getExpressionStr(node.key) + ":" + getExpressionStr(node.value)
    }
    else if (isNewExpression(node)) {
        return "new " + getExpressionStr(node.callee) + "(" + node.arguments.map(getExpressionStr).join(",") + ")";
    }
    else if(isNullLiteral(node)){
        return "null";
    }
    else if(isFunctionExpression(node)) {
        return "function " + getExpressionStr(node.id) + "(" + node.params.map(getExpressionStr).join(",") + "){" + getExpressionStr(node.body) + "}";
    }
    else if(isTSNonNullExpression(node)) {
        return getExpressionStr(node.expression) + "!";
    }
    else if(isTSAsExpression(node)) {
        return getExpressionStr(node.expression) + " as " + getExpressionStr(node.typeAnnotation);
    }
    else if(isTSAnyKeyword(node)) {
        return "any";
    }
    else if(isTSTupleType(node)) {
        return "(" + node.elementTypes.map(getExpressionStr).join(",") + ")";
    }
    else if(isTSTypeOperator(node)) {
        return getExpressionStr(node.typeAnnotation) + node.operator;
    }
    else if (isTSTypeQuery(node)) {
        return getExpressionStr(node.exprName);
    }
    else if(isTryStatement(node)){
        return "try{" + getExpressionStr(node.block) + "}" +
            (node.handler ? "catch(" + getExpressionStr(node.handler.param) + "){" + getExpressionStr(node.handler.body) + "}" : "")
            +(node.finalizer ? "finally{" + getExpressionStr(node.finalizer) + "}" : "");
    }
    else if(isOptionalMemberExpression(node)){
        return getExpressionStr(node.object) + "?" + getExpressionStr(node.property);
    }
    else if(isRestElement(node) || isSpreadElement(node)) {
        return "..." + getExpressionStr(node.argument);
    }
    else if(isThrowStatement(node)) {
        return "throw " + getExpressionStr(node.argument);
    }
    else if(isSwitchStatement(node)) {
        return "switch(" + getExpressionStr(node.discriminant) + "){" + node.cases.map(getExpressionStr).join("") + "}";
    }
    else if(isSwitchCase(node)) {
        return "case " + getExpressionStr(node.test) + ":" + node.consequent.map(getExpressionStr).join("");
    }
    else if(isBreakStatement(node)) {
        return "break";
    }
    else if(isAwaitExpression(node)) {
        return "await " + getExpressionStr(node.argument);
    }
    else if(isYieldExpression(node)) {
        return "yield " + getExpressionStr(node.argument);
    }
    else if(isWhileStatement(node)) {
        return "while(" + getExpressionStr(node.test) + ")" + getExpressionStr(node.body);
    }
    else if(isSequenceExpression(node)) {
        return node.expressions.map(getExpressionStr).join(";");
    }

    console.log(node)
    return "";
}

function testPluginFunction(): PluginObj {
    return {
        visitor: {
            ImportDeclaration(path: NodePath<ImportDeclaration>, state: PluginPass) {
                const node = path.node;
                let str = "import ";
                const defaultSpecifiers = node.specifiers.filter(s => isImportDefaultSpecifier(s));
                defaultSpecifiers.forEach(s => {
                    str += s.local.name;
                });
                const otherSpecifiers = node.specifiers.filter(s => isImportSpecifier(s));
                if (otherSpecifiers.length > 0) {
                    if (defaultSpecifiers.length > 0) {
                        str += " , ";
                    }
                    str += "{ ";
                }
                otherSpecifiers
                    .forEach(s => {
                        str += s.local.name;
                    });
                if (otherSpecifiers.length > 0) {
                    str += " } ";
                }
                if (defaultSpecifiers.length > 0 || otherSpecifiers.length > 0) {
                    str += " from ";
                }
                str += ("'" + node.source.value + "'");

                console.log(getFileName(state),getPosition(node.loc), str);
            },
            VariableDeclaration: function (path: NodePath<VariableDeclaration>, state: PluginPass) {
                console.log(getFileName(state), getPosition(path.node.loc), getExpressionStr(path.node));
            },

            CallExpression(path:NodePath<CallExpression>, state:PluginPass) {
                console.log(getFileName(state), getPosition(path.node.loc), getExpressionStr(path.node));
            },
            ExportDefaultDeclaration(path:NodePath<ExportDefaultDeclaration>, state:PluginPass){
                let line = "export default " ;
                if(isIdentifier(path.node.declaration)) {
                    line += path.node.declaration.name ;
                }
                console.log(getFileName(state),getPosition(path.node.loc), line)
            },
        },
    };
}

module.exports = testPluginFunction ;