import { cp, mkdir, rm } from "node:fs/promises";
import { dirname, join } from "node:path";

const repositoryRoot = import.meta.dir;
const frontendDirectory = join(repositoryRoot, "frontend");
const outputDirectory = join(repositoryRoot, "static");

process.chdir(frontendDirectory);

await rm(outputDirectory, { recursive: true, force: true });

const htmlEntrypoints = Array.from(
  new Bun.Glob("**/*.html").scanSync({ cwd: frontendDirectory }),
).sort();

const result = await Bun.build({
  entrypoints: [...htmlEntrypoints, "sw.js"],
  outdir: outputDirectory,
  root: frontendDirectory,
  minify: true,
  naming: {
    entry: "[dir]/[name].[ext]",
    chunk: "[dir]/[name]-[hash].[ext]",
    asset: "[dir]/[name].[ext]",
  },
});

if (!result.success) {
  for (const log of result.logs) {
    console.error(log);
  }
  process.exit(1);
}

// ========================================
// the open graph image is copied by hand, not by the bundler.
//
// bun tracks an asset only when a LINK tag references it, and the only
// rels it follows are "icon" and "apple-touch-icon". the og image is
// referenced by META tags (og:image, twitter:image), which the bundler
// does not look at, so the file would never reach the output folder.
//
// it is copied here under its exact path because the meta tags point at
// that path — a hashed name would break every crawler that reads them.
// ========================================
const openGraphImage = "lib/img/og-1200x630.png";
const openGraphImageOutput = join(outputDirectory, openGraphImage);

await mkdir(dirname(openGraphImageOutput), { recursive: true });
await cp(join(frontendDirectory, openGraphImage), openGraphImageOutput);

// ========================================
// the llms.txt is copied by hand too, and it lives in the FRONTEND folder.
//
// the SOURCE is `llm.md` — markdown, so it reads and edits like the rest
// of the docs. the SERVED file is `llms.txt` — that is the name the
// convention asks for, and that is the path the static server answers.
//
// the copy is copied by hand for the same reason the og image is: the
// bundler only tracks an asset when a LINK tag references it, and nothing
// in the app links to llms.txt.
//
// the copy lands at the ROOT of the output folder, so the static server
// answers it at /llms.txt.
// ========================================
const llmMd = "llm.md";
const llmsTxt = "llms.txt";
const llmsTxtOutput = join(outputDirectory, llmsTxt);

await cp(join(frontendDirectory, llmMd), llmsTxtOutput);

console.log(`Built ${result.outputs.length} files into ${outputDirectory}`);
