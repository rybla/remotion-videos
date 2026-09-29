// render.ts
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import path from "path";

async function main() {
  const entryPoint = path.resolve("./src/remotion/index.ts");
  const compositionId = "SteamEngine";

  // 1. Bundle the Remotion project using Webpack
  console.log("Bundling...");
  const bundleLocation = await bundle({
    entryPoint,
    webpackOverride: (config) => config,
  });

  // 2. Fetch composition metadata (fps, duration, dimensions)
  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: compositionId,
    inputProps: {},
  });

  // 3. Render frames and stitch into an MP4 file
  console.log("Rendering MP4...");
  await renderMedia({
    composition,
    serveUrl: bundleLocation,
    codec: "h264", // Encodes to MP4 format
    outputLocation: path.resolve("video.mp4"),
    inputProps: {},
  });

  console.log("Render complete!");
}

main().catch(console.error);
