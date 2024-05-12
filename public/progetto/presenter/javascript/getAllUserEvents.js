const idUser = document.getElementById("idUser");
const invia = document.getElementById("invia");
const table = document.getElementById("table");
const logout = document.getElementById("logout");
const socket = io();
const templateEvento =
  '<div class="col-4 text-center card relative"><div style="z-index:100;"><p>%TITOLO</p><p>%SCADENZA</p> <p>%DESCRIZIONE</p><p>%TIPOLOGIA</p><p>%STATO</p><button class="btn btn-info viewEvento" id="%ID">Visualizza</button><button class="btn btn-danger deleteEvent m-3" id="delete-%ID-%USERID">elimina evento</button></div><img src="%IMG" style="position:absolute; top:0;left:0;right:0;bottom:0; width:100%;height:100%; z-index:0"></div>';
const eventi = document.getElementById("eventi");
const crea = document.getElementById("crea");
const inviti = document.getElementById("inviti");
const profilo = document.getElementById("profilo");
const spinner = document.getElementById("spinner");
const deleteEvent = (id) => {
  console.log("deleting", id);
};
profilo.onclick = () => {
  spinner.classList.remove("d-none");
  window.location.href = "./profilo.html";
};

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
  if (response === "Accesso effettuato con successo") {
    socket.emit("getAllUserEvents", sessionStorage.getItem("email"));
  } else {
    window.location.href = "./login.html";
  }
});

socket.on("getResult", (response) => {
  let html = "";
  const { result } = response;
  console.log(result);
  for (let i = 0; i < result.length; i += 3) {
    html += '<div class="row justify-content-center mt-4">';
    for (let j = i; j < Math.min(i + 3, result.length); j++) {
      html += templateEvento
        .replace("%TITOLO", result[j].titolo)
        .replace("%IMG", result[j].immagine)
        .replace("%SCADENZA", result[j].dataOraScadenza.replace("T", " "))
        .replace("%DESCRIZIONE", result[j].descrizione)
        .replace("%TIPOLOGIA", result[j].tipologia)
        .replace("%STATO", result[j].stato)
        .replaceAll("%ID", result[j].id)
        .replaceAll("%USERID", result[j].idUser);
    }
    html += "</div>";
  }
  eventi.innerHTML = html;
  document.querySelectorAll(".viewEvento").forEach((button) => {
    button.onclick = () => {
      //console.log(button.id);
      //window.location.href = "./evento.html?idEvento="+button.id
    };
  });
  document.querySelectorAll(".deleteEvent").forEach((button) => {
    button.onclick = () => {
      let id = button.id.split("-");

      console.log("deleting", id[1], id[2]);
      let rsp = fetch("/deleteEvento", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          event: {
            idEvento: id[1],
            idUtente: id[2],
          },
        }),
      }).then((res) => {
        console.log(res);
      });
      //window.location.href = "./evento.html?idEvento="+button.id
    };
  });

  spinner.classList.add("d-none");
});

crea.onclick = () => {
  spinner.classList.remove("d-none");
  window.location.href = "./evento.html";
};
socket.on("invitato", (response) => {
  alert("Sei stato invitato ad un nuovo evento");
});
