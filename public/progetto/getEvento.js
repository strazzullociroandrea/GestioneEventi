const idEvento = document.getElementById("idEvento");
const ricerca = document.getElementById("ricerca");
const socket = io();

ricerca.onclick = () =>{
    socket.emit("getEvento",parseInt(idEvento.value));
    idEvento.value = "";
}

socket.on("resultGetEvento", (result)=>{
    console.log(result);
})