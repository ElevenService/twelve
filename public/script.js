let html5QrCode;

function login(){
  const p = document.getElementById("phone").value;

  if(!p){
    document.getElementById("error").innerText="Введите номер!";
    return;
  }

  if(p==="37529506866312"){
    show("admin");
    load();
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

// СКАНЕР
function openScanner(isAdmin=false){
  document.getElementById("scanner").classList.remove("hidden");

  html5QrCode = new Html5Qrcode("reader");

  html5QrCode.start(
    {facingMode:"environment"},
    {},
    (text)=>{
      html5QrCode.stop();
      document.getElementById("scanner").classList.add("hidden");

      const id = text.replace(/\D/g,"");

      if(id.length !== 6) return;

      if(isAdmin){
        create(id);
      } else {
        alert("Самокат: "+id);
      }
    }
  );
}

// СОЗДАТЬ
async function create(idFromQR){
  const id = idFromQR || document.getElementById("id").value;
  const battery = document.getElementById("bat").value || 100;

  await fetch("/api/admin/create",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({id,battery})
  });

  load();
}

// СПИСОК
async function load(){
  const res = await fetch("/api/admin/scooters");
  const data = await res.json();

  const list = document.getElementById("list");
  list.innerHTML="";

  for(let id in data){
    const s = data[id];

    const div = document.createElement("div");

    div.innerHTML = `
      <h3>${id}</h3>
      <p>${s.available?"🟢 На линии":"🔴 Не на линии"}</p>
      <p>🔋 ${s.battery}%</p>

      <button onclick="toggle('${id}')">Вкл/Выкл</button>
      <button onclick="del('${id}')">Удалить</button>
    `;

    list.appendChild(div);
  }
}

// ВКЛ/ВЫКЛ
async function toggle(id){
  await fetch("/api/admin/toggle/"+id,{method:"POST"});
  load();
}

// УДАЛИТЬ
async function del(id){
  await fetch("/api/admin/delete/"+id,{method:"POST"});
  load();
}
