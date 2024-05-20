
/**
 * Funzione per inviare agli utenti invitati la notifica di invito
 * @param {*} array array di utenti invitati all'evento
 * @param {*} evento evento in questione
 * @param {*} ev evento della socket
 * @returns promise
 */
const invita = (array, evento, ev, associazioni, emailer, conf) => {
    return new Promise((resolve, reject) => {
        const eventiSospesi = [];
        array.forEach((utente) => {
            const associazione = associazioni.find((element) => {
                return element?.email == utente;
            });
            if (associazione && associazione != null) {
                io.to(associazione.socket).emit(ev, {
                    message: "Sei stato invitato ad un nuovo evento",
                    evento,
                });
            } else {
                //gestione eventi utente invitato - sospesi per offline
                const user = eventiSospesi.findIndex(
                    (element) => element?.email == utente
                );
                if (user != -1) {
                    eventiSospesi[user]["eventi"].push(evento);
                } else {
                    eventiSospesi.push({ email: utente, eventi: [evento] });
                }
                emailer.send(
                    conf,
                    utente,
                    "Nuovo evento",
                    "Ciao <strong>" +
                    utente +
                    "</strong>. <br>Sei stato invitato ad un nuovo evento. <br>Accedi alla tua area personale per visualizzarlo."
                );
            }
        });
        resolve();
    });
};

export default invita;