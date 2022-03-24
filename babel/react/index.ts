import {NodePath, PluginObj, PluginPass} from "@babel/core";
import {
    CallExpression,
    ExportDefaultDeclaration,
    ImportDeclaration,
    isArrayExpression,
    isArrayPattern, isArrowFunctionExpression, isBinaryExpression, isBindExpression, isBlockStatement,
    isBooleanLiteral,
    isCallExpression,
    isIdentifier,
    isImportDefaultSpecifier,
    isImportSpecifier, isJSXAttribute,
    isJSXClosingElement,
    isJSXElement, isJSXExpressionContainer,
    isJSXIdentifier,
    isJSXMemberExpression,
    isJSXOpeningElement, isJSXText,
    isMemberExpression,
    isNumericLiteral,
    isObjectExpression,
    isObjectMethod,
    isObjectProperty, isReturnStatement,
    isStringLiteral,
    isThisExpression,
    isUnaryExpression,
    ObjectExpression,
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
    if(isIdentifier(node) || isJSXIdentifier(node)){
        return node.name;
    }
    else if(isJSXClosingElement(node)){
        return "</"+getExpressionStr(node.name)+">"
    }
    else if(isJSXElement(node)){
        if(node.children.length > 0){
            return "<" + getExpressionStr(node.openingElement) +">" + node.children.map(getExpressionStr).join(" ")+ getExpressionStr(node.closingElement) ;
        }
        else {
            return "<" + getExpressionStr(node.openingElement) +"/>" ;
        }
    }
    else if(isJSXOpeningElement(node)){
        return getExpressionStr(node.name) +" "+ node.attributes.map(getExpressionStr).join(" ") ;
    }
    else if(isJSXAttribute(node)){
        return getExpressionStr(node.name) + "="+ getExpressionStr(node.value) ;
    }
    else if(isJSXExpressionContainer(node)){
        return "{"+ getExpressionStr(node.expression) +"}"
    }
    else if(isJSXText(node) || isNumericLiteral(node) || isBooleanLiteral(node)){
        return node.value +"" ;
    }
    else if(isStringLiteral(node)){
        return "'"+node.value+"'" ;
    }
    else if (isArrayExpression(node) || isArrayPattern(node)){
        return "["+ node.elements.map(getExpressionStr).join(",")+"]" ;
    }
    else if(isUnaryExpression(node)) {
        return node.operator + " " + getExpressionStr(node.argument);
    }
    else if(isBinaryExpression(node)) {
        return getExpressionStr(node.left) + node.operator + getExpressionStr(node.right)
    }
    else if(isObjectExpression(node)) {
        return getObjectExpressStr(node);
    }
    else if(isMemberExpression(node) || isJSXMemberExpression(node)){
        return getExpressionStr(node.object) +"."+getExpressionStr(node.property);
    }

    else if(isCallExpression(node)) {
        let line = getExpressionStr(node.callee) ;
        line += "(" ;
        line += node.arguments.map(getExpressionStr).join(",");
        line += ")" ;
        return line;
    }
    else if(isArrowFunctionExpression(node)) {
        let line = "(" ;
        line += node.params.map(getExpressionStr).join(",") ;
        line += ")" ;
        line += "=> " ;
        line += getExpressionStr(node.body)
        return line;
    }
    else if(isBlockStatement(node)){
        return "{" + node.body.map(getExpressionStr).join(" ") +"; }"
    }
    else if(isReturnStatement(node)) {
        return "return "+ getExpressionStr(node.argument);
    }
    else if(isThisExpression(node)){
        return "this"
    }
    console.log(node)
    return "" ;
}


const getObjectExpressStr: (obj: ObjectExpression) => string = (obj) => {
    let line = "{";

    line += obj.properties.map(p => {
        if(isObjectProperty(p)){
            return getExpressionStr(p.key)+":" +getExpressionStr(p.value)
        }
        else if(isObjectMethod(p)) {
            return getExpressionStr(p.key) + ":" ;
        }
        return "" ;
    }).join(",")

    line+="}" ;
    return line ;
}


export default function testPluginFunction(): PluginObj {
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
                const declarations = path.node.declarations;
                let line = path.node.kind + " ";
                declarations.forEach(d => {
                    line += getExpressionStr(d.id) ;
                    if (d.init) {
                        line += " = ";
                        line += getExpressionStr(d.init);

                    }
                    line += " ;";
                })
                console.log(getFileName(state), getPosition(path.node.loc), line);

            },

            CallExpression(path:NodePath<CallExpression>, state:PluginPass) {
                let line = getExpressionStr(path.node);
                console.log(getFileName(state), line)

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

