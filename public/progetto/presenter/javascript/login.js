const login = document.getElementById("login");
const email = document.getElementById("email");
const password = document.getElementById("password");
const socket = io();
const divAlert = document.getElementById("alert");
const testoAlert = document.getElementById("testoAlert");
const spinner = document.getElementById("spinner");
let mailTemp = "";
let passwordTemp = "";
login.onclick = () => {
  spinner.classList.remove("d-none");
  divAlert.classList.add("d-none");
  mailTemp = email.value;
  passwordTemp = password.value;
  const dict = {
    email: mailTemp,
    password: passwordTemp,
  };
  socket.emit("login", dict);
};

socket.on("loginSucc", (response) => {
  if (response > 0) {
    divAlert.classList.add("d-none");
    sessionStorage.setItem("id", response);
    sessionStorage.setItem("email", mailTemp);
    sessionStorage.setItem("password", passwordTemp);
    email.value = "";
    password.value = "";
    window.location.href = "./home.html";
  } else {
    testoAlert.innerText = response;
    divAlert.classList.remove("d-none");
  }
  spinner.classList.add("d-none");
});

window.onload = () => {
  if (sessionStorage.getItem("email")) {
    if (
      sessionStorage.getItem("email") !== undefined &&
      sessionStorage.getItem("password") !== undefined &&
      sessionStorage.getItem("email") !== "" &&
      sessionStorage.getItem("password") !== ""
    ) {
      const dict = {
        email: sessionStorage.getItem("email"),
        password: sessionStorage.getItem("password"),
      };
      socket.emit("login", dict);
    }
  }
  spinner.classList.add("d-none");
};
