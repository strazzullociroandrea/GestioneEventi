import {login} from "../dataAccess/login.js";
import {eventoView} from "./eventoView.js";

const urlParams = new URLSearchParams(window.location.search);
const idEvento = urlParams.get('idEvento');
const socket = io();
const indietro = document.getElementById("indietro");
const evento = document.getElementById("evento");
const immagine =  document.getElementById("immagine");
const spinner = document.getElementById("spinner");
const dettagli =  document.getElementById("dettagli");

window.onload = async () => {
    login(socket);
};

indietro.onclick = () =>{
    window.history.back();
};
socket.on("loginSucc", async(response) => {
    if(response !== -1){
        const {html, urlImmagine} = await eventoView(idEvento);
        if(html && urlImmagine){
            evento.innerHTML = html;
            immagine.src = urlImmagine;
            spinner.classList.add("d-none");
            dettagli.classList.remove("d-none");
        }
    }else{
        window.location.href = "./login.html";
    }
});