// src/utils/networkConfig.ts
/**
 * 网络配置工具
 * 用于处理不同环境下的服务器连接
 */

/**
 * 获取本机局域网IP地址（仅在开发环境下使用）
 */
export function getLocalNetworkInfo(): string {
  // 在浏览器环境中，我们无法直接获取本机IP
  // 这个函数主要用于提供配置指导
  const hostname = window.location.hostname;
  const port = import.meta.env.VITE_SERVER_URL?.split(":")[2] || "10001";

  if (hostname === "localhost" || hostname === "127.0.0.1") {
    console.warn("当前使用localhost访问，其他设备无法连接");
    console.info("如需局域网访问，请：");
    console.info("1. 查看服务端电脑的局域网IP地址");
    console.info("2. 修改.env.local文件中的VITE_SERVER_URL");
    console.info("3. 确保防火墙允许端口访问");
  }

  return `${hostname}:${port}`;
}

/**
 * 检查服务器连接状态
 */
export async function checkServerConnection(
  serverUrl: string
): Promise<boolean> {
  try {
    const response = await fetch(`${serverUrl}/`, {
      method: "GET",
      mode: "cors",
      timeout: 5000,
    } as RequestInit);
    return response.ok;
  } catch (error) {
    console.error("服务器连接检查失败:", error);
    return false;
  }
}

/**
 * 获取推荐的服务器配置
 */
export function getRecommendedServerConfig(): {
  localhost: string;
  lanExample: string;
  production: string;
} {
  return {
    localhost: "http://localhost:10001",
    lanExample: "http://192.168.1.100:10001", // 示例IP
    production: "https://api-board.cook-onion.fun",
  };
}
