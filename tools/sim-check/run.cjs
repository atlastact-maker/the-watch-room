// Run the pure simulation checks with the project's installed TypeScript.
// No downloads, generated bundles or application server required.
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");
const root = path.resolve(__dirname, "../..");
const resolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...args) {
  return resolve.call(this, request.startsWith("@/") ? path.join(root, "src", request.slice(2)) : request, ...args);
};
require.extensions[".ts"] = function (module, filename) {
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    fileName: filename,
  });
  module._compile(outputText, filename);
};
// Some existing checks call process.exit, so run one check per process.
const [name, ...extra] = process.argv.slice(2);
if (!name || extra.length || !/^[a-z]+$/.test(name)) {
  throw new Error("Usage: node tools/sim-check/run.cjs <check-name>");
}
require(path.join(__dirname, name + ".ts"));
