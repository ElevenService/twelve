let current = null;
let html5QrCode;

function login(){
  const p = document.getElementById("phone").value;

  if(!p){
    document.getElementById("error").innerText="Введите номер!";
    return;
  }

  if(p==="37529506866312"){
    show("admin");
    loadAdmin();
  } else {
    show("main");
  }
}

function show(id){
  ["login","main","admin"].forEach(i=>{
    document.getElementById(i).classList.add("hidden");
  });
  document.getElementById(id).classList.remove("hidden");
}

// 📷 СКАНЕР
function openScanner(){
  document.getElementById("scanner").classList.remove("hidden");

  html5QrCode = new Html5Qrcode("reader");
  html5QrCode.start(
    { facingMode: "environment" },
    {},
    onScan
  );
}

async function onScan(text){
  html5QrCode.stop();
  document.getElementById("scanner").classList.add("hidden");

  const numbers = text.replace(/\D/g,"");

  if(numbers.length !== 6) return;

  const res = await fetch("/api/scooter/"+numbers);
  const data = await res.json();

  if(data.error){
    alert(data.error);
    return;
  }

  current = numbers;

  if(confirm("Начать поездку?")){
    const r = await fetch("/api/start/"+numbers,{method:"POST"});
    const d = await r.json();

    if(d.error){
      alert(d.error);
      return;
    }

    document.getElementById("ride").innerHTML =
      "Самокат: "+numbers+" | Заряд: "+data.battery+"%";
  }
}

// ЗАВЕРШЕНИЕ
async function endRide(){
  if(!current) return;
  await fetch("/api/end/"+current,{method:"POST"});
  document.getElementById("ride").innerHTML="";
}

// 💰 ОПЛАТА
function openPay(){
  openScanner();
}

async function createScooter(){
  const id=document.getElementById("newId").value;
  const battery=document.getElementById("newBat").value;

  await fetch("/api/admin/create",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({id,battery})
  });

  loadAdmin();
}

async function loadAdmin(){
  const res=await fetch("/api/admin/scooters");
  const data=await res.json();

  const list=document.getElementById("list");
  list.innerHTML="";

  for(let id in data){
    const s=data[id];

    const div=document.createElement("div");

    div.innerHTML=`
      <h3>${id}</h3>
      <p>${s.available?"На линии":"Не на линии"}</p>
      <p>${s.battery}%</p>

      <button onclick="toggle('${id}')">
        ${s.available?"Снять":"Вернуть"}
      </button>
    `;

    list.appendChild(div);
  }
}

async function toggle(id){
  await fetch("/api/admin/toggle/"+id,{method:"POST"});
  loadAdmin();
}
