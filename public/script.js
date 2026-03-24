let phoneGlobal="";
let current=null;
let interval;

async function login(){
  const phone=document.getElementById("phone").value.trim();
  const error=document.getElementById("error");

  if(!/^\d{12}$/.test(phone)){
    error.innerText="12 цифр!";
    return;
  }

  phoneGlobal=phone;

  await fetch("/api/login",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({phone})
  });

  if(phone==="375295068663"){
    show("admin");
    loadAdmin();
    loadPays();
  }else{
    show("main");
    loadBalance();
  }
}

function show(id){
  ["login","main","admin"].forEach(i=>{
    document.getElementById(i).classList.add("hidden");
  });
  document.getElementById(id).classList.remove("hidden");
}

async function scan(){
  const id=prompt("ID 6 цифр");
  if(!/^\d{6}$/.test(id)) return;

  const r=await fetch("/api/scooter/"+id);
  const d=await r.json();

  if(d.error){alert(d.error);return;}

  if(confirm("Начать поездку?")){
    const s=await fetch("/api/start",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({id,phone:phoneGlobal})
    });

    const res=await s.json();
    if(res.error){alert(res.error);return;}

    startRide(d);
  }
}

function startRide(data){
  current=data.id;

  document.getElementById("endBtn").classList.remove("hidden");

  interval=setInterval(()=>{
    document.getElementById("ride").classList.remove("hidden");
    document.getElementById("ride").innerText=
      `Самокат: ${data.id} | ${data.battery}%`;
  },1000);
}

async function endRide(){
  const r=await fetch("/api/end",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({id:current})
  });

  const d=await r.json();

  clearInterval(interval);

  alert("Стоимость: "+d.cost);

  document.getElementById("ride").classList.add("hidden");
  document.getElementById("endBtn").classList.add("hidden");

  loadBalance();
}

async function loadBalance(){
  const r=await fetch("/api/balance/"+phoneGlobal);
  const d=await r.json();

  document.getElementById("bal").innerText=
    "Баланс: "+d.balance.toFixed(2);
}

async function pay(){
  const code=prompt("Код пополнения");
  if(!code) return;

  const r=await fetch("/api/pay",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({phone:phoneGlobal,code})
  });

  const d=await r.json();
  if(d.error) alert(d.error);

  loadBalance();
}

async function create(){
  const id=document.getElementById("aid").value;
  const bat=document.getElementById("abat").value;

  await fetch("/api/admin/create",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({id,battery:bat})
  });

  loadAdmin();
}

async function loadAdmin(){
  const r=await fetch("/api/admin/scooters");
  const data=await r.json();

  list.innerHTML="";

  for(let id in data){
    list.innerHTML+=`
      <div>
        ${id} (${data[id].battery}%)
        <button onclick="del('${id}')">Удалить</button>
      </div>
    `;
  }
}

async function del(id){
  await fetch("/api/admin/delete/"+id,{method:"POST"});
  loadAdmin();
}

async function createPay(){
  const code=prompt("Код");
  const amount=prompt("Сумма");

  await fetch("/api/admin/payment",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({code,amount})
  });

  loadPays();
}

async function loadPays(){
  const r=await fetch("/api/admin/payments");
  const data=await r.json();

  pays.innerHTML="";

  for(let c in data){
    pays.innerHTML+=`
      <div>${c} = ${data[c].amount}</div>
    `;
  }
}
