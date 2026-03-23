let current = null;
let interval;

// LOGIN
function login(){
  const p = document.getElementById("phone").value;

  if(!p){
    error.innerText="Введите номер";
    return;
  }

  if(p==="37529506866312"){
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

// СКАН (упрощённо без краша)
async function scan(){
  const id = prompt("Введите 6 цифр");
  if(!id) return;

  const r = await fetch("/api/scooter/"+id);
  const d = await r.json();

  if(d.error){
    alert(d.error);
    return;
  }

  if(confirm("Начать поездку?")){
    const s = await fetch("/api/start/"+id,{method:"POST"});
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

async function endRide(){
  const r = await fetch("/api/end/"+current,{method:"POST"});
  const d = await r.json();

  clearInterval(interval);

  alert("Стоимость: "+d.cost);

  document.getElementById("ride").classList.add("hidden");
  document.getElementById("endBtn").classList.add("hidden");

  loadBalance();
}

// БАЛАНС
async function loadBalance(){
  const r = await fetch("/api/balance");
  const d = await r.json();
  document.getElementById("bal").innerText="Баланс: "+d.balance;
}

// ОПЛАТА
async function pay(){
  const code = prompt("Введите QR код");
  if(!code) return;

  const r = await fetch("/api/pay",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({code})
  });

  const d = await r.json();
  loadBalance();
}

// АДМИН
async function create(){
  const id = aid.value;
  const bat = abat.value;

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
