const express = require("express");
const http = require("http");
const app = express();
const path = require("path");
const bodyParser = require("body-parser");
const fs = require("fs");
const conf = JSON.parse(fs.readFileSync("conf.json"));
(()=>{
    app.use(bodyParser.json());
    app.use(
        bodyParser.urlencoded({
        extended: true,
        })
    );
    app.use("/", express.static(path.join(__dirname, "public")));
    const server = http.createServer(app);
    server.listen(conf.port, () => {
        console.log("---> server running on port "+conf.port);
    });
})()
