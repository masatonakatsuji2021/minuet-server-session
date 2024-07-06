"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const minuet_server_session_1 = require("minuet-server-session");
const http = require("http");
minuet_server_session_1.MinuetSessionStatics.saveDir = __dirname + "/sessions";
let ind = 0;
http.createServer((req, res) => {
    const ms = new minuet_server_session_1.MinuetSession(req, res);
    /*
        ms.set("test1", "123456789");
    
        ind++;
        if (ind % 5 == 0) {
            ms.refreshSSID();
        }
    */
    console.log(ms.get());
    ms.set("aaa", "bbnnn");
    console.log(ms.get());
    res.setHeader("content-type", "text/plain");
    res.write("OK");
    res.end();
}).listen(9199);
console.log("Listen http://localhost:9199");
