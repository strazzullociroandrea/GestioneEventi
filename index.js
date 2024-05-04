const express = require("express");
const http = require("http");
const app = express();
const path = require("path");
const bodyParser = require("body-parser");
const fs = require("fs");
const conf = JSON.parse(fs.readFileSync("conf.json"));
const db = require("./server/db.js");
const { Server } = require("socket.io");
app.use(bodyParser.json());
app.use(
    bodyParser.urlencoded({
        extended: true,
    })
);
app.use("/", express.static(path.join(__dirname, "public")));
const server = http.createServer(app);
const io = new Server(server);
const associazioni = []; //contiene {email: email, socket: socket.id}
/**
 * Funzione per inviare agli utenti invitati la notifica di invito
 * @param {*} array array di utenti invitati all'evento
 * @param {*} evento evento in questione
 * @param {*} ev evento della socket
 * @returns promise
 */
const invita = (array, evento, ev) => {
    return new Promise((resolve, reject) => {
        array.forEach(utente => {
            const associazione = associazioni.find(element => {
                return element?.email == utente;
            });
            if (associazione && associazione != null) {
                io.to(associazione.socket).emit(ev, { "message": "Sei stato invitato ad un nuovo evento", evento });
            } else {
                //gestione eventi utente invitato - sospesi per offline
                const user = eventiSospesi.findIndex(element => element?.email == utente);
                if (user != -1) {
                    eventiSospesi[user]['eventi'].push(evento);
                } else {
                    eventiSospesi.push({ email: utente, eventi: [evento] });
                }
            }
        })
        resolve();
    })
}
(() => {
    const connectionToDB = db(conf, fs);
    io.on("connection", (socket) => {
        socket.on("getEvento", async (idEvento) => {
            const rsp = await connectionToDB.executeQuery("SELECT * FROM evento WHERE id=?", [idEvento]);
            io.to(socket.id).emit("resultGetEvento", { result: rsp });
        });
        //manca la possibilità di cambiare/aggiungere immagini e gli invitati
        socket.on("updateEvento", async (dizionario) => {
            const { id, dataOraScadenza, tipologia, stato, titolo, descrizione, posizione } = dizionario;
            if (id != "") {
                let query = "UPDATE evento SET ";
                const array = [];
                if (dataOraScadenza != "") {
                    query += " dataOraScadenza = ?";
                    array.push(dataOraScadenza);
                }
                if (tipologia != "") {
                    query += " tipologia = ?";
                    array.push(tipologia);
                }
                if (stato != "") {
                    query += " stato = ?";
                    array.push(stato);
                }
                if (titolo != "") {
                    query += " titolo = ?";
                    array.push(titolo);
                }
                if (descrizione != "") {
                    query += " descrizione = ?";
                    array.push(descrizione);
                }
                if (posizione != "") {
                    query += " posizione = ?";
                    array.push(posizione);
                }
                query += "WHERE id=? SET";
                if (array.length > 0) {
                    const rsp = await connectionToDB.executeQuery(query, array);
                    io.to(socket.id).emit("resultUpdateEvento", { result: rsp });
                } else {
                    io.to(socket.id).emit("resultUpdateEvento", { result: false });
                }
            } else {
                io.to(socket.id).emit("resultUpdateEvento", { result: "Id evento non settato" });
            }

        });
    });

    const queryInsertEvent = (dict) => {
        const sql = `INSERT INTO evento (dataOraScadenza, tipologia, stato, titolo, descrizione, posizione, idUser) VALUES ('${dict.dataOraScadenza}', '${dict.tipologia}', '${dict.stato}', '${dict.titolo}', '${dict.descrizione}', '${dict.posizione}', ${dict.idUser})`;
        return connectionToDB.executeQuery(sql);
    };

    const queryGetAllUserEvents = (dict) => {
        const sql = `SELECT * FROM evento WHERE idUser = ${dict.idUser}`;
        return connectionToDB.executeQuery(sql);
    };

    const queryDeleteEvento = (dict) => {
        const sql = `DELETE FROM evento WHERE id = ${dict.idEvento}`;
        return connectionToDB.executeQuery(sql);
    };

    const queryGetUserIdOfEvent = (idEvent) => {
        const sql = `SELECT idUser FROM evento WHERE id = ${idEvent}`;
        return connectionToDB.executeQuery(sql);
    }

    app.post("/insertEvent", (req, res) => {
        const event = req.body.event;
        if (event.dataOraScadenza !== "" && event.tipologia !== "" && event.stato !== "" && event.titolo !== "" && event.descrizione !== "" && event.posizione !== "" && event.idUser !== "") {
            queryInsertEvent(event)
                .then((json) => {
                    res.json({ result: "ok" });
                })
                .catch((error) => {
                    res.json({ result: "error" });
                });
        };
    });

    app.post("/getAllUserEvents", (req, res) => {
        const event = req.body.event;
        if (event.idUser !== "") {
            queryGetAllUserEvents(event)
                .then((json) => {
                    res.json({ result: json });
                })
                .catch((error) => {
                    res.json({ result: "error" });
                });
        };
    });

    app.post("/deleteEvento", (req, res) => {
        const event = req.body.event;
        if (event.idEvento !== "" && event.idUtente !== "") {
            queryGetUserIdOfEvent(event.idEvento)
                .then((json) => {
                    if (json[0].idUser == event.idUtente) {
                        queryDeleteEvento(event)
                            .then((json) => {
                                res.json({ result: "ok" });
                            })
                            .catch((error) => {
                                res.json({ result: "error" });
                            });
                    }
                })
        };
    });

    server.listen(conf.port, () => {
        console.log("---> server running on port " + conf.port);
    });
})()
