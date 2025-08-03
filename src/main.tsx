// import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { SocketProvider } from './contexts/SocketContext.tsx';

// --- 修改点 ---
// 我们将 <React.StrictMode> 组件移除。
// 在开发模式下，它会导致组件被额外挂载-卸载-再挂载，
// 这对于需要持久连接的 Socket.IO 应用会造成问题。
// 在生产环境中，StrictMode 不会生效，所以移除它对线上版本没有影响。

ReactDOM.createRoot(document.getElementById('root')!).render(
  <SocketProvider>
    <App />
  </SocketProvider>
)
