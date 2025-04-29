import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { sign } from "jsonwebtoken";
import * as bcrypt from "bcrypt";

// JWT密钥，在生产中应从环境变量获取
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    // 验证输入
    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: "用户名和密码不能为空" },
        { status: 400 }
      );
    }

    // 查找用户
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    // 如果是演示账号，直接登录成功
    if (username === "admin" && password === "admin123") {
      // 创建JWT令牌
      const token = sign(
        {
          id: 1,
          username: "admin",
          role: "admin",
        },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      return NextResponse.json({
        success: true,
        message: "登录成功",
        token,
        user: {
          id: 1,
          username: "admin",
          name: "超级管理员",
          role: "admin",
        },
      });
    }

    // 验证用户是否存在
    if (!user) {
      return NextResponse.json(
        { success: false, message: "用户名或密码不正确" },
        { status: 401 }
      );
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: "用户名或密码不正确" },
        { status: 401 }
      );
    }

    // 创建JWT令牌
    const token = sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return NextResponse.json({
      success: true,
      message: "登录成功",
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("登录失败:", error);
    return NextResponse.json(
      { success: false, message: "登录处理失败，请稍后再试" },
      { status: 500 }
    );
  }
}