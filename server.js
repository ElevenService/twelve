const express = require("express");
const fs = require("fs");

const app = express();

app.use(express.json());
app.use(express.static("public"));

let DB = { scooters:{}, users:{}, rides:{}, payments:{} };

if(fs.existsSync("data.json")){
  DB = JSON.parse(fs.readFileSync("data.json"));
}

function save(){
  fs.writeFileSync("data.json", JSON.stringify(DB,null,2));
}

const validId = id => /^\d{6}$/.test(id);
const validPhone = p => /^\d{12}$/.test(p);

// LOGIN
app.post("/api/login",(req,res)=>{
  const {phone} = req.body;

  if(!validPhone(phone)) return res.json({error:"Неверный номер"});

  if(!DB.users[phone]){
    DB.users[phone] = {balance:0};
    save();
  }

  res.json({success:true});
});

// БАЛАНС
app.get("/api/balance/:phone",(req,res)=>{
  const u = DB.users[req.params.phone];
  res.json({balance: u ? u.balance : 0});
});

// ПОПОЛНЕНИЕ
app.post("/api/pay",(req,res)=>{
  const {phone,code} = req.body;

  const pay = DB.payments[code];

  if(!pay) return res.json({error:"Код неверный"});

  DB.users[phone].balance += pay.amount;

  delete DB.payments[code];
  save();

  res.json({balance: DB.users[phone].balance});
});

// АДМИН КОДЫ
app.post("/api/admin/payment",(req,res)=>{
  const {code,amount} = req.body;

  DB.payments[code] = {amount:Number(amount)};
  save();

  res.json({success:true});
});

app.get("/api/admin/payments",(req,res)=>{
  res.json(DB.payments);
});

// САМОКАТЫ
app.post("/api/admin/create",(req,res)=>{
  const {id,battery} = req.body;

  if(!validId(id)) return res.json({error:"6 цифр"});

  DB.scooters[id] = {
    available:true,
    battery:Number(battery)||100,
    inUse:false
  };

  save();
  res.json({success:true});
});

app.post("/api/admin/delete/:id",(req,res)=>{
  delete DB.scooters[req.params.id];
  save();
  res.json({success:true});
});

app.get("/api/admin/scooters",(req,res)=>{
  res.json(DB.scooters);
});

// ПРОВЕРКА
app.get("/api/scooter/:id",(req,res)=>{
  const s = DB.scooters[req.params.id];

  if(!s) return res.json({error:"Не найден"});
  if(!s.available) return res.json({error:"Недоступен"});
  if(s.inUse) return res.json({error:"Занят"});

  res.json({id:req.params.id,battery:s.battery});
});

// СТАРТ
app.post("/api/start",(req,res)=>{
  const {id,phone} = req.body;

  const s = DB.scooters[id];
  const u = DB.users[phone];

  if(!s || !u) return res.json({error:"Ошибка"});
  if(u.balance < 0.10) return res.json({error:"Нет денег"});
  if(s.inUse) return res.json({error:"Занят"});

  s.inUse = true;

  DB.rides[id] = {
    phone,
    start: Date.now()
  };

  save();
  res.json({success:true});
});

// СТОП
app.post("/api/end",(req,res)=>{
  const {id} = req.body;

  const ride = DB.rides[id];
  if(!ride) return res.json({error:"Нет поездки"});

  const minutes = Math.max(1, Math.floor((Date.now()-ride.start)/60000));
  const cost = minutes * 0.10;

  DB.users[ride.phone].balance -= cost;
  if(DB.users[ride.phone].balance < 0)
    DB.users[ride.phone].balance = 0;

  DB.scooters[id].inUse = false;

  delete DB.rides[id];

  save();
  res.json({cost});
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>console.log("SERVER STARTED"));
