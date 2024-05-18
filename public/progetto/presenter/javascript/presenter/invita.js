import { getInvitati } from "../dataAccess/getInvitati.js";
import { login } from "../dataAccess/login.js";
import { render } from "../view/render.js";
import { invitaUtenti } from "../dataAccess/invitaUtenti.js";

const socket = io();
const userId = sessionStorage.getItem("id");
let users;
let eventId;

window.onload = () => {
    const searchParams = new URLSearchParams(window.location.search);
    eventId = searchParams.get("idEvento");
    login(socket);
}

socket.on("loginSucc", async (response) => {
    if (response > 0) {
        users = await getInvitati();
        render(users);
    } else {
        window.location.href = "./login.html";
    }
});
indietro.onclick = () => {
    //spinner.classList.remove("d-none");
    window.history.back();
};

buttonInvita.onclick = async() => {
    let selected = [];
    document.querySelectorAll("input[type=checkbox]").forEach((check) => {
      if (check.checked) {
        selected.push(check.id);
      }
    });
    //In selected ho l'elenco degli id delle checkbox utenti da invitare
    let users = [];
    selected.forEach((item) => {
      id = item.split("-");
      users.push(id[1]);
    });
    await invitaUtenti(users, eventId);
};