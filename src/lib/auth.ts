import { NextRequest, NextResponse } from "next/server";
import { verify } from "jsonwebtoken";

// JWT密钥，在生产中应从环境变量获取
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// 解码JWT令牌
export function decodeToken(token: string) {
  try {
    return verify(token, JWT_SECRET) as {
      id: number;
      username: string;
      role: string;
    };
  } catch (error) {
    return null;
  }
}

// 身份验证中间件
export function withAuth(
  request: NextRequest,
  handler: (request: NextRequest, user: any) => Promise<NextResponse>
) {
  try {
    // 获取Authorization头
    const authHeader = request.headers.get("Authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, message: "未授权访问" },
        { status: 401 }
      );
    }

    // 提取令牌
    const token = authHeader.substring(7);
    
    // 验证令牌
    const user = decodeToken(token);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: "无效令牌或会话已过期" },
        { status: 401 }
      );
    }

    // 通过验证，调用处理函数
    return handler(request, user);
    
  } catch (error) {
    console.error("身份验证失败:", error);
    return NextResponse.json(
      { success: false, message: "身份验证失败" },
      { status: 500 }
    );
  }
}

// 基于角色的访问控制中间件
export function withRole(
  request: NextRequest,
  handler: (request: NextRequest, user: any) => Promise<NextResponse>,
  allowedRoles: string[] = ["admin"] // 默认只允许管理员
) {
  return withAuth(request, async (req, user) => {
    // 验证用户角色
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { success: false, message: "权限不足，无法执行此操作" },
        { status: 403 }
      );
    }

    // 角色验证通过，调用处理函数
    return handler(req, user);
  });
}