function login(){
  const phone = document.getElementById("phone").value;
  const error = document.getElementById("error");

  if(!phone){
    error.innerText = "Введите номер телефона!";
    return;
  }

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
