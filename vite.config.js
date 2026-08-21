import { defineConfig } from "vite";

// CaricatureImages/ is served as-is at the site root (so a manifest entry
// like "People/Barack_Obama.jpg" resolves to /People/Barack_Obama.jpg).
export default defineConfig({
  publicDir: "CaricatureImages",
});
