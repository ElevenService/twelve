const express = require("express");
const app = express();

app.use(express.json());
app.use(express.static("public"));

// ДАННЫЕ
let scooters = {};
let balance = 0;
let rides = {};

// ===== УТИЛИТЫ =====
function validId(id){
  return typeof id === "string" && /^\d{6}$/.test(id);
}

// ===== АДМИН =====

// создать самокат
app.post("/api/admin/create", (req,res)=>{
  try{
    const {id,battery} = req.body;

    if(!validId(id)){
      return res.json({error:"ID должен быть 6 цифр"});
    }

    if(scooters[id]){
      return res.json({error:"Уже существует"});
    }

    scooters[id] = {
      available:true,
      battery: Number(battery) || 100,
      inUse:false
    };

    res.json({success:true});
  }catch(e){
    res.json({error:"Ошибка сервера"});
  }
});

// удалить
app.post("/api/admin/delete/:id",(req,res)=>{
  try{
    const id = req.params.id;
    if(!scooters[id]) return res.json({error:"Нет такого"});
    delete scooters[id];
    res.json({success:true});
  }catch{
    res.json({error:"Ошибка"});
  }
});

// список
app.get("/api/admin/scooters",(req,res)=>{
  res.json(scooters);
});

// включить/выключить
app.post("/api/admin/toggle/:id",(req,res)=>{
  try{
    const id = req.params.id;
    if(!scooters[id]) return res.json({error:"Нет такого"});
    scooters[id].available = !scooters[id].available;
    res.json({success:true});
  }catch{
    res.json({error:"Ошибка"});
  }
});

// ===== ПОЛЬЗОВАТЕЛЬ =====

// проверка самоката
app.get("/api/scooter/:id",(req,res)=>{
  const id = req.params.id;

  if(!validId(id)) return res.json({error:"Неверный код"});

  const s = scooters[id];

  if(!s) return res.json({error:"Самокат не найден"});
  if(!s.available) return res.json({error:"Самокат отключён"});
  if(s.inUse) return res.json({error:"Уже в аренде"});

  res.json({id,battery:s.battery});
});

// старт поездки
app.post("/api/start/:id",(req,res)=>{
  try{
    const id = req.params.id;

    if(!scooters[id]) return res.json({error:"Нет самоката"});
    if(balance < 0.10) return res.json({error:"Недостаточно средств"});
    if(scooters[id].inUse) return res.json({error:"Уже занят"});

    scooters[id].inUse = true;

    rides[id] = {
      start: Date.now()
    };

    res.json({success:true});
  }catch{
    res.json({error:"Ошибка"});
  }
});

// завершение
app.post("/api/end/:id",(req,res)=>{
  try{
    const id = req.params.id;

    if(!rides[id]) return res.json({error:"Нет поездки"});

    const minutes = Math.max(1, Math.floor((Date.now() - rides[id].start)/60000));
    const cost = minutes * 0.10;

    balance -= cost;
    if(balance < 0) balance = 0;

    scooters[id].inUse = false;
    delete rides[id];

    res.json({minutes,cost,balance});
  }catch{
    res.json({error:"Ошибка"});
  }
});

// баланс
app.get("/api/balance",(req,res)=>{
  res.json({balance});
});

// пополнение (QR)
app.post("/api/pay",(req,res)=>{
  try{
    const code = req.body.code || "";
    const num = code.replace(/\D/g,"");

    if(num.length === 1){
      balance += Number(num);
    }

    res.json({balance});
  }catch{
    res.json({error:"Ошибка"});
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>console.log("SERVER STARTED"));
