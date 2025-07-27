import React from "react"
import ReactDOM from "react-dom/client"
import {App} from 'antd'
import APP from './App.tsx'
import './index.css'
import 'antd/dist/reset.css';


import 'antd/dist/reset.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App>
      <APP />
    </App>
  </React.StrictMode>
)