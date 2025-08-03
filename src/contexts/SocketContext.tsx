import React, { createContext, useContext } from 'react';
import { Socket } from 'socket.io-client';
import { socket } from '../socket'; // 导入我们刚刚创建的 socket 实例

// 创建一个 Context
const SocketContext = createContext<Socket>(socket);

// 创建一个自定义 Hook，方便子组件使用
export const useSocket = (): Socket => {
  return useContext(SocketContext);
};

// 创建一个 Provider 组件
interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
