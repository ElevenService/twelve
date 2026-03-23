let current = null;
let timer = 0;
let interval;
let qr;

// LOGIN
function login(){
  const p = phone.value;

  if(!p){
    error.innerText="Введите номер!";
    return;
  }

  if(p==="37529506866312"){
    show("admin");
    load();
  } else {
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

// QR
function openScanner(admin=false){
  scanner.classList.remove("hidden");

  qr = new Html5Qrcode("reader");

  qr.start({facingMode:"environment"},{},text=>{
    qr.stop();
    scanner.classList.add("hidden");

    const id = text.replace(/\D/g,"");

    if(id.length!==6) return;

    if(admin){
      create(id);
    } else {
      startFlow(id);
    }
  });
}

// ПОЕЗДКА
async function startFlow(id){
  const res = await fetch("/api/scooter/"+id);
  const data = await res.json();

  if(data.error){
    alert(data.error);
    return;
  }

  if(confirm("Начать поездку?")){
    const r = await fetch("/api/start/"+id,{method:"POST"});
    const d = await r.json();

    if(d.error){
      alert(d.error);
      return;
    }

    current = id;
    startRide(data);
  }
}

function startRide(data){
  timer=0;

  ride.classList.remove("hidden");
  document.querySelector(".end").classList.remove("hidden");

  interval=setInterval(()=>{
    timer++;
    ride.innerHTML=`
      Самокат: ${data.id}<br>
      Заряд: ${data.battery}%<br>
      Время: ${timer} сек
    `;
  },1000);
}

async function endRide(){
  const res = await fetch("/api/end/"+current,{method:"POST"});
  const data = await res.json();

  clearInterval(interval);

  alert("Стоимость: "+data.cost+" BYN");

  ride.classList.add("hidden");
  document.querySelector(".end").classList.add("hidden");

  loadBalance();
}

// БАЛАНС
async function loadBalance(){
  const r = await fetch("/api/balance");
  const d = await r.json();
  balance.innerText="Баланс: "+d.balance;
}

// ОПЛАТА
function openPay(){
  openScanner();
}

// АДМИН
async function create(idQR){
  const id = idQR || document.getElementById("id").value;
  const bat = document.getElementById("bat").value;

  await fetch("/api/admin/create",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({id,battery:bat})
  });

  load();
}

async function load(){
  const r = await fetch("/api/admin/scooters");
  const data = await r.json();

  list.innerHTML="";

  for(let id in data){
    const s = data[id];

    const div=document.createElement("div");

    div.innerHTML=`
      ${id}<br>
      ${s.battery}%<br>

      <button onclick="toggle('${id}')">Вкл/Выкл</button>
      <button onclick="del('${id}')">Удалить</button>
    `;

    list.appendChild(div);
  }
}

async function toggle(id){
  await fetch("/api/admin/toggle/"+id,{method:"POST"});
  load();
}

async function del(id){
  await fetch("/api/admin/delete/"+id,{method:"POST"});
  load();
}
