const express = require("express");
const app = express();
app.use("/test", (req, res) => {
  res.json({ route: "test", url: req.url, originalUrl: req.originalUrl });
});
app.use("/{*path}", (req, res) => {
  res.json({ route: "fallback", path: req.path });
});
app.listen(5005, () => console.log("running"));
