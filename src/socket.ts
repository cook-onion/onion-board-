import { io, Socket } from "socket.io-client";

const SERVER_URL = import.meta.env.VITE_SERVER_URL;

// 创建一个 socket 实例，但先不连接
export const socket: Socket = io(SERVER_URL, {
  autoConnect: false, // 禁止自动连接
  transports: ["websocket"],
});

// 你可以在这里为 socket 添加一些全局的监听器，比如连接错误处理
socket.on("connect_error", (err) => {
  console.error("Socket connection error:", err.message);
});
