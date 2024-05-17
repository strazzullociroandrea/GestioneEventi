const urlParams = new URLSearchParams(window.location.search);
const idEvento = urlParams.get('idEvento');
const socket = io();
const indietro = document.getElementById("indietro");
const evento = document.getElementById("evento");
const immagine =  document.getElementById("immagine");
const spinner = document.getElementById("spinner");
const dettagli =  document.getElementById("dettagli");

window.onload = async () => {
    const user = sessionStorage.getItem("email");
    const password = sessionStorage.getItem("password");
    if (user && user !== "" && password && password !== "") {
        socket.emit("login", {
            email: user,
            password: password,
        });
    } else {
        window.location.href = "./login.html";
    }
};

socket.on("loginSucc", async(response) => {
    if(response !== -1){
        if (idEvento && idEvento !== "") {
            try {
                let rsp = await fetch("/getEvento", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        idEvento,
                        email: sessionStorage.getItem("email")
                    })
                });
                rsp = await rsp.json();
                rsp = rsp.result;
                if(rsp){
                    console.log(rsp);
                    evento.innerHTML = "<h1 class='m-md-4'>Titolo: "+rsp[0].titolo+"</h1>";
                    evento.innerHTML += "<span class='m-md-4'>Descrizione: "+rsp[0].descrizione+"</span>";
                    evento.innerHTML += "<p></p><span class='m-md-4'>Posizione: "+rsp[0].posizione+"</span>";
                    evento.innerHTML += "<p></p><span class='m-md-4'>Tipologia: "+rsp[0].tipologia+"</span>";
                    //visualizzo gli invitati
                    let string = "";
                    rsp[0].invitati.forEach(invitato => {
                        if(invitato.username == sessionStorage.getItem("email")){
                            string += "TU";
                        }else{
                            string += invitato.username.substring(0,20);
                        }
                    })
                    string = string.substring(0,50) + "...";
                    evento.innerHTML += "<p></p><span class='m-md-4'>Invitati: "+(string.length > 0 && string != "..." ? string : "Nessuno") +"</span>";
                    let rspImg = await fetch("/download", {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ mega: rsp[0].immagine })
                    });
                    rspImg = await rspImg.blob();
                    const url = URL.createObjectURL(rspImg);
                    immagine.src = url;
                    spinner.classList.add("d-none");
                    dettagli.classList.remove("d-none");
                } else {
                    window.location.href = "./home.html";
                }
            } catch (error) {
                console.error(error);
                window.location.href = "./home.html";
            }
        } else {
            window.location.href = "./home.html";
        }
    } else {
        window.location.href = "./login.html";
    }
});

indietro.onclick = () =>{
    window.history.back();
};
