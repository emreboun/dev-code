// tools/analyse.ts
import { Project, SyntaxKind, CallExpression } from "ts-morph";
import { writeFileSync } from "node:fs";
import { cruise, IReporterOutput } from "dependency-cruiser";

async function main() {
  const project = new Project({ tsConfigFilePath: "tsconfig.json" });
  const funcGraph: Record<string, Set<string>> = {};

  for (const sf of project.getSourceFiles()) {
    for (const fn of sf.getFunctions()) {
      const name =
        fn.getName() ?? `${sf.getBaseName()}#${fn.getStartLineNumber()}`;
      funcGraph[name] = new Set();
      fn.forEachDescendant((d) => {
        if (d.getKind() === SyntaxKind.CallExpression) {
          const callExpr = d as CallExpression;
          const sym = callExpr.getExpression().getSymbol();
          if (sym) funcGraph[name].add(sym.getName());
        }
      });
    }
  }

  // flatten sets
  const funcEdges = Object.entries(funcGraph).flatMap(([from, tos]) =>
    [...tos].map((to) => ({ from, to, label: "calls" }))
  );

  interface Module {
    source: string;
    dependencies: Array<{ resolved: string }>;
  }

  const cruiseResult = await cruise(["src"], { outputType: "json" });
  const cruiseOutput = cruiseResult as unknown as { output: string };
  const importEdges = JSON.parse(cruiseOutput.output).modules.flatMap(
    (m: Module) =>
      m.dependencies.map((d: { resolved: string }) => ({
        from: m.source,
        to: d.resolved,
        label: "imports",
      }))
  );

  writeFileSync(
    "graph.json",
    JSON.stringify(
      { nodes: [], edges: [...funcEdges, ...importEdges] },
      null,
      2
    )
  );
  console.log("Graph written to graph.json");
}

main().catch(console.error);
