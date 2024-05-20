import multer from "multer";
import bcrypt from "bcrypt";
import { megaFunction } from "./server/mega.js";
import emailer from "./server/email.js";
import fs from "fs";
import { Storage, File } from "megajs";
const conf = JSON.parse(fs.readFileSync("conf.json"));
const saltRounds = 10;
import invita from "./invita.js";
import path from "path";


const middelware = (app, connectionToDB, associazioni) => {
    /**
 * Genera una nuova password casuale
 */

    function generateRandomString(iLen) {
        var sRnd = "";
        var sChrs = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
        for (var i = 0; i < iLen; i++) {
            var randomPoz = Math.floor(Math.random() * sChrs.length);
            sRnd += sChrs.substring(randomPoz, randomPoz + 1);
        }
        return sRnd;
    }
    const queryDeleteEvento = (dict, connectionToDB) => {
        const sql = `DELETE FROM evento WHERE id = ${dict.idEvento}`;
        return connectionToDB.executeQuery(sql);
    };
    const queryGetUserIdOfEvent = (idEvent, connectionToDB) => {
        const sql = `SELECT idUser FROM evento WHERE id = ${idEvent}`;
        return connectionToDB.executeQuery(sql);
    };
    const queryUtentiInvitati = (idEvent, connectionToDB) => {
        const sql = `SELECT invitare.idUser, user.username from invitare JOIN evento  ON invitare.idEvento = evento.id JOIN user ON user.id = invitare.idUser WHERE invitare.idEvento =${idEvent}`;
        return connectionToDB.executeQuery(sql);
    };
    const upload = multer({
        storage: multer.memoryStorage(),
        limits: {
            fileSize: Infinity, // Accetta file di qualsiasi dimensione
        },
        allowUploadBuffering: true, // Abilita il buffering del file
    });
    app.post("/deleteEvento", async (req, res) => {
        const event = req.body.event;
        const emailCorrente = req.body.emailCorrente;
        if (event.idEvento !== "" && event.idUtente !== "") {
            const selectUser = await connectionToDB.executeQuery(
                "SELECT * FROM evento WHERE id=?",
                [event.idEvento]
            );
            if (event.idUtente == selectUser[0].idUser) { //controllo che l'utente sia il proprietario dell'evento
                queryUtentiInvitati(event.idEvento, connectionToDB)
                    .then((result) => {
                        const array = [];
                        result.forEach((e) => {
                            array.push(e.username);
                        });
                        if (!array.includes(emailCorrente)) {
                            invita(array, event.idEvento, "eliminaRes", associazioni, emailer, conf)
                                .then(() => {
                                    queryGetUserIdOfEvent(event.idEvento, connectionToDB)
                                        .then((json) => {
                                            if (json[0].idUser == event.idUtente) {
                                                queryDeleteEvento(event, connectionToDB)
                                                    .then(() => {
                                                        res.json({ result: "ok" });
                                                    })
                                                    .catch((error) => {
                                                        console.log("errore nella delete: " + error);
                                                        res.json({ result: "errore nella delete: " + error });
                                                    });
                                            }
                                        })
                                        .catch((error) => {
                                            console.log("errore nella select del proprietario dell'evento: " + error);
                                            res.json({
                                                result:
                                                    "errore nella select del proprietario dell'evento: " +
                                                    error,
                                            });
                                        });
                                })
                                .catch((error) => {
                                    res.json({ result: "errore nella funzione invita: " + error });
                                });
                        } else {
                            // Elimina solo l'invito
                            const query = "DELETE FROM invitare WHERE idUser IN (SELECT id FROM user WHERE username = ?)";
                            connectionToDB.executeQuery(query, [emailCorrente])
                                .then(() => {
                                    res.json({ result: "OK" });
                                })
                                .catch((error) => {
                                    res.json({ result: "errore nell'eliminazione dell'invito: " + error });
                                });
                        }
                    })
                    .catch((error) => {
                        res.json({
                            result:
                                "errore nelle select degli utenti invitati all'evento: " + error,
                        });
                    });
            } else {
                res.json({ result: "L'utente non ha il permesso di eliminare l'evento" });
            }
        } else {
            res.json({ result: "attributi non valorizzati" });
        }
    });

    /**
     * Registrazione di un nuovo utente
     */
    app.post("/register", (req, res) => {
        try {
            const { email, password, confirm_password } = req.body;
            let errors = false;
            if (password != confirm_password) {
                // password errate
                res.json({ result: "Le password non coincidono" });
                errors = true;
            }
            // Controllo che sia del Molinari
            const splitted = email.split("@");
            if (splitted[1] != "itis-molinari.eu") {
                res.json({
                    result: "Email non valida - Non sei del nostro istituto!!!",
                });
                errors = true;
            }
            // Controllo che l'email non sia già stata registrata
            const query = `SELECT * FROM user WHERE username=?`;
            if (!errors) {
                connectionToDB.executeQuery(query, [email]).then((response) => {
                    if (response.length > 0) {
                        res.json({ result: "Email già registrata" });
                    } else {
                        // Ok non è registrato
                        // Cripto la password
                        bcrypt.hash(password, saltRounds).then((hashed_password) => {
                            const query = `INSERT INTO user (username, password) VALUES (?, ?)`;
                            connectionToDB
                                .executeQuery(query, [email, hashed_password])
                                .then((response) => {
                                    // Invio mail di conferma
                                    emailer.send(
                                        conf,
                                        email,
                                        "Registrazione Avvenuta con successo",
                                        "Ciao <strong>" +
                                        email +
                                        "</strong>. <br>Grazie per esserti registrato.<br>La tua password è:" +
                                        password
                                    );
                                    res.json({ result: "ok" });
                                })
                                .catch((err) => { })
                        });
                    }
                });
            }
        } catch (e) {
            res.json({ result: "Registrazione fallita" });
        }
    });
    app.post("/download", async (req, res) => {
        const link = req.body.mega;
        try {
            const file = File.fromURL(link); // Ottieni il file da Mega utilizzando l'URL fornito
            await file.loadAttributes(); // Carica gli attributi del file
            const buffer = await file.downloadBuffer(); // Scarica il file come buffer
            res.setHeader("Content-Type", file.type); // Imposta il tipo di contenuto sulla base del tipo di file
            res.setHeader(
                "Content-Disposition",
                `attachment; filename="${file.name}"`
            ); // Imposta l'header per il download del file
            res.send(buffer); // Invia il buffer come risposta al client
        } catch (error) {
            res.status(500).send("Errore del server");
        }
    });
    app.post("/dammiUrl", upload.single("file"), async (req, res) => {
        try {
            const file = req.file;
            if (file) {
                const fileName = path.basename(file.originalname);
                const link = await megaFunction.uploadFileToStorage(
                    fileName,
                    file.buffer
                );
                res.json({ result: true, link });
            } else {
                res.json({
                    result: false,
                });
            }
        } catch (e) {
            console.log(e);
            res.json({
                result: false,
            });
        }
    });

    app.get("/getImage", async (req, res) => {
        try {
            const link = req.query.link;
            if (link) {
                const { stream, fileName } = await megaFunction.downloadFileFromLink(
                    link
                );
                res.download(stream);
            } else {
                res.json({
                    result: false,
                });
            }
        } catch (e) {
            res.json({
                result: false,
            });
        }
    });

    /**
     * Reset della password
     */
    app.post("/reset_password", (req, res) => {
        try {
            const { email } = req.body;
            const query = `SELECT * FROM user WHERE username=?`;
            connectionToDB.executeQuery(query, [email]).then((response) => {
                if (response.length > 0) {
                    // Creo una password nuova e la mando via mail all'utente
                    const new_password = generateRandomString(8);
                    bcrypt.hash(new_password, saltRounds).then((hashed_password) => {
                        const query = `UPDATE user SET password = ? WHERE username = ?`;
                        connectionToDB
                            .executeQuery(query, [hashed_password, email])
                            .then((response) => {
                                // Invio mail di conferma all'utente con la password presente in new_password
                                emailer.send(
                                    conf,
                                    email,
                                    "Password reimpostata",
                                    "La tua nuova password è " + new_password
                                );
                                res.json(true);
                            })
                            .catch((err) => { })
                    });
                } else {
                    // email non presente
                    res.json("email errata");
                }
            });
        } catch (e) {
        }
    });
    app.post("/changePassword", async (req, res) => {
        const { username, newPassword } = req.body;
        if (username && username != "" && newPassword && newPassword != "") {
            bcrypt.hash(newPassword, saltRounds).then(async (hashed_password) => {
                const sql = "UPDATE user SET password = ? WHERE username = ?";
                await connectionToDB.executeQuery(sql, [hashed_password, username]);
                emailer.send(
                    conf,
                    username,
                    "Cambio passoword avvenuta con successo",
                    "Ciao <strong>" +
                    username +
                    "</strong>. <br>La tua password è stata modificata con successo.<br>La tua nuova password è:" +
                    newPassword
                );
                res.json({ result: true });
            });
        } else {
            res.json({ result: false });
        }
    });
    app.post("/getEvento", async (req, res) => {
        try {
            const idEvento = req.body.idEvento;
            const emailUtente = req.body.email;
            //verifico che chi lo vuole vedere è il proprietario o un invitato
            const query = `
                SELECT evento.*, user.username
                FROM evento
                INNER JOIN user ON evento.idUser = user.id
                WHERE evento.id=? 
                AND (evento.idUser = (SELECT id FROM user WHERE username = ?) 
                OR evento.id IN (SELECT idEvento FROM invitare WHERE idUser = (SELECT id FROM user WHERE username = ?) AND stato = 'Accettato'))
            `;
            const rsp = await connectionToDB.executeQuery(query, [idEvento, emailUtente, emailUtente]);
            if (rsp && rsp.length > 0) {
                const invitatiSql = `
              SELECT user.username 
              FROM user 
              INNER JOIN invitare ON user.id = invitare.idUser 
              WHERE invitare.idEvento = ?;
            `;
                const rsp2 = await connectionToDB.executeQuery(invitatiSql, [idEvento]);
                rsp[0]["invitati"] = rsp2;
                res.json({ result: rsp });
            } else {
                res.json({ result: [] });
            }
        } catch (error) {
            res.status(500).json({ error: "Errore durante l'esecuzione della richiesta." });
        }
    });

    app.post("/deleteAccount", async (req, res) => {
        const { username } = req.body;
        if (username && username != "") {
            const sql = "DELETE FROM user WHERE username = ?";
            await connectionToDB.executeQuery(sql, [username]);
            emailer.send(
                conf,
                username,
                "Eliminazione account avvenuta con successo",
                "Ciao <strong>" +
                username +
                "</strong>. <br>Il tuo account è stato eliminato con successo.");
            res.json({ result: true });
        } else {
            res.json({ result: false });
        }
    });

    const queryGetOtherUsers = async (userId, eventId) => {
        try {
            const sql = "SELECT id, username FROM user WHERE id <> ? ";
            const resultGenerali = await connectionToDB.executeQuery(sql, [userId]);
            const giaInvitati = "SELECT idUser FROM invitare WHERE idEvento = ? AND stato <> 'Non accettato'";
            const resultInvitati = await connectionToDB.executeQuery(giaInvitati, [eventId.split("-")[1]]);
            const invitabili = [];
            for (let i = 0; i < resultGenerali.length; i++) {
                let trovato = false;
                for (let j = 0; j < resultInvitati.length; j++) {
                    if (resultGenerali[i].id == resultInvitati[j].idUser && !trovato) {
                        trovato = true;
                    }
                }
                if (!trovato) {
                    invitabili.push(resultGenerali[i]);
                }
            }
            return invitabili;
        } catch (error) {
            console.error('Error fetching uninvited users:', error);
            throw error;
        }
    };

    app.get("/getOtherUsers", async (req, res) => {
        const { userId, eventId } = req.query;
        if (userId && eventId) {
            let results = await queryGetOtherUsers(userId, eventId);
            res.json(results);
        }

    });
    app.post("/invitaUtenti", async (req, res) => {
        const { userIds, eventId, emailCorrente } = req.body;
        try {
            const queryVerifica = "SELECT username FROM user INNER JOIN evento ON user.id = evento.idUser WHERE evento.id = ?";
            const rspp = await connectionToDB.executeQuery(queryVerifica, [eventId.split("-")[1]]);
            if (rspp.length > 0 && rspp[0].username && rspp[0].username === emailCorrente) {
                if (!Array.isArray(userIds) || userIds.length === 0) {
                    return res.status(400).json({ error: "userIds deve essere un array non vuoto" });
                }
                const recupraUsername = "SELECT username FROM user WHERE id = ?";
                const recuperaUsernames = async (userIds) => {
                    const promises = userIds.map(userId =>
                        connectionToDB.executeQuery(recupraUsername, [userId])
                    );
                    const results = await Promise.all(promises);
                    return results.map(result => result[0].username);
                };
                const arrayUsername = await recuperaUsernames(userIds);
                const sqlEvento = "SELECT * FROM evento WHERE id = ?";
                const rsp = await connectionToDB.executeQuery(sqlEvento, [eventId.split("-")[1]]);
                if (rsp.length === 0) {
                    return res.status(404).json({ error: "Evento non trovato" });
                }
                // Notifica gli invitati
                await invita(arrayUsername, rsp[0], 'invitato', associazioni, emailer, conf);
                // Inserisce gli inviti
                let sql = "INSERT INTO invitare (stato, idEvento, idUser) VALUES ";
                sql += userIds.map(userId => `('Da Accettare', ${eventId.split("-")[1]}, ${userId})`).join(",") + ";";
                // Esegue la query per inserire gli inviti
                await connectionToDB.executeQuery(sql);
                res.status(200).json({ message: "Utenti invitati con successo" });
            } else {
                res.status(404).json({ message: "L'utente non è il proprietario dell'invito o l'evento non esiste" });
            }
        } catch (error) {
            console.error("Errore durante l'invito degli utenti:", error);
            res.status(500).json({ error: "Errore durante l'invito degli utenti" });
        }
    });
}

export default middelware;