const express = require("express");
const app = express();

// Главная страница
app.get("/", (req, res) => {
  res.send(`
    <h1 style="text-align:center; margin-top:50px;">
      Twelve работает 🚀
    </h1>
  `);
});

// ВАЖНО ДЛЯ RENDER
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("SERVER STARTED on " + PORT);
});
