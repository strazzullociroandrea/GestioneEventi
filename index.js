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
  }),
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
          (element) => element?.email == utente,
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
(() => {
  const connectionToDB = db(conf, fs);
  io.on("connection", (socket) => {
    socket.on("getEvento", async (idEvento) => {
      const rsp = await connectionToDB.executeQuery(
        "SELECT * FROM evento WHERE id=?",
        [idEvento],
      );
      io.to(socket.id).emit("resultGetEvento", { result: rsp });
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

  const queryUtentiInvitati = (idEvent) => {
      const sql = `SELECT invitare.idUser from invitare JOIN evento ON invitare.idEvento = evento.id WHERE invitare.idEvento =${idEvent}`;
      return connectionToDB.executeQuery(sql);
  }


  const insertEvent = (dict) => {
    const sql = `INSERT INTO evento (dataOraScadenza, tipologia, stato, titolo, descrizione, posizione, idUser) VALUES (${dict.dataOraScadenza}, ${dict.tipologia}, ${dict.stato}, ${dict.titolo}, ${dict.descrizione}, ${dict.posizione}, ${dict.idUser})`;

    return connectionToDB.executeQuery(sql);
  };

  app.post("/insertEvent", (req, res) => {
    const event = req.body.event;
    if (
      event.dataOraScadenza !== "" &&
      event.tipologia !== "" &&
      event.stato !== "" &&
      event.titolo !== "" &&
      event.descrizione !== "" &&
      event.posizione !== "" &&
      event.idUser
    ) {
      console.log("Event");
      insertEvent(event)
        .then((json) => {
          res.json({ result: "ok" });
        })
        .catch((error) => {
          res.json({ result: "error" });
        });
    }
  });

  app.post("/getAllUserEvents", (req, res) => {
      const event = req.body.event;
      if (event.idUser !== "") {
          queryGetAllUserEvents(event)
              .then((json) => {
                  res.json({ result: json });
              })
              .catch((error) => {
                  res.json({ result: "errore nella select degli eventi dell'utente: " + error });
              });
      };
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
                                  res.json({ result: "errore nella select del proprietario dell'evento: " + error });
                              });
                      })
                      .catch((error) => {
                          res.json({ result: "errore nella funzione invita: " + error });
                      });
              })
              .catch((error) => {
                  res.json({ result: "errore nelle select degli utenti invitati all'evento: " + error});
              });
      } else {
          res.json({ result: "attributi non valorizzati"});
      }
  });

  /**
   * Gabriele -
   * POST di registrazione utente - login - reset password
   */

  /**
   * Controlla se la password fornita dall'utente coincide con quella del database
   */
  function validateUser(password, hash) {
    return new Promise(function (resolve, reject) {
      bcrypt
        .compare(password, hash)
        .then((res) => {
          resolve(res);
        })
        .catch((err) => console.error(err.message));
    });
  }

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

  /**
   * Registrazione di un nuovo utente
   */

  app.post("/register", (req, res) => {
    const { email, password, confirm_password } = req.body;
    let errors = false;
    if (password != confirm_password) {
      // password errate
      res.json({ result: "errore - le password non coincidono" });
      errors = true;
    }

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
                    password,
                );

                res.json({ result: "ok" });
              })
              .catch((err) => console.error(err.message));
          });
        }
      });
    }
  });

  /**
   * Login utente
   */

  app.post("/login", (req, res) => {
    const { email, password } = req.body;
    const query = `SELECT * FROM user WHERE username=?`;
    connectionToDB.executeQuery(query, [email]).then((response) => {
      if (response.length > 0) {
        const hashed_password = response[0].password;
        validateUser(password, hashed_password).then((result) => {
          if (result) {
            res.json("ok password corretta");
          } else {
            res.json("email o password errata");
          }
        });
      } else {
        // email non presente
        res.json("email o password errata");
      }
    });
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
          const query = `UPDATE user SET password = ?`;
          connectionToDB
            .executeQuery(query, [hashed_password])
            .then((response) => {
              // Invio mail di conferma all'utente con la password presente in new_password
              emailer.send(
                conf,
                email,
                "Password reimpostata",
                "La tua nuova password è " + new_password,
              );

              res.json({ "nuova password": new_password });
            })
            .catch((err) => console.error(err.message));
        });
      } else {
        // email non presente
        res.json("email o password errata");
      }
    });
  });

  /**
   *
   */
  server.listen(conf.port, () => {
    console.log("---> server running on port " + conf.port);
  });
})();
