import { login } from "../dataAccess/login.js";
import { cambiaPassword } from "../dataAccess/cambiaPassword.js";
import {eliminaProfilo} from "../dataAccess/eliminaProfilo.js";

const indietro = document.getElementById("indietro");
const username = document.getElementById("username");
const newPassword = document.getElementById("newPassword");
const conferma = document.getElementById("conferma");
const elimina = document.getElementById("elimina");
const spinner = document.getElementById("spinner");
const successo = document.getElementById("successo");
const errore = document.getElementById("errore");
const socket = io();

window.onload = () => {
    login(socket);
}

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
    successo.classList.add("d-none");
    errore.classList.add("d-none");
    spinner.classList.add("d-none");
    newPassword.classList.remove("border-danger");
    newPassword.classList.remove("border-success");
    if (newPassword.value != "") {
        const rsp = await cambiaPassword(newPassword.value);
        if (rsp.result) {
            successo.classList.remove("d-none");
            setTimeout(() => {
                successo.classList.add("d-none");
            }, 5000)
            sessionStorage.setItem("password", newPassword.value);
        } else {
            errore.classList.remove("d-none");
            setTimeout(() => {
                errore.classList.add("d-none");
            }, 5000)
        }
        newPassword.value = "";
        spinner.classList.add("d-none");
    } else {
        newPassword.classList.add("border-danger");
        newPassword.classList.add("border-success");
    }
}

elimina.onclick = async () => {
    spinner.classList.remove("d-none");
    eliminaProfilo();
      sessionStorage.clear();
      window.location.href = "./login.html";
};