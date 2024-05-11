const indietro = document.getElementById("indietro");
const username = document.getElementById("username");
const newPassword = document.getElementById("newPassword");
const conferma = document.getElementById("conferma");
const elimina = document.getElementById("elimina");

const socket = io();

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
    if (response === "Accesso effettuato con successo") {
        username.value = sessionStorage.getItem("email");
    } else {
        window.location.href = "./login.html";
    }
});
indietro.onclick = () => {
    window.history.back();
}

conferma.onclick = async() =>{
    newPassword.classList.remove("border-danger");
    newPassword.classList.remove("border-success");
    let rsp = await fetch("/changePassword",{
        method: "POST",
        headers:{
            "content-type": "application/json"
        },
        body:JSON.stringify({
            username: sessionStorage.getItem("email"),
            newPassword: newPassword.value
        })
    });
    rsp = await rsp.json();
    if(rsp.result){
        newPassword.classList.add("border-success");
        sessionStorage.setItem("password", newPassword.value);
    }else{
        newPassword.classList.add("border-danger");
    }
    newPassword.value = "";
}

elimina.onclick = async() =>{
    let rsp = await fetch("/deleteAccount",{
        method: "POST",
        headers:{
            "content-type": "application/json"
        },
        body:JSON.stringify({
            username: sessionStorage.getItem("email")
        })
    });
    rsp = await rsp.json();
    if(rsp.result){
        setTimeout(()=>{
            sessionStorage.clear();
            window.location.href="./login.html";
        },1000);
    }
    
}