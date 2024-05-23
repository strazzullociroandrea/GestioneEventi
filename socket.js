import bcrypt from "bcrypt";
import fs from "fs";
const conf = JSON.parse(fs.readFileSync("conf.json"));
import emailer from "./server/email.js";

const socket = (io, connectionToDB, associazioni) => {
    const queryInsertEvent = (dict, connectionToDB) => {
        const sql = `INSERT INTO evento 
        (dataOraScadenza, tipologia, titolo, descrizione, immagine, posizione, idUser) 
        VALUES (?, ?, ?, ?, ?, ?, (SELECT id FROM user WHERE username = ?))`;
        const values = [
            dict.dataOraScadenza,
            dict.tipologia,
            dict.titolo,
            dict.descrizione,
            dict.immagine,
            dict.posizione,
            dict.email,
        ];
        return connectionToDB.executeQuery(sql, values);
    };

    const queryGetAllUserEvents = (email, connectionToDB) => {
        const sql = `SELECT evento.*, user.username AS proprietario FROM evento INNER JOIN user ON evento.idUser = user.id WHERE user.username = '${email}' ORDER BY evento.dataOraScadenza`;
        return connectionToDB.executeQuery(sql);
    };
    const queryEventiInvitati = (email, connectionToDB) => {
        const sql = `SELECT evento.* FROM evento INNER JOIN invitare ON evento.id = invitare.idEvento INNER JOIN user ON user.id = invitare.idUser WHERE invitare.stato = 'accettato' AND user.username = '${email}' ORDER BY evento.dataOraScadenza`;
        return connectionToDB.executeQuery(sql);
    };
    io.on("connection", (socket) => {
        let emailGlobale;
        socket.on("login", async (dizionario) => {
            try {
                const { email, password } = dizionario;
                const query = `SELECT * FROM user WHERE username=?`;
                connectionToDB.executeQuery(query, [email]).then((response) => {
                    if (response.length > 0) {
                        const hashed_password = response[0].password;
                        bcrypt.compare(password, hashed_password).then((result) => {
                            if (result) {
                                emailGlobale = email;
                                const oldAssocIndex = associazioni.findIndex(
                                    (a) => a.email === emailGlobale
                                );
                                if (oldAssocIndex !== -1) {
                                    associazioni.splice(oldAssocIndex, 1);
                                    associazioni.push({ email, socket: socket.id });
                                    io.to(socket.id).emit("loginSucc", response[0].id);
                                } else {
                                    associazioni.push({ email, socket: socket.id });

                                    io.to(socket.id).emit("loginSucc", response[0].id);
                                }
                                io.to(socket.id).emit("loginSucc", response[0].id);
                            } else {
                                console.log("password non corretta");
                                io.to(socket.id).emit("loginSucc", "Password non corretta");
                            }
                        });
                    } else {
                        io.to(socket.id).emit("loginSucc", "Utente non registrato");
                    }
                });
            } catch (e) {
                console.log(e);
                io.to(socket.id).emit("loginSucc", e);
            }
        });
        socket.on("getEvento", async (idEvento, emailUtente) => {
            //bisogna conrtollare che chi lo vuole vedere sia un invitato o il proprietario altrimenti restituisce un arrya vuoto
            try {
                const rsp = await connectionToDB.executeQuery(
                    "SELECT * FROM evento WHERE id=? AND (evento.idUser = (SELECT id FROM user WHERE username = ?) OR evento.id IN (SELECT idEvento FROM invitare WHERE idUser = (SELECT id FROM user WHERE username = ?)))",
                    [idEvento, emailUtente, emailUtente]
                );

                io.to(socket.id).emit("resultGetEvento", { result: rsp || [] });
            } catch (e) {
                io.to(socket.id).emit("resultGetEvento", { result: e });
            }
        });
        //funzione per recuperare gli inviti - stato=> 'Da accettare'
        socket.on("getInviti", async (email) => {
            try {
                if (email && email !== "") {
                    const sql =
                        "SELECT evento.titolo, invitare.idUser, invitare.idEvento FROM evento INNER JOIN invitare ON evento.id = invitare.idEvento INNER JOIN user ON user.id = invitare.idUser WHERE user.username = ? AND invitare.stato = 'Da accettare'";
                    const titoli = await connectionToDB.executeQuery(sql, [email]);
                    const final = [];
                    await Promise.all(
                        titoli.map(async (titolo) => {
                            const sqlProprietario =
                                "SELECT user.username FROM user INNER JOIN evento ON evento.idUser = user.id WHERE titolo = ?";
                            const username = await connectionToDB.executeQuery(
                                sqlProprietario,
                                [titolo.titolo]
                            );
                            final.push({
                                titolo: titolo.titolo,
                                proprietario: username[0].username,
                                idUser: titolo.idUser,
                                idEvento: titolo.idEvento,
                            });
                        })
                    );
                    io.to(socket.id).emit("resultGetInviti", { result: final });
                } else {
                    io.to(socket.id).emit("resultGetInviti", { result: [] });
                }
            } catch (e) {
                io.to(socket.id).emit("resultGetInviti", { result: e });
            }
        });
        //servizio per accettare l'invito
        socket.on("accettaInvito", async (dizionario) => {
            try {
                const { idEvento, idUser } = dizionario;
                if (idEvento && idEvento != "" && idUser && idUser != "") {
                    const sqlUpdate =
                        "UPDATE invitare SET stato = 'Accettato' WHERE idEvento = ? AND idUser = ? AND stato = 'Da Accettare' ";
                    await connectionToDB.executeQuery(sqlUpdate, [idEvento, idUser]);
                    const eventoSql = "SELECT * FROM evento INNER JOIN user ON user.id = evento.idUser WHERE id= ? ";
                    const evento = await connectionToDB.executeQuery(eventoSql, [idEvento]);
                    const partecipanteSql = "SELECT username FROM user INNER JOIN invitare ON invitare.idUser = user.id WHERE idEvento = ?";
                    const partecipante = await connectionToDB.executeQuery(partecipanteSql, [idUser]);
                    emailer.send(
                        conf,
                        evento[0].username,
                        "Invito accettato",
                        "Ciao <strong>" +
                        evento[0].username +
                        "</strong>. <br>L'utente <strong>" + partecipante[0].username + "</strong> ha accettato il tuo invito."
                    );
                    io.to(socket.id).emit("accettaInvitoRes", true);
                } else {
                    io.to(socket.id).emit("accettaInvitoRes", false);
                }
            } catch (e) {
                io.to(socket.id).emit("accettaInvitoRes", e);
            }
        });
        //servizio per rifiutare l'invito
        socket.on("rifiutaInvito", async (dizionario) => {
            try {
                const { idEvento, idUser } = dizionario;
                if (idEvento && idEvento != "" && idUser && idUser != "") {
                    const sqlUpdate =
                        "UPDATE invitare SET stato = 'Non accettato' WHERE idEvento = ? AND idUser = ?";
                    await connectionToDB.executeQuery(sqlUpdate, [idEvento, idUser]);
                    const eventoSql = "SELECT * FROM evento INNER JOIN user ON user.id = evento.idUser WHERE id= ? ";
                    const evento = await connectionToDB.executeQuery(eventoSql, [idEvento]);
                    const partecipanteSql = "SELECT username FROM user INNER JOIN invitare ON invitare.idUser = user.id WHERE idEvento = ?";
                    const partecipante = await connectionToDB.executeQuery(partecipanteSql, [idUser]);
                    emailer.send(
                        conf,
                        evento[0].username,
                        "Invito non accettato",
                        "Ciao <strong>" +
                        evento[0].username +
                        "</strong>. <br>L'utente <strong>" + partecipante[0].username + "</strong> non ha accettato il tuo invito."
                    );
                    io.to(socket.id).emit("rifiutaInvitoRes", true);
                } else {
                    io.to(socket.id).emit("rifiutaInvitoRes", false);
                }
            } catch (e) {
                io.to(socket.id).emit("rifiutaInvitoRes", e);
            }
        });
        const proprietario = (json2) => {
            return new Promise(async (resolve, reject) => {
                const promises = json2.map(async (json2Mini) => {
                    const { id } = json2Mini;
                    const proprietario = await connectionToDB.executeQuery(
                        "SELECT username FROM user INNER JOIN evento ON user.id = evento.idUser WHERE evento.id = ?",
                        [id]
                    );
                    json2Mini['proprietario'] = proprietario[0].username;
                    return json2Mini;
                });
                const jsonFIn = await Promise.all(promises);
                resolve(jsonFIn);
            })
        }
        socket.on("getAllUserEvents", async (email) => {
            try {
                if (email !== "") {
                    const json = await queryGetAllUserEvents(email, connectionToDB);
                    const json2 = await queryEventiInvitati(email, connectionToDB);
                    const prop = await proprietario(json2);
                    io.to(socket.id).emit("getResult", {
                        result: [...json, ...prop],
                    });
                }
            } catch (e) {
                io.to(socket.id).emit("getResult", { result: e });
            }
        });
        //servizio per inserire un evento
        socket.on("insertEvento", async (evento) => {
            console.log("Insert evento");
            try {
                if (
                    evento.dataOraScadenza !== "" &&
                    evento.tipologia !== "" &&
                    evento.titolo !== "" &&
                    evento.descrizione !== "" &&
                    evento.posizione !== "" &&
                    evento.email
                ) {
                    console.log(evento);
                    await queryInsertEvent(evento, connectionToDB);
                    console.log("insert successo");
                    io.to(socket.id).emit("insertSuccess", {
                        result: "OK",
                    });
                } else {
                    console.log("evento non aggiunto");
                    io.to(socket.id).emit("insertSuccess", {
                        result: "Non è stato possibile aggiungere l'evento",
                    });
                }
            } catch (e) {
                console.log(e);
                io.to(socket.id).emit("insertSuccess", { result: e });
            }
        });
    });
}

export default socket;