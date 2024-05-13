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

createmp.onclick = async () => {
  spinner.classList.remove("d-none");
  dataOraScadenza.classList.remove("border-danger");
  tipologia.classList.remove("border-danger");
  titolo.classList.remove("border-danger");
  descrizione.classList.remove("border-danger");
  posizione.classList.remove("border-danger");
  immagine.classList.remove("border-danger");

  const file = immagine.files[0];
  console.log(file);
  const formData = new FormData();
  formData.append("file", file);
  console.log(formData);
  let rsp = await fetch("/dammiUrl", {
    method: "POST",
    body: formData,
  });

  socket.emit("insertEvento", {
    dataOraScadenza: dataOraScadenza.value,
    tipologia: tipologia.value,
    stato: "TEST",
    titolo: titolo.value,
    descrizione: descrizione.value,
    posizione: posizione.value,
    email: sessionStorage.getItem("email"),
    immagine: immagine.files[0],
  });
  rsp = await rsp.json();
  //Se è stato caricato con successo
  if (rsp.result) {
    //link dell'immagine da salvare in db
    const linkImg = rsp.link;
    dataOraScadenza.classList.remove("border-danger");
    tipologia.classList.remove("border-danger");
    titolo.classList.remove("border-danger");
    descrizione.classList.remove("border-danger");
    posizione.classList.remove("border-danger");
    immagine.classList.remove("border-danger");
    socket.emit("insertEvento", {
      dataOraScadenza: dataOraScadenza.value,
      tipologia: tipologia.value,
      stato: "TEST",
      titolo: titolo.value,
      descrizione: descrizione.value,
      posizione: posizione.value,
      email: sessionStorage.getItem("email"),
      immagine: linkImg,
    });
  } else {
    console.log("Caricamento non avvenuto");
  }
};

socket.on("insertSuccess", (response) => {
  if (response.result == "Non è stato possibile aggiungere l'evento") {
    dataOraScadenza.classList.add("border-danger");
    tipologia.classList.add("border-danger");
    titolo.classList.add("border-danger");
    descrizione.classList.add("border-danger");
    posizione.classList.add("border-danger");
    immagine.classList.add("border-danger");
  } else {
    dataOraScadenza.value =
      tipologia.value =
      titolo.value =
      descrizione.value =
      posizione.value =
      immagine.value =
        "";
  }
  spinner.classList.add("d-none");
});
