"use strict";
const messageList = document.querySelector("ul");
const messageForm = document.querySelector("#message");
const nicknameForm = document.querySelector("#nickname");
const socket = new WebSocket(`ws://${window.location.host}`);//여기서 socket은 서버로의 연결을 의미함

function makemessage(type, payload){
    const msg = {type, payload}; //메시지 만들 때 object로 만들고
    return JSON.stringify(msg);//string으로 변환 시켜줌
}


socket.addEventListener("open",()=>{
    console.log("Connected to Server");
}); //서버와 연결되면 (open) 사용하는 Listener

socket.addEventListener("message", (message) => {
    const li = document.createElement("li");
    li.innerText = message.data;
    messageList.append(li);//li를 messageList 안으로 넣어주는 작업
}); //서버로부터 메시지 (message) 를 받았을 때 사용하는 Listener

socket.addEventListener("close", () => {
    console.log("Disconnected from the Server");
}); //서버 연결 종료시 (close) 사용하는 Listener

function handleSubmit(event){
    event.preventDefault();
    const input = messageForm.querySelector("input");
    socket.send(makemessage("new_message", input.value));
    const li = document.createElement("li");
    li.innerText = `You: ${input.value}`;
    messageList.append(li);
    input.value="";//메시지 비워줌
}//서버로 메시지 내용 전송

function handleNicknameSubmit(event){
    event.preventDefault();
    const input = nicknameForm.querySelector("input");
    socket.send(makemessage("nickname", input.value));
    input.value="";
}//서버로 닉네임 내용 전송

messageForm.addEventListener("submit", handleSubmit);
nicknameForm.addEventListener("submit", handleNicknameSubmit);

