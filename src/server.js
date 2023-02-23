"use strict";
import http from "http"; // http는 따로 설치 필요 없음, node.js에 이미 설치되어 있음
import WebSocket from "ws";
import express from "express";

const app = express();

app.set("view engine","pug");
app.set("views",__dirname + "/views");
app.use("/public", express.static(__dirname + '/public'));

app.get("/", (req,res)=>res.render("home"));
app.get("/*", (req,res)=>res.redirect("/")); //catchall, 다른 URL 사용 안하고 홈만 사용 (다른곳으로 가려해도 다시 home으로 보냄)

const handleListen = () => console.log('Listening on http://localhost:3000');

const server = http.createServer(app); //express 으로 서버 생성, 웹소켓을 위해 꼭 필요함 (http 동작)
const wss = new WebSocket.Server({server});//WebSocket 서버 생성 (ws 동작)

function onSocketClose() {
    console.log("Disconnected from Browser");//Browser에서 off하면 연결 끊어졌다는 문구 출력
}

/*function onSocketMessage(message) {
    const translatedMessageData = message.toString('utf8');//Browser로부터 온 메시지가 Buffer로 출력되는 문제 해결 
    console.log(translatedMessageData);//Browser에서 온 메시지 출력
}*/
const sockets = [];

wss.on("connection", (socket) => {
    sockets.push(socket);//Browser에서 연결이 되면 연결 socket을 sockets 배열에 넣어줌
    socket["nickname"] = "Anon"; //nickname 정하지 않은 사람에게 Anon이라는 닉네임 부여
    console.log("Connected to Browser");
    socket.on("close", onSocketClose);
    socket.on("message", (msg) => {
        const translatedmsg = msg.toString('utf8');//Browser로부터 온 메시지가 Buffer로 출력되는 문제 해결
        const message = JSON.parse(translatedmsg);
        console.log(message, translatedmsg);//parsed는 javascript object, translatedMessageData는 string
        switch(message.type){
            case "new_message":
                sockets.forEach((aSocket) => 
                    aSocket.send(`${socket.nickname}: ${message.payload}`)
                    );//연결된 모든 소켓에 접근       
            case "nickname":
                socket["nickname"] = message.payload;//socket안에 데이터를 저장할 수 있음
        }
    });
});

server.listen(3000, handleListen);

{
    type: "message"
    payload: "hello everyone!"
}

{
    type: "nickname"
    payload: "jk"
}