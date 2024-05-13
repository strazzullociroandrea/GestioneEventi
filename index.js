import { createRequire } from "module";
import { Storage, File } from "megajs";
import * as url from "url";
import express from "express";
import http from "http";
const app = express();
import path from "path";
import bodyParser from "body-parser";
import fs from "fs";
const conf = JSON.parse(fs.readFileSync("conf.json"));
import { fileURLToPath } from "url";
import { dirname } from "path";
import multer from "multer";
import db from "./server/db.js";
import emailer from "./server/email.js";
import { megaFunction } from "./server/mega.js";
import { Server } from "socket.io";

import bcrypt from "bcrypt";
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: Infinity, // Accetta file di qualsiasi dimensione
  },
  allowUploadBuffering: true, // Abilita il buffering del file
});
const saltRounds = 10;
//mancano i controlli sicurezza e inviti in tempo reale tramite notifica, manca la possibilità di eliminare un evento solo se si è il proprietario ed anche di contrassegnarlo come completato
const __dirname = path.dirname(new URL(import.meta.url).pathname);

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(bodyParser.json({ limit: "10gb" }));

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
    const eventiSospesi = [];
    array.forEach((utente) => {
      //console.log(utente);
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
      }
    });
    resolve();
  });
};

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

//gestione socket
(() => {
  const connectionToDB = db(conf, fs);

  const queryInsertEvent = (dict) => {
    //non aggiunge gli invitati..
    const sql = `INSERT INTO evento (dataOraScadenza, tipologia, titolo, descrizione, immagine, posizione, idUser) VALUES ('${dict.dataOraScadenza}', '${dict.tipologia}', '${dict.titolo}', '${dict.descrizione}', '${dict.immagine}', '${dict.posizione}', (SELECT id FROM user WHERE username = '${dict.email}'))`;
    return connectionToDB.executeQuery(sql);
  };

  const queryGetAllUserEvents = (email) => {
    const sql = `SELECT evento.* FROM evento INNER JOIN user ON evento.idUser = user.id WHERE user.username = '${email}'`;
    return connectionToDB.executeQuery(sql);
  };

  const queryDeleteEvento = (dict) => {
    const sql = `DELETE FROM evento WHERE id = ${dict.idEvento}`;
    return connectionToDB.executeQuery(sql);
  };

  const queryGetUserIdOfEvent = (idEvent) => {
    const sql = `SELECT idUser FROM evento WHERE id = ${idEvent}`;
    return connectionToDB.executeQuery(sql);
  };

  const queryUtentiInvitati = (idEvent) => {
    const sql = `SELECT invitare.idUser from invitare JOIN evento ON invitare.idEvento = evento.id WHERE invitare.idEvento =${idEvent}`;
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
                io.to(socket.id).emit("loginSucc", -1);
              }
            });
          } else {
            io.to(socket.id).emit("loginSucc", -1);
          }
        });
      } catch (e) {
        io.to(socket.id).emit("loginSucc", e);
      }
    });
    socket.on("getEvento", async (idEvento) => {
      //bisogna conrtollare che chi lo vuole vedere sia un invitato o il proprietario altrimenti restituisce un arrya vuoto
      try {
        //bisogna prendere anche gli inviti solo se sono accettati
        const rsp = await connectionToDB.executeQuery(
          "SELECT * FROM evento WHERE id=?",
          [idEvento]
        );
        io.to(socket.id).emit("resultGetEvento", { result: rsp });
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
                "SELECT user.username FROM user INNER JOIN evento ON evento.idUser = user.id";
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
            "UPDATE invitare SET stato = 'Accettato' WHERE idEvento = ? AND idUser = ?";
          await connectionToDB.executeQuery(sqlUpdate, [idEvento, idUser]);
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
          io.to(socket.id).emit("rifiutaInvitoRes", true);
        } else {
          io.to(socket.id).emit("rifiutaInvitoRes", false);
        }
      } catch (e) {
        io.to(socket.id).emit("rifiutaInvitoRes", e);
      }
    });
    socket.on("getAllUserEvents", async (email) => {
      try {
        if (email !== "") {
          queryGetAllUserEvents(email)
            .then((json) => {
              io.to(socket.id).emit("getResult", { result: json });
            })
            .catch((error) => {
              //console.log(error);
              io.to(socket.id).emit("getResult", { result: [] });
            });
        }
      } catch (e) {
        io.to(socket.id).emit("getResult", { result: e });
      }
    });
    //manca la possibilità di cambiare/aggiungere immagini e gli invitati
    socket.on("updateEvento", async (dizionario) => {
      try {
        const {
          id,
          dataOraScadenza,
          tipologia,
          stato,
          titolo,
          descrizione,
          posizione,
        } = dizionario;
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
          io.to(socket.id).emit("resultUpdateEvento", {
            result: "Id evento non settato",
          });
        }
      } catch (e) {
        io.to(socket.id).emit("resultUpdateEvento", { result: e });
      }
    });
    //servizio per inserire un evento - controllare che ci siano persone invitate che non sono iscritte
    socket.on("insertEvento", async (evento) => {
      try {
        if (
          evento.dataOraScadenza !== "" &&
          evento.tipologia !== "" &&
          evento.titolo !== "" &&
          evento.descrizione !== "" &&
          evento.posizione !== "" &&
          evento.email
        ) {
          console.log("MArameo2);")
          await queryInsertEvent(evento);
          console.log("OK");
          //da richiamare in questo modo per notificare gli invitati
          //invita(evento.invitati, evento 'invitato');
          io.to(socket.id).emit("insertSuccess", {
            result: "OK",
          });
        } else {
          console.log("NO");
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

  //da trasformare in socket ed inviare la notifica ai client che quando la ricevono rifanno il render della pagina
  app.post("/deleteEvento", (req, res) => {
    const event = req.body.event;
    if (event.idEvento !== "" && event.idUtente !== "") {
      queryUtentiInvitati(event.idEvento)
        .then((result) => {
          const array = [];
          result.forEach((e) => {
            array.push(e.idUser);
          });
          invita(array, event.idEvento, "elimina")
            .then(() => {
              queryGetUserIdOfEvent(event.idEvento)
                .then((json) => {
                  if (json[0].idUser == event.idUtente) {
                    queryDeleteEvento(event)
                      .then(() => {
                        res.json({ result: "ok" });
                      })
                      .catch((error) => {
                        res.json({ result: "errore nella delete: " + error });
                      });
                  }
                })
                .catch((error) => {
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
        })
        .catch((error) => {
          res.json({
            result:
              "errore nelle select degli utenti invitati all'evento: " + error,
          });
        });
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
        res.json({ result: "errore - le password non coincidono" });
        errors = true;
      }
      //console.log(email);
      // Controllo che sia del Molinari
      const splitted = email.split("@");
      if (splitted[1] != "itis-molinari.eu") {
        res.json({
          result: "errore - email non valida - Non sei del nostro istituto!!!",
        });
        errors = true;
      }

      // Controllo che l'email non sia già stata registrata
      const query = `SELECT * FROM user WHERE username=?`;
      if (!errors) {
        connectionToDB.executeQuery(query, [email]).then((response) => {
          if (response.length > 0) {
            res.json({ result: "errore - email già registrata" });
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
                .catch((err) => console.error(err.message));
            });
          }
        });
      }
    } catch (e) {
      //console.log("registrazione error");
      //console.log(e);
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
        console.log("File caricato con successo. Path: ", fileName);
        res.json({ result: true, link });
      } else {
        res.json({
          result: false,
        });
      }
    } catch (e) {
      //console.log(e);
      res.json({
        result: false,
      });
    }
  });

  app.get("/getImage", async (req, res) => {
    try {
      console.log("ci sono ----");
      const link = req.query.link;
      console.log("link", link);
      if (link) {
        const { stream, fileName } = await megaFunction.downloadFileFromLink(
          link
        );
        console.log("File scaricato con successo. Path: ", fileName);
        res.download(stream);
      } else {
        res.json({
          result: false,
        });
      }
    } catch (e) {
      //console.log(e);
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
              .catch((err) => console.error(err.message));
          });
        } else {
          // email non presente
          res.json("email errata");
        }
      });
    } catch (e) {
      //console.log(e);
    }
  });
  app.post("/changePassword", async (req, res) => {
    const { username, newPassword } = req.body;
    if (username && username != "" && newPassword && newPassword != "") {
      bcrypt.hash(newPassword, saltRounds).then(async (hashed_password) => {
        const sql = "UPDATE user SET password = ? WHERE username = ?";
        await connectionToDB.executeQuery(sql, [hashed_password, username]);
        res.json({ result: true });
      });
    } else {
      res.json({ result: false });
    }
  });
  app.post("/getEvento", async (req,res) => {
    //bisogna conrtollare che chi lo vuole vedere sia un invitato o il proprietario altrimenti restituisce un arrya vuoto
    try {
      const idEvento = req.body.idEvento;
      const email = req.body.email;
      //bisogna prendere anche gli inviti solo se sono accettati
      const rsp1 = await connectionToDB.executeQuery(
        "SELECT * FROM evento WHERE id=?",
        [idEvento]
      );
      res.json({ result: rsp1 });
    } catch (e) {
      res.json({ result: e });
    }
  });
  app.post("/deleteAccount", async (req, res) => {
    const { username } = req.body;
    if (username && username != "") {
      const sql = "DELETE user  WHERE username = ?";
      await connectionToDB.executeQuery(sql, [username]);
      res.json({ result: true });
    } else {
      res.json({ result: false });
    }
  });

  const queryGetOtherUsers = (userId) => {
    const sql = `SELECT id,username FROM user WHERE id <> ?`;
    return connectionToDB.executeQuery(sql, [userId]);
  };

  app.get("/getOtherUsers", async (req, res) => {
    const { userId } = req.query;
    let results = await queryGetOtherUsers(userId);
    console.log("userId = ", userId, results);
    res.json(results);
  });

  app.post("/invitaUtenti", async (req, res) => {
    const userIds = req.body.userIds;
    console.log("utenti", userIds, req.body);
  });

  /**
   *Avvio del serever
   */
  server.listen(conf.port, () => {
    //console.log("---> server running on port " + conf.port);
  });
})();
