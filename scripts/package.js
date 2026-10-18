const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { execFileSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.json"), "utf8"));
const output = path.join(root, "dist");
const files = ["content.css", "content.js", "navigation.js", "settings.js", "popup.html", "popup.css", "popup.js", "icons", "LICENSE", "README.md", "README.en.md"];
fs.mkdirSync(output, { recursive: true });

for (const target of ["chromium", "firefox"]) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "disable-shorts-package-"));
  try {
    for (const filename of files) {
      fs.cpSync(path.join(root, filename), path.join(directory, filename), { recursive: true });
    }
    const settings = structuredClone(manifest);
    if (target === "firefox") {
      delete settings.minimum_chrome_version;
      settings.browser_specific_settings = {
        gecko: {
          id: "disable-shorts@sorried.github.io",
          strict_min_version: "142.0",
          data_collection_permissions: { required: ["none"] },
        },
      };
    }
    fs.writeFileSync(path.join(directory, "manifest.json"), `${JSON.stringify(settings, null, 2)}\n`);
    const archive = path.join(output, `disable-shorts-v${manifest.version}-${target}.zip`);
    fs.rmSync(archive, { force: true });
    execFileSync("zip", ["-q", "-r", archive, "."], { cwd: directory });
    console.log(archive);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}
