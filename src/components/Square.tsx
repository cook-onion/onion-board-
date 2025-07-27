import React, { useState, useEffect } from 'react';
// Ant Design 在此文件中并未直接用于棋盘本身，但保留导入以备后用（例如：对话框、按钮）。
import { Button } from 'antd';
interface SquareProps {
    size:number;
}

const Square: React.FC<SquareProps> = ({size})=>{
    const style:React.CSSProperties = {
        width:`${size}px`,
        height:`${size}px`,
        backgroundColor: '#d2b48c',
        border:'1px solid #8b4513',
    }
    return (
        <div style={style}>
            {}
        </div>
    )
}
export default Square