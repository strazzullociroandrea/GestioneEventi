const idUser = document.getElementById('idUser');
const invia = document.getElementById('invia');
const table = document.getElementById('table');
const logout = document.getElementById("logout");
const socket = io();

window.onload = () =>{
   const user = sessionStorage.getItem("email");
   const password = sessionStorage.getItem("password");
   if(user && user != "" && password && password != ""){
    socket.emit('login', {
        email: user,
        password: password
    });
   }else{
    window.location.href = "./login.html";
   }
}
logout.onclick = () =>{
    sessionStorage.clear();
    window.location.href = "./login.html";
}
socket.on('login', (response) => {
    if (response === "Accesso effettuato con successo") {
        socket.emit("getAllUserEvents",sessionStorage.getItem("email"));
    } else {
        window.location.href = "./login.html";
    }
})
socket.on('getResult', (response) => {
    console.log("Eventi recuperati");
    console.log(response);
})
/*
const getAllUserEvents = (dict) => {
    return new Promise((resolve, reject) => {
        fetch("/getAllUserEvents", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                event: dict,
            }),
        }).then((element) => {
            return element.json();
        }).then((response) => {
            resolve(response);
            console.log(response);
        })
            .catch((error) => {
                reject(error);
                console.log(error);
            });
    });
};

invia.onclick = async() => {
    const dict = {
        idUser: idUser.value,
    }
    const result = await getAllUserEvents(dict);
    render(result.result);
}

const render = (array) => {
    const thead = `<tr> 
    <th>Codice</th>
    <th>Titolo</th>
    <th>Tipologia</th>
    <th>Stato</th>
    <th>Data e ora</th>
    <th>Posizione</th>
    <th>Descrizione</th>
    </tr>`;

    const tbody = `<tr> 
    <td>%CODICE</td>
    <td>%TITOLO</td>
    <td>%TIPOLOGIA</td>
    <td>%STATO</td>
    <td>%DATAORA</td>
    <td>%POSIZIONE</td>
    <td>%DESCRIZIONE</td>
    </tr>`;

    let html = thead;

    array.forEach((e) => {
        const dateTime = new Date(e.dataOraScadenza).toLocaleString();
         html += tbody.replace("%CODICE", e.id).replace("%TITOLO", e.titolo).replace("%TIPOLOGIA", e.tipologia)
        .replace("%STATO", e.stato).replace("%DATAORA", dateTime).replace("%POSIZIONE", e.posizione).replace("%DESCRIZIONE", e.descrizione);
    })

    table.innerHTML = html;
};*/

