let phoneGlobal = "";
let current = null;

// LOGIN
async function login(){
  const phone = document.getElementById("phone").value;

  if(!/^\d{12}$/.test(phone)){
    error.innerText="Номер должен быть 12 цифр!";
    return;
  }

  phoneGlobal = phone;

  await fetch("/api/login",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({phone})
  });

  if(phone === "37529506866312"){
    show("admin");
    loadAdmin();
  }else{
    show("main");
    loadBalance();
  }
}

// БАЛАНС
async function loadBalance(){
  const r = await fetch("/api/balance/"+phoneGlobal);
  const d = await r.json();

  document.getElementById("bal").innerText =
    "Баланс: "+d.balance.toFixed(2);
}

// СТАРТ
async function startFlow(id){
  const r = await fetch("/api/start",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({id,phone:phoneGlobal})
  });

  const d = await r.json();

  if(d.error){
    alert(d.error);
    return;
  }

  current = id;
}

// ОПЛАТА
async function pay(){
  const code = prompt("QR код");
  if(!code) return;

  const r = await fetch("/api/pay",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({phone:phoneGlobal,code})
  });

  loadBalance();
}
