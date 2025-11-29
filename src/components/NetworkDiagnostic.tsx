// src/components/NetworkDiagnostic.tsx
import React, { useState, useEffect } from "react";
import { Card, Alert, Button, Typography, Space, Divider } from "antd";
import {
  WifiOutlined,
  WarningOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import {
  checkServerConnection,
  getLocalNetworkInfo,
  getRecommendedServerConfig,
} from "../utils/networkConfig";

const { Title, Text, Paragraph } = Typography;

interface NetworkDiagnosticProps {
  visible: boolean;
  onClose: () => void;
}

const NetworkDiagnostic: React.FC<NetworkDiagnosticProps> = ({
  visible,
  onClose,
}) => {
  const [serverStatus, setServerStatus] = useState<
    "checking" | "connected" | "disconnected"
  >("checking");
  const [serverUrl] = useState(import.meta.env.VITE_SERVER_URL);

  useEffect(() => {
    if (visible) {
      checkConnection();
      getLocalNetworkInfo();
    }
  }, [visible]);

  const checkConnection = async () => {
    setServerStatus("checking");
    const isConnected = await checkServerConnection(serverUrl);
    setServerStatus(isConnected ? "connected" : "disconnected");
  };

  const config = getRecommendedServerConfig();

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
    >
      <Card
        style={{
          width: "90%",
          maxWidth: 600,
          maxHeight: "80vh",
          overflow: "auto",
        }}
        title={
          <Space>
            <WifiOutlined />
            网络连接诊断
          </Space>
        }
        extra={<Button onClick={onClose}>关闭</Button>}
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          {/* 当前连接状态 */}
          <Alert
            message="当前服务器连接状态"
            description={
              <Space>
                {serverStatus === "checking" && "检查中..."}
                {serverStatus === "connected" && (
                  <>
                    <CheckCircleOutlined style={{ color: "green" }} />
                    连接正常
                  </>
                )}
                {serverStatus === "disconnected" && (
                  <>
                    <WarningOutlined style={{ color: "red" }} />
                    连接失败
                  </>
                )}
                <Button size="small" onClick={checkConnection}>
                  重新检查
                </Button>
              </Space>
            }
            type={
              serverStatus === "connected"
                ? "success"
                : serverStatus === "disconnected"
                ? "error"
                : "info"
            }
          />

          <Divider />

          {/* 当前配置 */}
          <div>
            <Title level={4}>当前配置</Title>
            <Text code>{serverUrl}</Text>
          </div>

          {/* <Divider /> */}

          {/* 局域网配置指南 */}
          {/* <div>
            <Title level={4}>局域网对战配置指南</Title>

            <Paragraph>
              <Text strong>步骤1：获取服务端电脑的局域网IP地址</Text>
            </Paragraph>
            <Paragraph>
              在运行服务端的电脑上：
              <br />• Windows: 打开命令提示符，输入 <Text code>ipconfig</Text>
              <br />• Mac/Linux: 打开终端，输入 <Text code>ifconfig</Text>
              <br />• 查找类似 192.168.x.x 或 10.x.x.x 的IP地址
            </Paragraph>

            <Paragraph>
              <Text strong>步骤2：修改前端配置</Text>
            </Paragraph>
            <Paragraph>
              在前端项目根目录的 <Text code>.env.local</Text> 文件中，将：
              <br />
              <Text code>VITE_SERVER_URL=http://localhost:10001</Text>
              <br />
              改为：
              <br />
              <Text code>VITE_SERVER_URL=http://你的IP地址:10001</Text>
              <br />
              例如：<Text code>VITE_SERVER_URL={config.lanExample}</Text>
            </Paragraph>

            <Paragraph>
              <Text strong>步骤3：配置防火墙</Text>
            </Paragraph>
            <Paragraph>
              确保服务端电脑的防火墙允许端口 10001 的访问：
              <br />• Windows: 控制面板 → 系统和安全 → Windows Defender 防火墙 →
              高级设置
              <br />• 添加入站规则，允许端口 10001
            </Paragraph>

            <Paragraph>
              <Text strong>步骤4：重启开发服务器</Text>
            </Paragraph>
            <Paragraph>
              修改配置后，需要重启前端开发服务器：
              <br />
              <Text code>npm run dev</Text> 或 <Text code>pnpm dev</Text>
            </Paragraph>
          </div> */}

          {/* <Divider /> */}

          {/* 常见问题 */}
          {/* <div>
            <Title level={4}>常见问题</Title>
            <Paragraph>
              <Text strong>Q: 为什么本机可以对战，但局域网不行？</Text>
              <br />
              A: 因为前端配置使用的是
              localhost，只能本机访问。需要改为局域网IP。
            </Paragraph>
            <Paragraph>
              <Text strong>Q: 修改了IP还是连不上？</Text>
              <br />
              A: 检查防火墙设置，确保端口10001没有被阻止。
            </Paragraph>
            <Paragraph>
              <Text strong>Q: 如何确认服务端正在运行？</Text>
              <br />
              A: 在服务端电脑的浏览器中访问
              http://localhost:10001，应该看到服务器运行信息。
            </Paragraph>
          </div> */}
        </Space>
      </Card>
    </div>
  );
};

export default NetworkDiagnostic;
