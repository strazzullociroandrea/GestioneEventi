const inviti = document.getElementById("inviti");
const templateInvito =
  '<div class="invito"><div class="row alert alert-warning w-50"><table class="w-100"><tr> <td><p>%PROPRIETARIO ti ha invitato a partecipare ad un evento chiamato <b>%TITOLOEVENTO</b></p></td><td class="button-cell"><button class="btn btn-success btnacc" id="%ID">Accetta</button></td><td class="button-cell"><button class="btn btn-danger btndel" id="%ID">Elimina</button></td> </tr></table></div></div>';

export const render = (response, socket) =>{
    let html = "";
    response?.result.forEach((invito) => {
      console.log(invito);
      html += templateInvito
        .replace("%TITOLOEVENTO", invito.titolo)
        .replace("%PROPRIETARIO", invito.proprietario)
        .replaceAll("%ID", invito.idUser + "_" + invito.idEvento);
    });
    if (html.length > 0) {
      inviti.innerHTML = html;
      document.querySelectorAll(".btnacc").forEach((button) => {
        button.onclick = () => {
          spinner.classList.remove("d-none");
          const id = button.id.split("_");
          const idUser = id[0],
            idEvento = id[1];
          socket.emit("accettaInvito", {
            idEvento,
            idUser,
          });
        };
      });
      document.querySelectorAll(".btndel").forEach((button) => {
        button.onclick = () => {
          spinner.classList.remove("d-none");
          const id = button.id.split("_");
          const idUser = id[0],
            idEvento = id[1];
          socket.emit("rifiutaInvito", {
            idEvento,
            idUser,
          });
        };
      });
    } else {
      inviti.innerHTML = '<div class="alert alert-warning w-50" role="alert">Non hai inviti da accettare</div>';
    }
    spinner.classList.add("d-none");
}