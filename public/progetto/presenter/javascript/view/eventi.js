import {eliminaEvento} from "../dataAccess/eliminaEvento.js"
const deleteButton = '<button class="btn button deleteEvent %BLOCK mx-2" id="delete-%ID-%USERID"><svg viewBox="0 0 448 512" class="svgIcon"><path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"></path></svg></button>';

const viewButton = '<button class="btn view-button viewEvento btn-info mx-2" id="%ID"><svg height="100%" stroke-miterlimit="10" style="fill-rule:nonzero;clip-rule:evenodd;stroke-linecap:round;stroke-linejoin:round;" version="1.1" viewBox="0 0 512 512" width="100%" xml:space="preserve" xmlns="http://www.w3.org/1999/xlink"><g id="Livello-1" vectornator:layername="Livello 1"><path d="M475.429 237.459C446.476 189.136 410.19 152.995 366.571 129.039C378.19 150.334 384 173.369 384 198.145C384 236.026 371.476 268.429 346.429 295.355C321.381 322.281 291.238 335.744 256 335.744C220.762 335.744 190.619 322.281 165.571 295.355C140.524 268.429 128 236.026 128 198.145C128 173.369 133.81 150.334 145.429 129.039C101.81 152.995 65.5238 189.136 36.5714 237.459C61.9048 279.435 93.6667 312.862 131.857 337.741C170.048 362.619 211.429 375.058 256 375.058C300.571 375.058 341.952 362.619 380.143 337.741C418.333 312.862 450.095 279.435 475.429 237.459ZM269.714 119.517C269.714 115.422 268.381 111.941 265.714 109.074C263.048 106.208 259.81 104.774 256 104.774C232.19 104.774 211.762 113.937 194.714 132.263C177.667 150.59 169.143 172.55 169.143 198.145C169.143 202.24 170.476 205.721 173.143 208.588C175.81 211.455 179.048 212.888 182.857 212.888C186.667 212.888 189.905 211.455 192.571 208.588C195.238 205.721 196.571 202.24 196.571 198.145C196.571 180.536 202.381 165.486 214 152.995C225.619 140.505 239.619 134.26 256 134.26C259.81 134.26 263.048 132.827 265.714 129.96C268.381 127.093 269.714 123.612 269.714 119.517ZM512 237.459C512 244.421 510.095 251.485 506.286 258.652C479.619 305.747 443.762 343.474 398.714 371.833C353.667 400.193 306.095 414.372 256 414.372C205.905 414.372 158.333 400.141 113.286 371.68C68.2381 343.218 32.381 305.542 5.71429 258.652C1.90476 251.485 0 244.421 0 237.459C0 230.497 1.90476 223.433 5.71429 216.267C32.381 169.376 68.2381 131.7 113.286 103.239C158.333 74.777 205.905 60.5461 256 60.5461C306.095 60.5461 353.667 74.777 398.714 103.239C443.762 131.7 479.619 169.376 506.286 216.267C510.095 223.433 512 230.497 512 237.459Z" fill="#ffffff" fill-rule="nonzero" opacity="1" stroke="none" vectornator:layername="path"></path></g></svg></button>';

const inviteButton = '<button class="btn invita-button invitaEvento %BLOCK mx-2" id="invita-%ID" %PROP ><svg height="500px" width="500px" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 495.003 495.003" xml:space="preserve"><path id="XMLID_53_" d="M164.711,456.687c0,2.966,1.647,5.686,4.266,7.072c2.617,1.385,5.799,1.207,8.245-0.468l55.09-37.616l-67.6-32.22V456.687z"/><path id="XMLID_52_" d="M492.431,32.443c-1.513-1.395-3.466-2.125-5.44-2.125c-1.19,0-2.377,0.264-3.5,0.816L7.905,264.422c-4.861,2.389-7.937,7.353-7.904,12.783c0.033,5.423,3.161,10.353,8.057,12.689l125.342,59.724l250.62-205.99L164.455,364.414l156.145,74.4c1.918,0.919,4.012,1.376,6.084,1.376c1.768,0,3.519-0.322,5.186-0.977c3.637-1.438,6.527-4.318,7.97-7.956L494.436,41.257C495.66,38.188,494.862,34.679,492.431,32.443z"/></svg></button>';

const templateEvento =
  '<div class="text-center  relative bg-light shadow-lg m-3 p-3 rounded-4"><div style="z-index:100;"><p>%TITOLO</p><p>%SCADENZA</p> <p>%DESCRIZIONE</p><p>%TIPOLOGIA</p> <p>Evento di %PROPRIETARIO</p><div class="d-flex justify-content-center align-items-center">'+viewButton+inviteButton+deleteButton+'</div></div></div>';
const eventi = document.getElementById("eventi");

export const render = (result) => {
    let html = "";
    for (let i = 0; i < result.length; i += 3) {
      html += '<div class="row">';
      for (let j = i; j < Math.min(i + 3, result.length); j++) {
        html +="<div class='col-4 '>";
        html += templateEvento
          .replace("%TITOLO","<b>Titolo:</b>  "+ result[j].titolo)
          .replace("%SCADENZA", "<b>Scadenza:</b>  "+result[j].dataOraScadenza.replace("T", " "))
          .replace("%DESCRIZIONE", "<b>Descrizione:</b> "+result[j].descrizione)
          .replace("%TIPOLOGIA","<b>Tipologia:</b>  "+ result[j].tipologia)
          .replace("%PROPRIETARIO", result[j].proprietario)
          .replaceAll("%BLOCK", result[j].proprietario == sessionStorage.getItem("email") ? "" : "btn-disabled")
          .replaceAll("%ID", result[j].id)
          .replaceAll("%USERID", result[j].idUser)
          .replace(
            "%PROP?",
            result[j].username != sessionStorage.getItem("email")
              ? "disabled"
              : ""
          );
          html+="</div>";
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