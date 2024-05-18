import {login} from "../dataAccess/login.js";
import {getUrl} from "../dataAccess/getUrl.js";

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
    login(socket);
}
indietro.onclick = () => {
    window.location.href = "./home.html";
};
socket.on("loginSucc", (response) => {
    spinner.classList.add("d-none");
});
socket.on("insertSuccess", (response) => {
    if (response.result == "Non è stato possibile aggiungere l'evento") {
      dataOraScadenza.classList.add("border-danger");
      tipologia.classList.add("border-danger");
      titolo.classList.add("border-danger");
      descrizione.classList.add("border-danger");
      posizione.classList.add("border-danger");
      immagine.classList.add("border-danger");
      window.location.href = "./home.html";
    } else {
      dataOraScadenza.value =
        tipologia.value =
        titolo.value =
        descrizione.value =
        posizione.value =
        immagine.value =
          "";
        window.location.href = "./home.js";
    }
    spinner.classList.add("d-none");
});

createmp.onclick = async () => {
    if(dataOraScadenza.value != "" && tipologia.value != "" && titolo.value != "" && 
    descrizione.value != "" && posizione.value != "" && immagine.files[0]
    ){
        spinner.classList.remove("d-none");
        dataOraScadenza.classList.remove("border-danger");
        tipologia.classList.remove("border-danger");
        titolo.classList.remove("border-danger");
        descrizione.classList.remove("border-danger");
        posizione.classList.remove("border-danger");
        immagine.classList.remove("border-danger");
        const file = immagine.files[0];
        const formData = new FormData();
        formData.append("file", file);
        const url = await getUrl(formData);
        if(url){
            socket.emit("insertEvento", {
                dataOraScadenza: dataOraScadenza.value,
                tipologia: tipologia.value,
                stato: "Creato",//da cambiare
                titolo: titolo.value,
                descrizione: descrizione.value,
                posizione: posizione.value,
                email: sessionStorage.getItem("email"),
                immagine: url,
              });
        }else{
            dataOraScadenza.classList.add("border-danger");
            tipologia.classList.add("border-danger");
            titolo.classList.add("border-danger");
            descrizione.classList.add("border-danger");
            posizione.classList.add("border-danger");
            immagine.classList.add("border-danger");
        }
    }else{
        dataOraScadenza.classList.add("border-danger");
        tipologia.classList.add("border-danger");
        titolo.classList.add("border-danger");
        descrizione.classList.add("border-danger");
        posizione.classList.add("border-danger");
        immagine.classList.add("border-danger");
    }
    
}