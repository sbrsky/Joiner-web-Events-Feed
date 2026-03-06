import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath = path.resolve(process.cwd(), "dist", "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // serve the index.html with injected environment variables for the client
  app.use("/{*path}", async (req, res) => {
    const indexPath = path.resolve(distPath, "index.html");
    if (!fs.existsSync(indexPath)) {
      return res.status(404).send("Not found");
    }

    try {
      let html = await fs.promises.readFile(indexPath, "utf-8");

      // Inject runtime environment variables that the client needs
      const env = {
        VITE_BRANCH_KEY: process.env.VITE_BRANCH_KEY || process.env.BRANCH_KEY,
        VITE_BRANCH_LINK_DOMAIN: process.env.VITE_BRANCH_LINK_DOMAIN || process.env.BRANCH_LINK_DOMAIN,
        VITE_FIREBASE_API_KEY: process.env.VITE_FIREBASE_API_KEY,
        VITE_FIREBASE_AUTH_DOMAIN: process.env.VITE_FIREBASE_AUTH_DOMAIN,
        VITE_FIREBASE_PROJECT_ID: process.env.VITE_FIREBASE_PROJECT_ID,
        VITE_FIREBASE_APP_ID: process.env.VITE_FIREBASE_APP_ID,
      };

      const envScript = `
        <script>
          window.ENV = ${JSON.stringify(env)};
        </script>
      `;

      html = html.replace("</head>", `${envScript}</head>`);
      res.setHeader("Content-Type", "text/html");
      res.send(html);
    } catch (e) {
      console.error("Error serving index.html:", e);
      res.status(500).send("Internal Server Error");
    }
  });
}
