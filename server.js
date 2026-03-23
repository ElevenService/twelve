const express = require("express");
const app = express();

app.use(express.json());
app.use(express.static("public"));

let scooters = {}; // ПУСТО — создаёшь сам
let balance = 0;

// СОЗДАТЬ САМОКАТ
app.post("/api/admin/create", (req,res)=>{
  const {id,battery} = req.body;
  scooters[id] = {available:true,battery,inUse:false};
  res.json({success:true});
});

// СПИСОК
app.get("/api/admin/scooters",(req,res)=>{
  res.json(scooters);
});

// ВКЛ/ВЫКЛ
app.post("/api/admin/toggle/:id",(req,res)=>{
  scooters[req.params.id].available = !scooters[req.params.id].available;
  res.json({success:true});
});

// ЗАРЯД
app.post("/api/admin/battery/:id",(req,res)=>{
  scooters[req.params.id].battery = req.body.value;
  res.json({success:true});
});

// ПРОВЕРКА
app.get("/api/scooter/:id",(req,res)=>{
  const s = scooters[req.params.id];
  if(!s) return res.json({error:"Не найден"});
  if(!s.available) return res.json({error:"Самокат недоступен!"});
  if(s.inUse) return res.json({error:"Занят"});
  res.json({id:req.params.id,battery:s.battery});
});

// СТАРТ
app.post("/api/start/:id",(req,res)=>{
  if(balance < 0.10) return res.json({error:"Пополните баланс!"});
  scooters[req.params.id].inUse = true;
  res.json({success:true});
});

// СТОП
app.post("/api/end/:id",(req,res)=>{
  scooters[req.params.id].inUse = false;
  res.json({success:true});
});

// БАЛАНС
app.get("/api/balance",(req,res)=>{
  res.json({balance});
});

// ПОПОЛНЕНИЕ (QR)
app.post("/api/pay",(req,res)=>{
  const code = req.body.code;
  const numbers = code.replace(/\D/g,"");
  if(numbers.length === 1){
    balance += Number(numbers);
  }
  res.json({balance});
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>console.log("SERVER STARTED"));
