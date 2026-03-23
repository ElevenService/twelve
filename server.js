const express = require("express");
const app = express();

app.use(express.json());
app.use(express.static("public"));

let scooters = {}; // создаёшь сам
let balance = 0;
let rides = {}; // активные поездки

// СОЗДАТЬ САМОКАТ
app.post("/api/admin/create", (req,res)=>{
  const {id,battery} = req.body;

  if(!id || id.length !== 6){
    return res.json({error:"ID = 6 цифр"});
  }

  scooters[id] = {
    available:true,
    battery:Number(battery)||100,
    inUse:false
  };

  res.json({success:true});
});

// УДАЛИТЬ
app.post("/api/admin/delete/:id",(req,res)=>{
  delete scooters[req.params.id];
  res.json({success:true});
});

// СПИСОК
app.get("/api/admin/scooters",(req,res)=>{
  res.json(scooters);
});

// ВКЛ/ВЫКЛ
app.post("/api/admin/toggle/:id",(req,res)=>{
  scooters[req.params.id].available =
    !scooters[req.params.id].available;
  res.json({success:true});
});

// ПРОВЕРКА ПЕРЕД ПОЕЗДКОЙ
app.get("/api/scooter/:id",(req,res)=>{
  const s = scooters[req.params.id];

  if(!s) return res.json({error:"Не найден"});
  if(!s.available) return res.json({error:"Самокат недоступен"});
  if(s.inUse) return res.json({error:"Уже занят"});

  res.json({id:req.params.id,battery:s.battery});
});

// СТАРТ
app.post("/api/start/:id",(req,res)=>{
  const id = req.params.id;

  if(balance < 0.10)
    return res.json({error:"Пополните баланс!"});

  scooters[id].inUse = true;

  rides[id] = {
    start: Date.now()
  };

  res.json({success:true});
});

// СТОП
app.post("/api/end/:id",(req,res)=>{
  const id = req.params.id;

  if(!rides[id]) return res.json({error:"Нет поездки"});

  const time = Math.floor((Date.now() - rides[id].start)/60000);
  const cost = time * 0.10;

  balance -= cost;

  scooters[id].inUse = false;
  delete rides[id];

  res.json({time,cost,balance});
});

// БАЛАНС
app.get("/api/balance",(req,res)=>{
  res.json({balance});
});

// ПОПОЛНЕНИЕ QR
app.post("/api/pay",(req,res)=>{
  const code = req.body.code;
  const num = code.replace(/\D/g,"");

  if(num.length===1){
    balance += Number(num);
  }

  res.json({balance});
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>console.log("SERVER STARTED"));
