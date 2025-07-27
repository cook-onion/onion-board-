import React from "react";
import { Button, Input, Form, Modal, List, Card, Tag } from "antd";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import type { RoomInfo } from "../types";

interface GameLobbyProps {
  isConnected: boolean;
  roomList: RoomInfo[];
  onJoinRoom: (room: RoomInfo) => void;
  onSetCreateModalVisible: (visible: boolean) => void;
  onBackToMenu: () => void;
  isCreateModalVisible: boolean;
  form: any; // Antd Form instance
  onCreateRoom: (values: { roomName: string; password?: string }) => void;
  joiningRoom: RoomInfo | null;
  onSetJoiningRoom: (room: RoomInfo | null) => void;
  onPasswordSubmit: (values: { password?: string }) => void;
}

const GameLobby: React.FC<GameLobbyProps> = (props) => {
  const {
    isConnected,
    roomList,
    onJoinRoom,
    onSetCreateModalVisible,
    onBackToMenu,
    isCreateModalVisible,
    form,
    onCreateRoom,
    joiningRoom,
    onSetJoiningRoom,
    onPasswordSubmit,
  } = props;

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "600px",
        padding: "20px",
        backgroundColor: "rgba(255,255,255,0.8)",
        backdropFilter: "blur(10px)",
        borderRadius: "8px",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
      }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}>
        <h2 style={{ fontSize: "2rem", fontWeight: "bold", color: "#333" }}>
          游戏大厅
        </h2>
        <Button
          type="primary"
          size="large"
          onClick={() => onSetCreateModalVisible(true)}>
          创建房间
        </Button>
      </div>
      <List
        loading={!isConnected}
        dataSource={roomList}
        renderItem={(room) => (
          <Card
            style={{
              marginBottom: "1rem",
              boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
              transition: "box-shadow 0.3s",
            }}
            hoverable>
            <List.Item
              actions={[
                <Button
                  onClick={() => onJoinRoom(room)}
                  disabled={room.playerCount >= 2 || room.status === "playing"}>
                  加入
                </Button>,
              ]}>
              <List.Item.Meta
                title={
                  <div style={{ display: "flex", alignItems: "center" }}>
                    {room.hasPassword && (
                      <LockOutlined
                        style={{ marginRight: 8, color: "rgba(0,0,0,0.45)" }}
                      />
                    )}{" "}
                    <span style={{ fontWeight: "600" }}>{room.roomName}</span>
                  </div>
                }
                description={`房主: ${room.hostName}`}
              />
              <div style={{ textAlign: "right" }}>
                <Tag color={room.status === "playing" ? "volcano" : "green"}>
                  {room.status === "playing" ? "游戏中" : "等待中"}
                </Tag>
                <div style={{ marginTop: "0.5rem" }}>
                  <UserOutlined style={{ marginRight: 8 }} />
                  {room.playerCount} / 2
                </div>
              </div>
            </List.Item>
          </Card>
        )}
      />
      <Button onClick={onBackToMenu} style={{ marginTop: "20px" }}>
        返回菜单
      </Button>
      <Modal
        title="创建新房间"
        open={isCreateModalVisible}
        onCancel={() => onSetCreateModalVisible(false)}
        footer={null}>
        <Form form={form} onFinish={onCreateRoom} layout="vertical">
          <Form.Item
            name="roomName"
            label="房间名称"
            rules={[{ required: true, message: "请输入房间名称" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="password" label="房间密码 (可选)">
            <Input.Password />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              创建
            </Button>
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title="请输入密码"
        open={!!joiningRoom}
        onCancel={() => onSetJoiningRoom(null)}
        footer={null}>
        <Form onFinish={onPasswordSubmit}>
          <Form.Item
            name="password"
            rules={[{ required: true, message: "请输入密码" }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              确认加入
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default GameLobby;
