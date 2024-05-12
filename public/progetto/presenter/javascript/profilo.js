const indietro = document.getElementById("indietro");
const username = document.getElementById("username");
const newPassword = document.getElementById("newPassword");
const conferma = document.getElementById("conferma");
const elimina = document.getElementById("elimina");
const spinner = document.getElementById("spinner");
const socket = io();

window.onload = () => {
  const user = sessionStorage.getItem("email");
  const password = sessionStorage.getItem("password");
  if (user && user != "" && password && password != "") {
    socket.emit("login", {
      email: user,
      password: password,
    });
  } else {
    window.location.href = "./login.html";
  }
};

socket.on("loginSucc", (response) => {
  if (response > 0) {
    username.value = sessionStorage.getItem("email");
    spinner.classList.add("d-none");
  } else {
    window.location.href = "./login.html";
  }
});
indietro.onclick = () => {
  spinner.classList.remove("d-none");
  window.history.back();
};

conferma.onclick = async () => {
  spinner.classList.add("d-none");
  newPassword.classList.remove("border-danger");
  newPassword.classList.remove("border-success");
  let rsp = await fetch("/changePassword", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      username: sessionStorage.getItem("email"),
      newPassword: newPassword.value,
    }),
  });
  rsp = await rsp.json();
  if (rsp.result) {
    newPassword.classList.add("border-success");
    sessionStorage.setItem("password", newPassword.value);
  } else {
    newPassword.classList.add("border-danger");
  }
  newPassword.value = "";
  spinner.classList.remove("d-none");
};

elimina.onclick = async () => {
  spinner.classList.remove("d-none");
  let rsp = await fetch("/deleteAccount", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      username: sessionStorage.getItem("email"),
    }),
  });
  rsp = await rsp.json();
  if (rsp.result) {
    sessionStorage.clear();
    window.location.href = "./login.html";
  }
};