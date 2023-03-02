"use strict";
import http from "http"; // http는 따로 설치 필요 없음, node.js에 이미 설치되어 있음
import { Server } from "socket.io";
import { instrument } from "@socket.io/admin-ui";
import express from "express";

const app = express();

app.set("view engine","pug");
app.set("views",__dirname + "/views");
app.use("/public", express.static(__dirname + '/public'));

app.get("/", (req,res)=>res.render("home"));
app.get("/*", (req,res)=>res.redirect("/")); //catchall, 다른 URL 사용 안하고 홈만 사용 (다른곳으로 가려해도 다시 home으로 보냄)

const handleListen = () => console.log('Listening on http://localhost:3000');

const httpServer = http.createServer(app); //express 으로 서버 생성, 웹소켓을 위해 꼭 필요함 (http 동작)
const wsServer = new Server(httpServer, {
    cors: {
        origin: ["https://admin.socket.io"],
        credentials: true,
    }
});

instrument(wsServer,{
    auth:false,
});

function publicRooms(){
    const {
        sockets: {
            adapter: {sids, rooms},
        },
    } = wsServer;//socket안에 들어가서, adapter를 갖고, wsserver에서 sids와 rooms를 가져온다 
    const publicRooms = [];
    rooms.forEach((_, key) => {
        if(sids.get(key) === undefined){
            publicRooms.push(key)
        }
    })
    return publicRooms;
}

function countRoom(roomName){
    return wsServer.sockets.adapter.rooms.get(roomName)?.size;
}

wsServer.on("connection", (socket) =>{
    socket["nickname"] = "Anon";
    socket.onAny((event)=>{
        console.log(wsServer.sockets.adapter);
        console.log(`Socket Event:${event}`);
    });//이벤트 명칭 체크

    socket.on("enter_room", (roomName, done) => {
        console.log(socket.id);//socket id 확인
        socket.join(roomName);//방에 입장하는 명령어
        //console.log(socket.rooms);//방 목록 확인
        done("hello from the backend");//방에 참가하면 done function 호출
        socket.to(roomName).emit("welcome",socket.nickname, countRoom(roomName));//모든 사람에게 emit
        wsServer.sockets.emit("room_change",publicRooms());//방 생성, 변경 되면 알림
    });

    socket.on("disconnecting",()=>{
        socket.rooms.forEach(room => socket.to(room).emit("bye", socket.nickname, countRoom(room) - 1)
        );
    });//disconnecting 기능이 있음(서버 끊기기 전에 메시지 전송 가능)

    socket.on("disconnect",()=>{
        wsServer.sockets.emit("room_change",publicRooms());//방 생성, 변경 되면 알림
    });

    socket.on("new_message", (msg, room, done) => {
        socket.to(room).emit("new_message", `${socket.nickname}: ${msg}`);
        done();
    });
    socket.on("nickname", (nickname) => socket["nickname"] = nickname);
});//서버측 소켓 연결과정

httpServer.listen(3000, handleListen);

{
    type: "message"
    payload: "hello everyone!"
}

{
    type: "nickname"
    payload: "jk"
}