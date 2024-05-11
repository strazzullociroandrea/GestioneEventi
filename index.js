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
//mancano i controlli sicurezza e inviti in tempo reale tramite notifica

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
      try{
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
      }catch(e){
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
    socket.on("getInviti", async (email) => {
      try{
        if (email && email !== "") {
          const sql = "SELECT evento.titolo, invitare.idUser, invitare.idEvento FROM evento INNER JOIN invitare ON evento.id = invitare.idEvento INNER JOIN user ON user.id = invitare.idUser WHERE user.username = ? AND invitare.stato = 'Da accettare'";
          const titoli = await connectionToDB.executeQuery(sql, [email]);
          const final = [];
          await Promise.all(titoli.map(async (titolo) => {
            const sqlProprietario = "SELECT user.username FROM user INNER JOIN evento ON evento.idUser = user.id";
            const username = await connectionToDB.executeQuery(sqlProprietario, [titolo.titolo]);
            final.push({
              titolo: titolo.titolo,
              proprietario: username[0].username,
              idUser: titolo.idUser,
              idEvento: titolo.idEvento
            });
          }));
          io.to(socket.id).emit("resultGetInviti", { result: final });
        } else {
          io.to(socket.id).emit("resultGetInviti", { result: [] });
        }
      }catch(e){
        io.to(socket.id).emit("resultGetInviti", { result: e });
      }
      
    });
    socket.on("accettaInvito", async(dizionario)=>{
      try{
        const {idEvento, idUser} = dizionario;
        if(idEvento && idEvento != "" && idUser && idUser != ""){
          const sqlUpdate = "UPDATE invitare SET stato = 'Accettato' WHERE idEvento = ? AND idUser = ?";
          await connectionToDB.executeQuery(sqlUpdate, [idEvento, idUser]);
          io.to(socket.id).emit("accettaInvitoRes", true);
        }else{
          io.to(socket.id).emit("accettaInvitoRes", false);
        }
      }catch(e){
        io.to(socket.id).emit("accettaInvitoRes", e);
      }
    })
    socket.on("rifiutaInvito", async(dizionario)=>{
      try{
        const {idEvento, idUser} = dizionario;
        if(idEvento && idEvento != "" && idUser && idUser != ""){
          const sqlUpdate = "UPDATE invitare SET stato = 'Non accettato' WHERE idEvento = ? AND idUser = ?";
          await connectionToDB.executeQuery(sqlUpdate, [idEvento, idUser]);
          io.to(socket.id).emit("rifiutaInvitoRes", true);
        }else{
          io.to(socket.id).emit("rifiutaInvitoRes", false);
        }
      }catch(e){
        io.to(socket.id).emit("rifiutaInvitoRes", e);
      }
    })
    socket.on("getAllUserEvents", async (email) => {
      try{
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
      }catch(e){
        io.to(socket.id).emit("getResult", { result: e });
      }
    });
    //manca la possibilità di cambiare/aggiungere immagini e gli invitati
    socket.on("updateEvento", async (dizionario) => {
      try{
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
      }catch(e){
        io.to(socket.id).emit("resultUpdateEvento", { result: e });
      }
      
    });
    socket.on("insertEvento", async (evento) => {
      try{
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
      }catch(e){
        io.to(socket.id).emit("insertSuccess", {result: e});
      }
    });
  });
  //da trasformare in socket
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
    try{
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
    }catch(e){
      console.log(e);
    }
    
  });
  /**
   *
   */
  server.listen(conf.port, () => {
    console.log("---> server running on port " + conf.port);
  });
})();
