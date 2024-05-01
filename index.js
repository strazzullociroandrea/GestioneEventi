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
    });
    server.listen(conf.port, () => {
        console.log("---> server running on port " + conf.port);
    });
})()
