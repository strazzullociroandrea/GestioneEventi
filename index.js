import express from "express";
import http from "http";
import path from "path";
import bodyParser from "body-parser";
import socket from "./socket.js";
import db from "./server/db.js";
import middleware from "./middleware.js";
import { Server } from "socket.io";
import fs from "fs";




//gestione socket
(() => {
  const app = express();
  const __dirname = path.dirname(new URL(import.meta.url).pathname);
  const server = http.createServer(app);
  const io = new Server(server);
  const conf = JSON.parse(fs.readFileSync("conf.json"));
  const connectionToDB = db(conf, fs);
  const associazioni = []; //contiene {email: email, socket: socket.id}
  app.use(
    bodyParser.urlencoded({
      extended: true,
    })
  );
  app.use(bodyParser.json({ limit: "10gb" }));
  app.use("/", express.static(path.join(__dirname, "public")));

  socket(io, connectionToDB, associazioni);
  middleware(app, connectionToDB, associazioni);
  /**
   *Avvio del server
   */
  server.listen(conf.port, () => {
    console.log("---> server running on port " + conf.port);
  });
})();
