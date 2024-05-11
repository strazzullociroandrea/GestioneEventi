const express = require("express");
const http = require("http");
const app = express();
const path = require("path");
const bodyParser = require("body-parser");
const fs = require("fs");
const conf = JSON.parse(fs.readFileSync("conf.json"));
const db = require("./server/db.js");
const emailer = require("./server/email.js");
const { Server } = require("socket.io");

const bcrypt = require("bcrypt");
const saltRounds = 10;

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
    const eventiSospesi = [];
    array.forEach((utente) => {
      console.log(utente);
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
                io.to(socket.id).emit(
                  "loginSucc",
                  "Accesso effettuato con successo"
                );
              } else {
                associazioni.push({ email, socket: socket.id });
                io.to(socket.id).emit(
                  "loginSucc",
                  "Accesso effettuato con successo"
                );
              }
              io.to(socket.id).emit(
                "loginSucc",
                "Accesso effettuato con successo"
              );
            } else {
              io.to(socket.id).emit("loginSucc", "Credenziali errate");
            }
          });
        } else {
          io.to(socket.id).emit("loginSucc", "Credenziali errate");
        }
      });
    });
    socket.on("getEvento", async (idEvento) => {
      //bisogna conrtollare che chi lo vuole vedere sia un invitato o il proprietario altrimenti restituisce un arrya vuoto
      try {
        const rsp = await connectionToDB.executeQuery(
          "SELECT * FROM evento WHERE id=?",
          [idEvento]
        );
        io.to(socket.id).emit("resultGetEvento", { result: rsp });
      } catch (e) {
        console.log(e);
      }
    });

    socket.on("getAllUserEvents", async (email) => {
      if (email !== "") {
        queryGetAllUserEvents(email)
          .then((json) => {
            io.to(socket.id).emit("getResult", { result: json });
          })
          .catch((error) => {
            console.log(error);
            //io.to(socket.id).emit("getResult", { result: [] });
          });
      }
    });
    //manca la possibilità di cambiare/aggiungere immagini e gli invitati
    socket.on("updateEvento", async (dizionario) => {
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
    });
    socket.on("insertEvento", async (evento) => {
      if (
        evento.dataOraScadenza !== "" &&
        evento.tipologia !== "" &&
        /* evento.stato !== "" &&*/
        evento.titolo !== "" &&
        evento.descrizione !== "" &&
        evento.posizione !== "" &&
        evento.email
      ) {
        console.log(evento);
        await queryInsertEvent(evento);
        io.to(socket.id).emit("insertSuccess", {
          result: "OK",
        });
      } else {
        io.to(socket.id).emit("insertSuccess", {
          result: "Non è stato possibile aggiungere l'evento",
        });
      }
    });
  });

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
      console.log(email);
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
      console.log("registrazione error");
      console.log(e);
    }
  });

  /**
   * Reset della password
   */
  app.post("/reset_password", (req, res) => {
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
  });

  app.get("/get-user-invitations", (req, res) => {
    const uid = req.query["user-id"];
    console.log("uid = " + uid);

    const query = `SELECT evento.id, evento.titolo, evento.tipologia, evento.stato, evento.dataOraScadenza, evento.posizione, evento.descrizione, invitare.stato as stato_invito FROM invitare left join evento on invitare.idEvento = evento.id WHERE invitare.idUser=? `;
    connectionToDB.executeQuery(query, [uid]).then((response) => {
      if (response.length > 0) {
        // Creo una password nuova e la mando via mail all'utente
        res.json(response);
      } else {
        // email non presente
        res.json("Nessun invito");
      }
    });
  });

  app.post("/accept-invitation", (req, res) => {
    const { userId, eventId } = req.body;
    const query = `UPDATE invitare SET stato='accettato' WHERE idUser=? AND idEvento=?`;
    connectionToDB.executeQuery(query, [userId, eventId]).then((response) => {
      res.json({ result: "ok" });
    });
  });

  app.post("/reject-invitation", (req, res) => {
    const { userId, eventId } = req.body;
    const query = `UPDATE invitare SET stato='rifiutato' WHERE idUser=? AND idEvento=?`;
    connectionToDB.executeQuery(query, [userId, eventId]).then((response) => {
      res.json({ result: "ok" });
    });
  });

  /**
   *
   */
  server.listen(conf.port, () => {
    console.log("---> server running on port " + conf.port);
  });
})();
