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

(() => {
    const connectionToDB = db(conf, fs);
    io.on("connection", (socket) => {
        socket.on("getEvento", async(idEvento)=>{
            const rsp = await connectionToDB.executeQuery("SELECT * FROM evento WHERE id=?",[idEvento]);
            io.to(socket.id).emit("resultGetEvento", {result: rsp});
        });
        //manca la possibilità di cambiare/aggiungere immagini
        socket.on("updateEvento", async(dizionario)=>{
            const {id, dataOraScadenza, tipologia, stato, titolo, descrizione, posizione} = dizionario;
            if(id != "" ){
                let query = "UPDATE evento SET ";
                const array = [];
                if(dataOraScadenza != ""){
                    query += " dataOraScadenza = ?";
                    array.push(dataOraScadenza);
                }
                if(tipologia != ""){
                    query += " tipologia = ?";
                    array.push(tipologia);
                }
                if(stato != ""){
                    query += " stato = ?";
                    array.push(stato);
                }
                if(titolo != ""){
                    query += " titolo = ?";
                    array.push(titolo);
                }
                if(descrizione != ""){
                    query += " descrizione = ?";
                    array.push(descrizione);
                }
                if(posizione != ""){
                    query += " posizione = ?";
                    array.push(posizione);
                }
                query += "WHERE id=? SET";
                if(array.length > 0){
                    const rsp = await connectionToDB.executeQuery(query, array);
                    io.to(socket.id).emit("resultUpdateEvento", {result: rsp});
                }else{
                    io.to(socket.id).emit("resultUpdateEvento", {result: false});
                }
            }else{
                io.to(socket.id).emit("resultUpdateEvento", {result: "Id evento non settato"});
            }
            
        });
    });
    server.listen(conf.port, () => {
        console.log("---> server running on port " + conf.port);
    });
})()
