import * as fs from "fs";
import { MinuetCookie } from "minuet-server-cookie";
import { MinuetServerModuleBase } from "minuet-server";
import { IncomingMessage, ServerResponse } from "http";

export class MinuetSessionStatics {
    public static saveDir : string = "/sessions";
    public static ssidName : string = "SSID";
    public static ssidLength : number = 74;
    public static refreshAge : number = 43200;
    public static limit : number = 1209600;
}

export class MinuetSession {

    private cookie : MinuetCookie;
    private ssid : string;
    private data : {[name: string] : any} = {};

    public constructor(req: IncomingMessage, res : ServerResponse) {
        this.cookie = new MinuetCookie(req, res);
        this.read();
    }

    private read() {
        let sessionFile = MinuetSessionStatics.saveDir + "/" + this.getSSID();

        if (!fs.existsSync(sessionFile)) return;
        if (!fs.statSync(sessionFile).isFile()) return;

        const content = fs.readFileSync(sessionFile).toString();
        if (!content) return;

        const data = JSON.parse(content);
        if(!data.data) return;

        this.data = data.data;
    }

    private write(changeSSID? : string) {
        if (!fs.existsSync(MinuetSessionStatics.saveDir)) fs.mkdirSync(MinuetSessionStatics.saveDir);
        if (!fs.statSync(MinuetSessionStatics.saveDir).isDirectory()) fs.mkdirSync(MinuetSessionStatics.saveDir);

        let sessionFile = MinuetSessionStatics.saveDir + "/" + this.getSSID();

        let exists : boolean = false;
        let content : string;
        if (fs.existsSync(sessionFile)) {
            if (fs.statSync(sessionFile).isFile()){
                content = fs.readFileSync(sessionFile).toString();
                if (content) exists = true;
            }
        }

        const d = new Date();

        let sessionData;
        if (exists) {
            // exist session file
            sessionData = JSON.parse(content);
            if (parseInt(sessionData.limit) < d.getTime() || changeSSID) {
                // limit time over..(refresh ssid)
                let newSsid : string;
                if (changeSSID) {
                    newSsid = changeSSID;
                }
                else {
                    newSsid = this.makeSSID();
                }
                this.cookie.set(MinuetSessionStatics.ssidName, newSsid);
                fs.unlink(sessionFile, ()=>{});
                sessionFile = MinuetSessionStatics.saveDir + "/" + newSsid;
                sessionData.limit = d.getTime() + (MinuetSessionStatics.refreshAge * 1000);
                console.log("change session ssid...");
            }
            sessionData.data = this.data;
            fs.writeFile(sessionFile, JSON.stringify(sessionData), ()=>{});
        }
        else {
            // no exist session file
            sessionData = {
                limit: d.getTime() + (MinuetSessionStatics.refreshAge * 1000),
                data: this.data,
            };
            this.cookie.set(MinuetSessionStatics.ssidName, this.getSSID());
            fs.writeFile(sessionFile, JSON.stringify(sessionData), ()=>{});
        }
    }

    private makeSSID() {
        const lbn : string = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
        let ssid : string = "";
        for (let n = 0 ; n < MinuetSessionStatics.ssidLength ; n++) {
            ssid += lbn[Math.round(Math.random() * 1000) % lbn.length];
        }
        return ssid;
    }

    public getSSID() {
        if (this.ssid) return this.ssid;
        let ssid : string = this.cookie.get(MinuetSessionStatics.ssidName);
        if (!ssid) ssid = this.makeSSID();
        this.ssid = ssid;
        this.cookie.set(MinuetSessionStatics.ssidName, this.ssid, {
            maxAge: MinuetSessionStatics.limit,
        });
        return this.ssid;
    }

    public get() : any;

    public get(name : string) :any;

    public get(name? : string) : any {
        if (name){
            if (this.data[name]) {
                return this.data[name];
            }    
        }
        else {
            return this.data;
        }
    }

    public set(name : string, value : any) : MinuetSession{
        this.data[name] = value;
        this.write();
        return this;
    }

    public delete(name : string) {


    }

    public refreshSSID() {
        const changeSSID = this.makeSSID();
        this.write(changeSSID);
        return this;
    }

}

export class MinuetServerModuleSession extends MinuetServerModuleBase {}