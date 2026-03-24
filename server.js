const express = require("express");
const fs = require("fs");

const app = express();
app.use(express.json());
app.use(express.static("public"));

const DB_FILE = "data.json";

// ===== БАЗА =====
let DB = {
  scooters: {},
  users: {},
  rides: {},
  payments: {}
};

// ===== ЗАГРУЗКА =====
try {
  if (fs.existsSync(DB_FILE)) {
    const data = fs.readFileSync(DB_FILE, "utf-8");
    if (data) {
      DB = JSON.parse(data);
    }
  }
} catch (e) {
  console.log("Ошибка чтения базы, создаю новую");
}

// ===== СОХРАНЕНИЕ =====
function save() {
  fs.writeFileSync(DB_FILE, JSON.stringify(DB, null, 2));
}

// ===== ПРОВЕРКИ =====
const validId = (id) => /^\d{6}$/.test(id);
const validPhone = (p) => /^\d{12}$/.test(p);

// ===== LOGIN =====
app.post("/api/login", (req, res) => {
  const { phone } = req.body;

  if (!validPhone(phone)) {
    return res.json({ error: "Неверный номер" });
  }

  if (!DB.users[phone]) {
    DB.users[phone] = { balance: 0 };
    save();
  }

  res.json({ success: true });
});

// ===== БАЛАНС =====
app.get("/api/balance/:phone", (req, res) => {
  const user = DB.users[req.params.phone];
  res.json({ balance: user ? user.balance : 0 });
});

// ===== ПОПОЛНЕНИЕ =====
app.post("/api/pay", (req, res) => {
  const { phone, code } = req.body;

  if (!DB.users[phone]) {
    return res.json({ error: "Нет пользователя" });
  }

  const pay = DB.payments[code];

  if (!pay) {
    return res.json({ error: "Код неверный" });
  }

  DB.users[phone].balance += Number(pay.amount);

  delete DB.payments[code];

  save();

  res.json({ success: true });
});

// ===== АДМИН: КОДЫ =====
app.post("/api/admin/payment", (req, res) => {
  const { code, amount } = req.body;

  if (!code || !amount) {
    return res.json({ error: "Пустые поля" });
  }

  DB.payments[code] = {
    amount: Number(amount)
  };

  save();

  res.json({ success: true });
});

app.get("/api/admin/payments", (req, res) => {
  res.json(DB.payments);
});

// ===== САМОКАТЫ =====
app.post("/api/admin/create", (req, res) => {
  const { id, battery } = req.body;

  if (!validId(id)) {
    return res.json({ error: "ID должен быть 6 цифр" });
  }

  DB.scooters[id] = {
    available: true,
    battery: Number(battery) || 100,
    inUse: false
  };

  save();

  res.json({ success: true });
});

app.post("/api/admin/delete/:id", (req, res) => {
  delete DB.scooters[req.params.id];
  save();
  res.json({ success: true });
});

app.get("/api/admin/scooters", (req, res) => {
  res.json(DB.scooters);
});

// ===== ПРОВЕРКА САМОКАТА =====
app.get("/api/scooter/:id", (req, res) => {
  const s = DB.scooters[req.params.id];

  if (!s) return res.json({ error: "Самокат не найден" });
  if (!s.available) return res.json({ error: "Недоступен" });
  if (s.inUse) return res.json({ error: "Уже используется" });

  res.json({
    id: req.params.id,
    battery: s.battery
  });
});

// ===== СТАРТ ПОЕЗДКИ =====
app.post("/api/start", (req, res) => {
  const { id, phone } = req.body;

  const s = DB.scooters[id];
  const u = DB.users[phone];

  if (!s) return res.json({ error: "Нет самоката" });
  if (!u) return res.json({ error: "Нет пользователя" });
  if (u.balance < 0.10) return res.json({ error: "Недостаточно средств" });
  if (s.inUse) return res.json({ error: "Самокат занят" });

  s.inUse = true;

  DB.rides[id] = {
    phone,
    start: Date.now()
  };

  save();

  res.json({ success: true });
});

// ===== ЗАВЕРШЕНИЕ =====
app.post("/api/end", (req, res) => {
  const { id } = req.body;

  const ride = DB.rides[id];

  if (!ride) return res.json({ error: "Нет поездки" });

  const minutes = Math.max(
    1,
    Math.floor((Date.now() - ride.start) / 60000)
  );

  const cost = minutes * 0.10;

  DB.users[ride.phone].balance -= cost;

  if (DB.users[ride.phone].balance < 0) {
    DB.users[ride.phone].balance = 0;
  }

  DB.scooters[id].inUse = false;

  delete DB.rides[id];

  save();

  res.json({ cost });
});

// ===== ЗАПУСК =====
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("SERVER STARTED");
});
