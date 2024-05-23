import { getEvento } from "../dataAccess/getEvento.js";
import { recuperaImmagine } from "../dataAccess/recuperaImmagine.js";
const titolo = document.getElementById("titolo");

export const eventoView = async (idevento) => {
    const evento = await getEvento(idevento);
    if (evento) {
        //.replace("%TITOLO", result[j].titolo.length > 15 ? result[j].titolo.substring(0,15)+"..." :  result[j].titolo)
        titolo.innerHTML = result[0].titolo.length > 15 ? result[0].titolo.substring(0,15)+"..." :  result[0].titolo;
      //  evento.innerHTML = "<h1 class='m-md-4'>" + rsp[0].titolo + "</h1>";
        evento.innerHTML += "<p></p><span class='m-md-4'>Data ed ora scadenza: " + rsp[0].dataOraScadenza.replace("T", " alle ") + "</span>";
        evento.innerHTML += "<p></p><span class='m-md-4'>Tipologia: " + rsp[0].tipologia + "</span>";
        evento.innerHTML += "<p></p><span class='m-md-4'>Posizione: " + rsp[0].posizione + "</span>";
        evento.innerHTML += "<p></p><span class='m-md-4'>Proprietario: " + (rsp[0].username == sessionStorage.getItem("email") ? "Tu" : rsp[0].username) + "</span>";
        //visualizzo gli invitati
        let string = "";
        let tu = false;
        rsp[0].invitati.forEach(invitato => {
            if (invitato.username == sessionStorage.getItem("email")) {
                tu = true;
            } else {
                string += invitato.username.split("@")[0] + ", ";
            }
        })
        if (tu) {
            string = "Tu, " + string;
        }
        string = string.substring(0, 50) + "...";
        evento.innerHTML += "<p></p><span class='m-md-4'>Invitati: " + (string.length > 0 && string != "..." ? string : "Nessuno") + "</span>";
        evento.innerHTML += "<p></p><span class='m-md-4'>Descrizione: " + rsp[0].descrizione + "</span>";
        const urlImmagine = recuperaImmagine(evento);
        return { html, urlImmagine };
    }
}