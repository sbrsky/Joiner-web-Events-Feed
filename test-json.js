const express = require("express");
const app = express();
app.get("/test", (req, res) => {
  res.json("<!DOCTYPE html><html></html>");
});
app.listen(5005, () => console.log("running"));
