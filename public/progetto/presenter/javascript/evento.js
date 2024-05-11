const indietro = document.getElementById("indietro");
const socket = io();
const createmp = document.getElementById("createmp");
const titolo = document.getElementById("titolo");
const tipologia = document.getElementById("tipologia");
const posizione = document.getElementById("posizione");
const descrizione = document.getElementById("descrizione");
const dataOraScadenza = document.getElementById("dataOraScadenza");
const immagine = document.getElementById("immagine");
const spinner = document.getElementById("spinner");

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

indietro.onclick = () => {
  window.location.href = "./home.html";
};

socket.on("loginSucc", (response) => {
  spinner.classList.add("d-none");
});

createmp.onclick = () => {
  spinner.classList.remove("d-none");
  //console.log("immagine", immagine.value);
  socket.emit("insertEvento", {
    dataOraScadenza: dataOraScadenza.value,
    tipologia: tipologia.value,
    stato: "TEST",
    titolo: titolo.value,
    descrizione: descrizione.value,
    posizione: posizione.value,
    email: sessionStorage.getItem("email"),
    immagine: immagine.value,
  });
};

socket.on("insertSuccess", (response) => {
  //console.log(response);
  spinner.classList.add("d-none");
});
