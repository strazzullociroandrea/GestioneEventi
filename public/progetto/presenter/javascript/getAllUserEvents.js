const idUser = document.getElementById('idUser');
const invia = document.getElementById('invia');
const table = document.getElementById('table');
const logout = document.getElementById("logout");
const socket = io();
const templateEvento = '<div class="col-4 text-center card"><p>%TITOLO</p><p>%SCADENZA</p> <p>%DESCRIZIONE</p><p>%TIPOLOGIA</p><p>%STATO</p><button class="btn btn-info viewEvento" id="%ID">Visualizza</button></div>';
const eventi = document.getElementById("eventi");
const crea = document.getElementById("crea");

window.onload = () => {
   const user = sessionStorage.getItem("email");
   const password = sessionStorage.getItem("password");
   if(user && user != "" && password && password != ""){
    socket.emit('login', {
        email: user,
        password: password
    });
   } else {
    window.location.href = "./login.html";
   }
}

logout.onclick = () => {
    sessionStorage.clear();
    window.location.href = "./login.html";
}

socket.on('loginSucc', (response) => {
    if (response === "Accesso effettuato con successo") {
        socket.emit("getAllUserEvents", sessionStorage.getItem("email"));
    } else {
        window.location.href = "./login.html";
    }
});

socket.on('getResult', (response) => {
    let html = "";
    const { result } = response;
    for (let i = 0; i < result.length; i += 3) {
        html += '<div class="row justify-content-center mt-4">';
        for (let j = i; j < Math.min(i + 3, result.length); j++) {
            html += templateEvento
            .replace("%TITOLO", result[j].titolo)
            .replace("%SCADENZA", result[j].dataOraScadenza.replace("T", " "))
            .replace("%DESCRIZIONE", result[j].descrizione)
            .replace("%TIPOLOGIA", result[j].tipologia)
            .replace("%STATO", result[j].stato)
            .replace("%ID", result[j].id);
        }
        html += '</div>';
    }
    eventi.innerHTML = html;
    document.querySelectorAll(".viewEvento").forEach(button =>{
        button.onclick = () =>{
            console.log(button.id);
           //window.location.href = "./evento.html?idEvento="+button.id
        }
    })
});

crea.onclick = () =>{
    window.location.href = "./evento.html";
}