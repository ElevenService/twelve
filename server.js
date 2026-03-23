const express = require("express");
const app = express();

app.use(express.json());
app.use(express.static("public"));

let scooters = {};
let users = {};
let rides = {};

// ===== ПРОВЕРКИ =====
function validId(id){
  return /^\d{6}$/.test(id);
}

function validPhone(phone){
  return /^\d{12}$/.test(phone);
}

// ===== LOGIN =====
app.post("/api/login",(req,res)=>{
  const {phone} = req.body;

  if(!validPhone(phone)){
    return res.json({error:"Неверный номер"});
  }

  if(!users[phone]){
    users[phone] = {balance:0};
  }

  res.json({success:true});
});

// ===== БАЛАНС =====
app.get("/api/balance/:phone",(req,res)=>{
  const u = users[req.params.phone];
  res.json({balance: u ? u.balance : 0});
});

// ===== ПОПОЛНЕНИЕ =====
app.post("/api/pay",(req,res)=>{
  const {phone,code} = req.body;

  const num = code.replace(/\D/g,"");

  if(num.length === 1){
    users[phone].balance += Number(num);
  }

  res.json({balance: users[phone].balance});
});

// ===== САМОКАТЫ =====

// создать
app.post("/api/admin/create",(req,res)=>{
  const {id,battery} = req.body;

  if(!validId(id)) return res.json({error:"ID = 6 цифр"});
  if(scooters[id]) return res.json({error:"Уже есть"});

  scooters[id] = {
    available:true,
    battery:Number(battery)||100,
    inUse:false
  };

  res.json({success:true});
});

// удалить
app.post("/api/admin/delete/:id",(req,res)=>{
  delete scooters[req.params.id];
  res.json({success:true});
});

// список
app.get("/api/admin/scooters",(req,res)=>{
  res.json(scooters);
});

// проверка
app.get("/api/scooter/:id",(req,res)=>{
  const s = scooters[req.params.id];

  if(!s) return res.json({error:"Не найден"});
  if(!s.available) return res.json({error:"Недоступен"});
  if(s.inUse) return res.json({error:"Занят"});

  res.json({id:req.params.id,battery:s.battery});
});

// старт
app.post("/api/start",(req,res)=>{
  const {id,phone} = req.body;

  const s = scooters[id];
  const u = users[phone];

  if(!s) return res.json({error:"Нет самоката"});
  if(!u) return res.json({error:"Нет пользователя"});
  if(u.balance < 0.10) return res.json({error:"Пополните баланс"});
  if(s.inUse) return res.json({error:"Занят"});

  s.inUse = true;

  rides[id] = {
    phone,
    start: Date.now()
  };

  res.json({success:true});
});

// стоп
app.post("/api/end",(req,res)=>{
  const {id} = req.body;

  const ride = rides[id];
  if(!ride) return res.json({error:"Нет поездки"});

  const minutes = Math.max(1, Math.floor((Date.now()-ride.start)/60000));
  const cost = minutes * 0.10;

  users[ride.phone].balance -= cost;
  if(users[ride.phone].balance < 0) users[ride.phone].balance = 0;

  scooters[id].inUse = false;
  delete rides[id];

  res.json({cost});
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>console.log("SERVER STARTED"));
