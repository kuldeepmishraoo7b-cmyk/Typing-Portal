// afterPack.js
// electron-builder's "filter" option for extraResources isn't reliably
// copying node_modules in this project's setup (confirmed via debug log —
// the copy step ran with no errors, but node_modules was still missing
// from the output). This hook bypasses electron-builder's file filtering
// entirely and does a plain recursive copy right after packaging finishes.

const fs = require("fs-extra");
const path = require("path");

module.exports = async function (context) {
  const source = path.join(__dirname, "..", "backend", "node_modules");
  const dest = path.join(
    context.appOutDir,
    "resources",
    "backend",
    "node_modules"
  );

  console.log("[afterPack] Copying backend node_modules...");
  console.log("[afterPack] from:", source);
  console.log("[afterPack] to:  ", dest);

  if (!(await fs.pathExists(source))) {
    throw new Error(
      `[afterPack] Source node_modules not found at ${source}. Run "npm install" inside your backend folder first.`
    );
  }

  await fs.copy(source, dest);
  console.log("[afterPack] Done copying backend node_modules.");
};
