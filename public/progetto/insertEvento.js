const inserisci = document.getElementById('inserisci');
const dataOraScadenza = document.getElementById('dataOraScadenza');
const tipologia = document.getElementById('tipologia');
const stato = document.getElementById('stato');
const titolo = document.getElementById('titolo');
const descrizione = document.getElementById('descrizione');
const posizione = document.getElementById('posizione');

const insertEvent = (dict) => {
    return new Promise((resolve, reject) => {
        fetch("/insertEvent", {
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

inserisci.onclick = () => {
    const event = {
        dataOraScadenzaScadenza: dataOraScadenza.value,
        tipologia: tipologia.value,
        stato: stato.value,
        titolo: titolo.value,
        descrizione: descrizione.value,
        posizione: posizione.value,
    };
    console.log(event);
    insertEvent(event)
        .then((response) => {
            console.log(response);
        });
};