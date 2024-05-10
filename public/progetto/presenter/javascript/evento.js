const indietro = document.getElementById("indietro");
const socket = io();
const createmp = document.getElementById("createmp");
const titolo = document.getElementById("titolo");
const tipologia = document.getElementById("tipologia");
const posizione = document.getElementById("posizione");
const descrizione = document.getElementById("descrizione");
const dataOraScadenza = document.getElementById("dataOraScadenza");

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

indietro.onclick = () =>{
    window.location.href = "./home.html";
}

socket.on('loginSucc', (response) => {
   //view della pagina dopo la view dello spinner
});

createmp.onclick = () =>{
    /*
    evento.dataOraScadenza !== "" &&
                evento.tipologia !== "" &&
                evento.stato !== "" &&
                evento.titolo !== "" &&
                evento.descrizione !== "" &&
                evento.posizione !== "" &&
                evento.idUser
    */
    socket.emit("insertEvento",{
        dataOraScadenza: dataOraScadenza.value,
        tipologia: tipologia.value,
        stato: "TEST",
        titolo: titolo.value, 
        descrizione: descrizione.value,
        posizione: posizione.value,
        email: sessionStorage.getItem("email")
    });
}

socket.on("insertSuccess",(response)=>{
    console.log(response);
});