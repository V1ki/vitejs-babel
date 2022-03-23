import {NodePath, PluginObj, PluginPass} from "@babel/core";
import {
    Identifier,
    ImportDeclaration, isArrayPattern, isCallExpression, isIdentifier,
    isImportDefaultSpecifier,
    isImportSpecifier, isNumericLiteral, isStringLiteral,
    VariableDeclaration
} from "@babel/types";

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

                let pos = "" ;
                if(node.loc){
                    pos += node.loc.start.line ;
                    pos += ":"
                    pos += ("["+node.loc.start.column+","+node.loc.end.column+"]")
                }


                console.log(filename, pos, str);
                // console.log('ImportDeclaration Entered!', path.node);
                // console.log("node.specifiers: ",node.specifiers )
                // console.log("source: ",node.source.value)

            },
            VariableDeclaration(path: NodePath<VariableDeclaration>, state: PluginPass) {
                console.log('VariableDeclaration Entered!', path);
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
                            d.init.arguments.forEach(arg=>{
                               if(isNumericLiteral(arg)) {
                                   line += arg.value ;
                               }
                            });

                            line += ")" ;
                        }

                    }
                    line += " ;" ;

                    let pos = "" ;
                    if(path.node.loc){
                        pos += path.node.loc.start.line ;
                        pos += ":"
                        pos += ("["+path.node.loc.start.column+","+path.node.loc.end.column+"]")
                    }
                    console.log(filename,pos,line);
                })

            }
        },
    };
}

