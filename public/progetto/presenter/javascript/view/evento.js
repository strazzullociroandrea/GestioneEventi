import { getEvento } from "../dataAccess/getEvento.js";
import {recuperaImmagine} from "../dataAccess/recuperaImmagine.js";

export const eventoView = async (idevento) => {
    const evento = getEvento(idevento);
    let html = "<h1 class='m-md-4'>Titolo: " + evento.titolo + "</h1>";
    html += "<span class='m-md-4'>Descrizione: " + evento.descrizione + "</span>";
    html += "<p></p><span class='m-md-4'>Posizione: " + evento.posizione + "</span>";
    html += "<p></p><span class='m-md-4'>Tipologia: " + evento.tipologia + "</span>";
    let string = "";
    rsp[0].invitati.forEach(invitato => {
        if(invitato.username == sessionStorage.getItem("email")){
            string += "TU, ";
        }else{
            string += invitato.username.substring(0,20)+", ";
        }
    })
    string = string.substring(0, 50) + "...";
    html += "<p></p><span class='m-md-4'>Invitati: " + (string.length > 0 && string != "..." ? string : "Nessuno") + "</span>";
    const urlImmagine = recuperaImmagine(evento);
    return {html, urlImmagine};
}