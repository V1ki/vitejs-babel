import {NodePath, PluginObj, PluginPass} from "@babel/core";
import {
    CallExpression, ExportDefaultDeclaration,
    Identifier,
    ImportDeclaration, isArrayPattern, isCallExpression, isIdentifier,
    isImportDefaultSpecifier,
    isImportSpecifier, isNumericLiteral, isStringLiteral, SourceLocation,
    VariableDeclaration
} from "@babel/types";

const getPosition: (loc: SourceLocation | null ) => String = (loc) => {
    let pos = "" ;
    if(loc){
        pos += loc.start.line ;
        pos += ":"
        pos += ("["+loc.start.column+","+loc.end.column+"]")
    }
    return pos ;
}


export default function testPluginFunction(): PluginObj {
    return {
        visitor: {
            ImportDeclaration(path: NodePath<ImportDeclaration>, state: PluginPass) {
                // console.log(path,state);
                const filename = state.filename?.replace(state.cwd + "/", "");
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

                console.log(filename, getPosition(node.loc), str);
                // console.log('ImportDeclaration Entered!', path.node);
                // console.log("node.specifiers: ",node.specifiers )
                // console.log("source: ",node.source.value)

            },
            VariableDeclaration(path: NodePath<VariableDeclaration>, state: PluginPass) {
                const declarations = path.node.declarations;
                const filename = state.filename?.replace(state.cwd + "/", "");
                declarations.forEach(d => {
                    let line = path.node.kind;
                    if (isArrayPattern(d.id)) {
                        line += " [";
                        line += d.id.elements.map(e => {
                            return (e as Identifier).name;

                        }).join(",")
                        line += " ]";
                    } else if (isIdentifier(d.id)) {
                        line += " " + d.id.name;
                    }
                    if (d.init) {
                        line += " = ";
                        if (isStringLiteral(d.init)) {
                            line += ("'" + d.init.value + "'");
                        }
                        else if(isCallExpression(d.init)) {
                            if(isIdentifier(d.init.callee)){
                                line += d.init.callee.name ;
                            }
                            line += "(" ;
                            line += d.init.arguments.map(arg=>{
                                if(isNumericLiteral(arg)) {
                                    return arg.value ;
                                }
                                else if (isIdentifier(arg)){
                                    return arg.name;
                                }
                                else if(isStringLiteral(arg)){
                                    return  ("'"+arg.value+"'");
                                }
                                return ""
                            }).join(",");

                            line += ")" ;
                        }

                    }
                    line += " ;" ;
                    console.log(filename,getPosition(path.node.loc),line);
                })

            },

            CallExpression(path:NodePath<CallExpression>, state:PluginPass) {
                const filename = state.filename?.replace(state.cwd + "/", "");
                let line = "";
                if(isIdentifier(path.node.callee)) {
                    line += path.node.callee.name ;
                }
                line += "(" ;
                line += path.node.arguments.map(arg=>{
                    if(isNumericLiteral(arg)) {
                        return arg.value ;
                    }
                    else if (isIdentifier(arg)){
                        return arg.name;
                    }
                    else if(isStringLiteral(arg)){
                        return  ("'"+arg.value+"'");
                    }
                    return ""
                }).join(",");

                line += ")" ;
                console.log(filename, line)

            },
            ExportDefaultDeclaration(path:NodePath<ExportDefaultDeclaration>, state:PluginPass){
                console.log(path,state)
                const filename = state.filename?.replace(state.cwd + "/", "");
                let line = "export default " ;
                if(isIdentifier(path.node.declaration)) {
                    line += path.node.declaration.name ;
                }
                console.log(filename,getPosition(path.node.loc), line)
            },
        },
    };
}

