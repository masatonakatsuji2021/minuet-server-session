"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MinuetServerModuleSession = exports.MinuetSession = exports.MinuetSessionStatics = void 0;
const fs = require("fs");
const minuet_server_cookie_1 = require("minuet-server-cookie");
const minuet_server_1 = require("minuet-server");
class MinuetSessionStatics {
}
exports.MinuetSessionStatics = MinuetSessionStatics;
MinuetSessionStatics.saveDir = "/sessions";
MinuetSessionStatics.ssidName = "SSID";
MinuetSessionStatics.ssidLength = 74;
MinuetSessionStatics.refreshAge = 43200;
MinuetSessionStatics.limit = 1209600;
class MinuetSession {
    constructor(req, res) {
        this.data = {};
        this.cookie = new minuet_server_cookie_1.MinuetCookie(req, res);
        this.read();
    }
    read() {
        let sessionFile = MinuetSessionStatics.saveDir + "/" + this.getSSID();
        if (!fs.existsSync(sessionFile))
            return;
        if (!fs.statSync(sessionFile).isFile())
            return;
        const content = fs.readFileSync(sessionFile).toString();
        if (!content)
            return;
        const data = JSON.parse(content);
        if (!data.data)
            return;
        this.data = data.data;
    }
    write(changeSSID) {
        if (!fs.existsSync(MinuetSessionStatics.saveDir))
            fs.mkdirSync(MinuetSessionStatics.saveDir);
        if (!fs.statSync(MinuetSessionStatics.saveDir).isDirectory())
            fs.mkdirSync(MinuetSessionStatics.saveDir);
        let sessionFile = MinuetSessionStatics.saveDir + "/" + this.getSSID();
        let exists = false;
        let content;
        if (fs.existsSync(sessionFile)) {
            if (fs.statSync(sessionFile).isFile()) {
                content = fs.readFileSync(sessionFile).toString();
                if (content)
                    exists = true;
            }
        }
        const d = new Date();
        let sessionData;
        if (exists) {
            // exist session file
            sessionData = JSON.parse(content);
            if (parseInt(sessionData.limit) < d.getTime() || changeSSID) {
                // limit time over..(refresh ssid)
                let newSsid;
                if (changeSSID) {
                    newSsid = changeSSID;
                }
                else {
                    newSsid = this.makeSSID();
                }
                this.cookie.set(MinuetSessionStatics.ssidName, newSsid);
                fs.unlink(sessionFile, () => { });
                sessionFile = MinuetSessionStatics.saveDir + "/" + newSsid;
                sessionData.limit = d.getTime() + (MinuetSessionStatics.refreshAge * 1000);
                console.log("change session ssid...");
            }
            sessionData.data = this.data;
            fs.writeFile(sessionFile, JSON.stringify(sessionData), () => { });
        }
        else {
            // no exist session file
            sessionData = {
                limit: d.getTime() + (MinuetSessionStatics.refreshAge * 1000),
                data: this.data,
            };
            this.cookie.set(MinuetSessionStatics.ssidName, this.getSSID());
            fs.writeFile(sessionFile, JSON.stringify(sessionData), () => { });
        }
    }
    makeSSID() {
        const lbn = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
        let ssid = "";
        for (let n = 0; n < MinuetSessionStatics.ssidLength; n++) {
            ssid += lbn[Math.round(Math.random() * 1000) % lbn.length];
        }
        return ssid;
    }
    getSSID() {
        if (this.ssid)
            return this.ssid;
        let ssid = this.cookie.get(MinuetSessionStatics.ssidName);
        if (!ssid)
            ssid = this.makeSSID();
        this.ssid = ssid;
        this.cookie.set(MinuetSessionStatics.ssidName, this.ssid, {
            maxAge: MinuetSessionStatics.limit,
        });
        return this.ssid;
    }
    get(name) {
        if (name) {
            if (this.data[name]) {
                return this.data[name];
            }
        }
        else {
            return this.data;
        }
    }
    set(name, value) {
        this.data[name] = value;
        this.write();
        return this;
    }
    refreshSSID() {
        const changeSSID = this.makeSSID();
        this.write(changeSSID);
        return this;
    }
    delete(name) {
    }
}
exports.MinuetSession = MinuetSession;
class MinuetServerModuleSession extends minuet_server_1.MinuetServerModuleBase {
}
exports.MinuetServerModuleSession = MinuetServerModuleSession;
