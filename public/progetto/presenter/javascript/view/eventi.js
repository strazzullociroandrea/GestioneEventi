import {eliminaEvento} from "../dataAccess/eliminaEvento.js"
const templateEvento =
  '<div class="col-4 text-center card bg-body-secondary relative"><div style="z-index:100;"><p>%TITOLO</p><p>%SCADENZA</p> <p>%DESCRIZIONE</p><p>%TIPOLOGIA</p><button class="btn btn-info viewEvento mx-1" id="%ID">Visualizza</button><button class="btn btn-warning invitaEvento mx-1" id="%ID" %PROP?>Invita</button><button class="btn button deleteEvent" id="delete-%ID-%USERID"><svg viewBox="0 0 448 512" class="svgIcon"><path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"></path></svg></button></div></div></div>';
const eventi = document.getElementById("eventi");

export const render = (result) => {
    let html = "";
    for (let i = 0; i < result.length; i += 3) {
      html += '<div class="row justify-content-center mt-4">';
      for (let j = i; j < Math.min(i + 3, result.length); j++) {
        html += templateEvento
          .replace("%TITOLO", result[j].titolo)
          .replace("%SCADENZA", result[j].dataOraScadenza.replace("T", " "))
          .replace("%DESCRIZIONE", result[j].descrizione)
          .replace("%TIPOLOGIA", result[j].tipologia)
          .replaceAll("%ID", result[j].id)
          .replaceAll("%USERID", result[j].idUser)
          .replace(
            "%PROP?",
            result[j].username != sessionStorage.getItem("email")
              ? "disabled"
              : ""
          );
      }
      html += "</div>";
    }
    eventi.innerHTML = html;
    document.querySelectorAll(".viewEvento").forEach((button) => {
      button.onclick = () => {
        window.location.href = "./dettaglioEvento.html?idEvento=" + button.id;
      };
    });
  
    document.querySelectorAll(".invitaEvento").forEach((button) => {
      button.onclick = () => {
        window.location.href =
          "./invita.html?idEvento=" + button.id + "&idUser=13";
      };
    });
  
    document.querySelectorAll(".deleteEvent").forEach((button) => {
      button.onclick = () => {
        eliminaEvento(button.id)
      };
    });
  
    spinner.classList.add("d-none");
  };