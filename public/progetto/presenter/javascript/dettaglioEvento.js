const urlParams = new URLSearchParams(window.location.search);
const idEvento = urlParams.get('idEvento');
const socket = io();
const indietro = document.getElementById("indietro");
const evento = document.getElementById("evento");
const immagine =  document.getElementById("immagine");

window.onload = async () => {
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

}
socket.on("loginSucc", async(response) => {
    if(response != -1){
        if (idEvento && idEvento != "") {
            let rsp = await fetch("/getEvento", {
                method: "POST",
                headers: {
                    "content-type": "Application/json"
                },
                body: JSON.stringify({
                    idEvento,
                    email: sessionStorage.getItem("email")
                })
            })
            rsp = await rsp.json();
            rsp = rsp.result;
            if(rsp){
                console.log(rsp);
                evento.innerHTML = "<h1 class='m-4'>Titolo: "+rsp[0].titolo+"</h1>";
                evento.innerHTML += "<span class='m-4'>Descrizione: "+rsp[0].descrizione+"</span>";
                evento.innerHTML += "<p></p><span class='m-4'>Posizione: "+rsp[0].posizione+"</span>";
                evento.innerHTML += "<p></p><span class='m-4'>Tipologia: "+rsp[0].tipologia+"</span>";
                immagine.src = rsp[0].immagine;
            }else{
                window.location.href = "./home.html";
            }
        } else {
            window.location.href = "./home.html";
        }
    }else{
        window.location.href = "./login.html";
    }
});

indietro.onclick = () =>{
   //spinner.classList.remove("d-none");
    window.history.back();
}