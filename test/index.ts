import { MinuetSession, MinuetSessionStatics } from "minuet-server-session";
import * as http from "http";

MinuetSessionStatics.saveDir = __dirname + "/sessions";

let ind = 0;
http.createServer((req, res)=>{
    const ms = new MinuetSession(req, res);
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
