import React from 'react';
import { Form, Input, Button } from 'antd';

interface NameInputProps {
  onNameSubmit: (values: { name: string }) => void;
}

const NameInput: React.FC<NameInputProps> = ({ onNameSubmit }) => (
  <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '8px' }}>
    <Form onFinish={onNameSubmit}>
      <Form.Item name="name" rules={[{ required: true, message: '请输入你的昵称!' }]}>
        <Input placeholder="请输入你的昵称" />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" block>进入游戏</Button>
      </Form.Item>
    </Form>
  </div>
);
 
export default NameInput;