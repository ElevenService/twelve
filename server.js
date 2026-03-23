const express = require("express");
const app = express();

app.use(express.json());
app.use(express.static("public"));

// "БАЗА"
let scooters = {
  "123456": { available: true, battery: 80 },
  "654321": { available: true, battery: 60 }
};

// ПРОВЕРКА САМОКАТА
app.get("/api/scooter/:id", (req, res) => {
  const id = req.params.id;
  const s = scooters[id];

  if (!s) return res.json({ error: "Не найден" });
  if (!s.available) return res.json({ error: "Самокат недоступен!" });

  res.json({ id, battery: s.battery });
});

// АДМИН
app.get("/api/admin/scooters", (req, res) => {
  res.json(scooters);
});

app.post("/api/admin/toggle/:id", (req, res) => {
  const id = req.params.id;
  scooters[id].available = !scooters[id].available;
  res.json({ success: true });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log("SERVER STARTED"));
