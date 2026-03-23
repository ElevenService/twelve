let phoneGlobal = "";
let current = null;
let interval;

// LOGIN
async function login(){
  const phone = document.getElementById("phone").value.trim();
  const error = document.getElementById("error");

  if(!phone){
    error.innerText="Введите номер!";
    return;
  }

  if(!/^\d{12}$/.test(phone)){
    error.innerText="12 цифр!";
    return;
  }

  phoneGlobal = phone;

  const res = await fetch("/api/login",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({phone})
  });

  const data = await res.json();

  if(data.error){
    error.innerText=data.error;
    return;
  }

  if(phone==="375295068663"){
    show("admin");
    loadAdmin();
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

// СКАН (упрощённый)
async function scan(){
  const id = prompt("Введите 6 цифр");

  if(!/^\d{6}$/.test(id)) return;

  const r = await fetch("/api/scooter/"+id);
  const d = await r.json();

  if(d.error){
    alert(d.error);
    return;
  }

  if(confirm("Начать поездку?")){
    const s = await fetch("/api/start",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({id,phone:phoneGlobal})
    });

    const res = await s.json();

    if(res.error){
      alert(res.error);
      return;
    }

    startRide(d);
  }
}

function startRide(data){
  current = data.id;

  document.getElementById("endBtn").classList.remove("hidden");

  interval = setInterval(()=>{
    document.getElementById("ride").classList.remove("hidden");
    document.getElementById("ride").innerText =
      "Самокат: "+data.id+" | "+data.battery+"%";
  },1000);
}

// СТОП
async function endRide(){
  const r = await fetch("/api/end",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({id:current})
  });

  const d = await r.json();

  clearInterval(interval);

  alert("Стоимость: "+d.cost);

  document.getElementById("ride").classList.add("hidden");
  document.getElementById("endBtn").classList.add("hidden");

  loadBalance();
}

// БАЛАНС
async function loadBalance(){
  const r = await fetch("/api/balance/"+phoneGlobal);
  const d = await r.json();

  document.getElementById("bal").innerText =
    "Баланс: "+d.balance.toFixed(2);
}

// ОПЛАТА
async function pay(){
  const code = prompt("Введите QR код (1 цифра)");

  if(!code) return;

  await fetch("/api/pay",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({phone:phoneGlobal,code})
  });

  loadBalance();
}

// АДМИН
async function create(){
  const id = document.getElementById("aid").value;
  const bat = document.getElementById("abat").value;

  await fetch("/api/admin/create",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({id,battery:bat})
  });

  loadAdmin();
}

async function loadAdmin(){
  const r = await fetch("/api/admin/scooters");
  const data = await r.json();

  const list = document.getElementById("list");
  list.innerHTML="";

  for(let id in data){
    const div = document.createElement("div");

    div.innerHTML=`
      ${id} (${data[id].battery}%)
      <button onclick="del('${id}')">Удалить</button>
    `;

    list.appendChild(div);
  }
}

async function del(id){
  await fetch("/api/admin/delete/"+id,{method:"POST"});
  loadAdmin();
}
