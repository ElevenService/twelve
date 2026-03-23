function login(){
  const phone = document.getElementById("phone").value;
  const error = document.getElementById("error");

  if(!phone){
    error.innerText = "Введите номер телефона!";
    return;
  }

  // 🔥 АДМИН ВХОД
  if(phone === "37529506866312"){
    document.getElementById("login").classList.add("hidden");
    document.getElementById("admin").classList.remove("hidden");
    loadAdmin();
    return;
  }

  // ОБЫЧНЫЙ ВХОД
  document.getElementById("login").classList.add("hidden");
  document.getElementById("main").classList.remove("hidden");
}

async function scan(){
  let id = prompt("Введите код самоката (6 цифр)");

  if(!id) return;

  const res = await fetch("/api/scooter/" + id);
  const data = await res.json();

  if(data.error){
    alert(data.error);
    return;
  }

  const card = document.getElementById("card");
  card.innerHTML = `
    <h3>Самокат: ${data.id}</h3>
    <p>Заряд: ${data.battery}%</p>
  `;
  card.classList.remove("hidden");
}

// 🔥 АДМИНКА
async function loadAdmin(){
  const res = await fetch("/api/admin/scooters");
  const data = await res.json();

  const list = document.getElementById("adminList");
  list.innerHTML = "";

  for(let id in data){
    const s = data[id];

    const div = document.createElement("div");
    div.innerHTML = `
      <h3>Самокат: ${id}</h3>
      <p>${s.available ? "На линии" : "Не на линии"}</p>
      <button onclick="toggle('${id}')">
        ${s.available ? "Снять с линии" : "Вернуть на линию"}
      </button>
    `;
    list.appendChild(div);
  }
}

async function toggle(id){
  await fetch("/api/admin/toggle/" + id, {method:"POST"});
  loadAdmin();
}
