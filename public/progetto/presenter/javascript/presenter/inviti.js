import { login } from "../dataAccess/login.js";
import {render} from "../view/inviti.js";
const indietro = document.getElementById("indietro");
const socket = io();
const spinner = document.getElementById("spinner");

window.onload = () => {
    login(socket);
}

socket.on("loginSucc", (response) => {
    if (response > 0) {
        socket.emit("getInviti", sessionStorage.getItem("email"));
    } else {
        window.location.href = "./login.html";
    }
});


socket.on("accettaInvitoRes", (response) => {
    if (response) {
        socket.emit("getInviti", sessionStorage.getItem("email"));
    }
});
socket.on("rifiutaInvitoRes", (response) => {
    if (response) {
        socket.emit("getInviti", sessionStorage.getItem("email"));
    }
});

indietro.onclick = () => {
    spinner.classList.remove("d-none");
    window.history.back();
};
socket.on("invitato", (response) => {
    socket.emit("getInviti", sessionStorage.getItem("email"));
});

socket.on("resultGetInviti", (response) => {
    render(response, socket);
});