import { login } from "../dataAccess/login.js";
import {render} from "../view/eventi.js"
const crea = document.getElementById("crea");
const inviti = document.getElementById("inviti");
const profilo = document.getElementById("profilo");
const spinner = document.getElementById("spinner");
const idUser = document.getElementById("idUser");
const invia = document.getElementById("invia");
const table = document.getElementById("table");
const logout = document.getElementById("logout");
const socket = io();

profilo.onclick = () => {
    spinner.classList.remove("d-none");
    window.location.href = "./profilo.html";
};

window.onload = () => {
    login(socket);
}

inviti.onclick = () => {
    spinner.classList.remove("d-none");
    window.location.href = "./inviti.html";
};

logout.onclick = () => {
    spinner.classList.remove("d-none");
    sessionStorage.clear();
    window.location.href = "./login.html";
};

socket.on("loginSucc", (response) => {
    if (response > 0) {
        socket.emit("getAllUserEvents", sessionStorage.getItem("email"));
    } else {
        window.location.href = "./login.html";
    }
});
socket.on("getResult", (response) => {
    const { result } = response;
    render(result);
});
crea.onclick = () => {
    spinner.classList.remove("d-none");
    window.location.href = "./evento.html";
};
socket.on("invitato", (response) => {
    jSuites.notification({
        name: "Invito",
        message: "Sei stato invitato ad un nuovo evento",
        timeout: 10000,
        onclick: function () {
            window.location.href = "./inviti.html";
        },
    });
});