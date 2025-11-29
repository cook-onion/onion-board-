// src/components/MainMenu.tsx
import React, { useState } from "react";
import { Button, Space } from "antd";
import { WifiOutlined } from "@ant-design/icons";
import NetworkDiagnostic from "./NetworkDiagnostic";

interface MainMenuProps {
  playerName: string;
  onSetGameMode: (mode: "pve" | "pvp") => void;
  onSetStep: (step: "game" | "lobby") => void;
  onRestartPVE: () => void;
}

const MainMenu: React.FC<MainMenuProps> = ({
  playerName,
  onSetGameMode,
  onSetStep,
  onRestartPVE,
}) => {
  const [showNetworkDiagnostic, setShowNetworkDiagnostic] = useState(false);

  return (
    <div style={{ textAlign: "center" }}>
      <h1>五子棋</h1>
      <h3>你好, {playerName}!</h3>

      <Space direction="vertical" size="middle">
        <Button
          type="primary"
          size="large"
          onClick={() => {
            onSetGameMode("pve");
            onSetStep("game");
            onRestartPVE();
          }}
          style={{ width: 200 }}
        >
          人机对战 (PVE)
        </Button>

        <Button
          type="primary"
          size="large"
          onClick={() => {
            onSetGameMode("pvp");
            onSetStep("lobby");
          }}
          style={{ width: 200 }}
        >
          在线对战 (PVP)
        </Button>

        <Button
          icon={<WifiOutlined />}
          onClick={() => setShowNetworkDiagnostic(true)}
          style={{ width: 200 }}
        >
          网络诊断
        </Button>
      </Space>

      <NetworkDiagnostic
        visible={showNetworkDiagnostic}
        onClose={() => setShowNetworkDiagnostic(false)}
      />
    </div>
  );
};

export default MainMenu;
