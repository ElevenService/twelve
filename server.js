const express = require("express");
const app = express();

app.use(express.json());
app.use(express.static("public"));

let scooters = {}; // ПУСТО

// СОЗДАТЬ
app.post("/api/admin/create", (req,res)=>{
  const {id,battery} = req.body;

  if(!id || id.length !== 6){
    return res.json({error:"ID должен быть 6 цифр"});
  }

  scooters[id] = {
    available:true,
    battery:Number(battery) || 100,
    inUse:false
  };

  res.json({success:true});
});

// ВСЕ
app.get("/api/admin/scooters",(req,res)=>{
  res.json(scooters);
});

// УДАЛИТЬ
app.post("/api/admin/delete/:id",(req,res)=>{
  delete scooters[req.params.id];
  res.json({success:true});
});

// ВКЛ/ВЫКЛ
app.post("/api/admin/toggle/:id",(req,res)=>{
  scooters[req.params.id].available = !scooters[req.params.id].available;
  res.json({success:true});
});

// ПРОВЕРКА
app.get("/api/scooter/:id",(req,res)=>{
  const s = scooters[req.params.id];

  if(!s) return res.json({error:"Не найден"});
  if(!s.available) return res.json({error:"Самокат недоступен!"});
  if(s.inUse) return res.json({error:"Уже занят"});

  res.json({id:req.params.id,battery:s.battery});
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>console.log("SERVER STARTED"));
