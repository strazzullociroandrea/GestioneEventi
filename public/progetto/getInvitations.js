const userId = document.getElementById("user-id");
const buttonSearch = document.getElementById("button-search");
const invitationsTable = document.getElementById("invitations-table");

const getUserInvitations = (uid) => {
    return new Promise((resolve, reject) => {
        fetch("/get-user-invitations/?user-id=" + uid, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        })
            .then((element) => {
                return element.json();
            })
            .then((response) => {
                resolve(response);
                console.log(response);
            })
            .catch((error) => {
                reject(error);
                console.log(error);
            });
    });
};

buttonSearch.onclick = async () => {
    window.location.href = "getInvitations.html?"+"user-id="+userId.value;
//    const result = await getUserInvitations(userId.value);
//    console.log("result", result);
//    render(userId.value, result);
};

const render = (uid, array) => {
    const thead = `<tr> 
    <th>Codice</th>
    <th>Titolo</th>
    <th>Tipologia</th>
    <th>Stato</th>
    <th>Data e ora</th>
    <th>Posizione</th>
    <th>Descrizione</th>
    <th>Stato Invito</th>
    </tr>`;

    const tbody = `<tr> 
    <td>%CODICE</td>
    <td>%TITOLO</td>
    <td>%TIPOLOGIA</td>
    <td>%STATO</td>
    <td>%DATAORA</td>
    <td>%POSIZIONE</td>
    <td>%DESCRIZIONE</td>
    <td>%STATO_INVITO</td>
    </tr>`;

    let html = thead;

    array.forEach((e) => {
        const dateTime = new Date(e.dataOraScadenza).toLocaleString();
        let statoInvito = e.stato_invito;
        if (!statoInvito) {
            statoInvito =
                " <button class='btn btn-primary' onclick='acceptInvitation(" +
                uid +
                "," +
                e.id +
                ")' type='button'>Accetta</button> <button class='btn btn-danger' onclick='rejectInvitation(" +
                uid +
                "," +
                e.id +
                ")' type='button'>Rifiuta</button>";
        }

        html += tbody
            .replace("%CODICE", e.id)
            .replace("%TITOLO", e.titolo)
            .replace("%TIPOLOGIA", e.tipologia)
            .replace("%STATO", e.stato)
            .replace("%DATAORA", dateTime)
            .replace("%POSIZIONE", e.posizione)
            .replace("%DESCRIZIONE", e.descrizione)
            .replace("%STATO_INVITO", statoInvito);
    });

    invitationsTable.innerHTML = html;
};

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const uid = urlParams.get("user-id");
if (uid) {
    userId.value = uid;
    getUserInvitations(userId.value).then((result) => {
        render(userId.value, result);
    });
}
