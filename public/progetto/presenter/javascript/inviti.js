const indietro = document.getElementById("indietro");
const socket = io();
const inviti = document.getElementById("inviti");
const templateInvito =
  '<div class="row card"><table class="w-100"><tr> <td><p>%PROPRIETARIO ti ha invitato a partecipare ad un evento chiamato <b>%TITOLOEVENTO</b></p></td><td><button class="btn btn-success btnacc" id="%ID">Accetta</button></td><td><button class="btn btn-danger btndel" id="%ID">Elimina</button></td></tr></table></div>';
const spinner = document.getElementById("spinner");

window.onload = () => {
  const user = sessionStorage.getItem("email");
  const password = sessionStorage.getItem("password");
  if (user && user != "" && password && password != "") {
    socket.emit("login", {
      email: user,
      password: password,
    });
  } else {
    window.location.href = "./login.html";
  }
};

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
socket.on("resultGetInviti", (response) => {
  let html = "";
  response.result.forEach((invito) => {
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
    inviti.innerHTML = "<p>Non hai inviti da accettare</p>";
  }
  spinner.classList.add("d-none");
});

indietro.onclick = () => {
  spinner.classList.remove("d-none");
  window.history.back();
};
socket.on("invitato", (response) => {
  socket.emit("getInviti", sessionStorage.getItem("email"));
});
