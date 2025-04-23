import { Project, Symbol, SyntaxKind } from "ts-morph";

const project = new Project({ tsConfigFilePath: "tsconfig.json" });
const graph: Record<string, string[]> = {};

project.getSourceFiles().forEach((sf) => {
  sf.getFunctions().forEach((fn) => {
    const id = fn.getName() ?? "<anonymous>";
    graph[id] = [];
    fn.getDescendantsOfKind(SyntaxKind.CallExpression).forEach((call) => {
      const targetSym: Symbol | undefined = call.getSymbol();
      if (targetSym) graph[id].push(targetSym.getName());
    });
  });
});
