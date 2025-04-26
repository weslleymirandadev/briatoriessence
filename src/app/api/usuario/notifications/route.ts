import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "../../../../../prisma";

export async function POST(req: Request, res: NextResponse) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { status: "error", data: "Not authenticated" },
        { status: 401 }
      );
    }

    const { title, email, href } = await req.json();

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { status: "error", data: "User not found" },
        { status: 404 }
      );
    }

    const notification = await prisma.notification.create({
      data: {
        title,
        href,
        seen: false,
        userId: user.id,
      },
    });

    return NextResponse.json(
      { status: "success", data: notification },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { status: "error", data: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request, res: NextResponse) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { status: "error", data: "Not authenticated" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    const notifications = await prisma.notification.findMany({
      where: { userId },
    });

    if (!notifications) {
      return NextResponse.json(
        { status: "error", data: "Notifications not found" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { status: "success", data: notifications },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { status: "error", data: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request, res: NextResponse) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { status: "error", data: "Not authenticated" },
        { status: 401 }
      );
    }

    const { notificationId } = await req.json();

    // Verifica se a notificação existe e se `seen` é `false`
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        seen: false, // Verifica se a notificação ainda não foi lida
      },
    });

    if (!notification) {
      return NextResponse.json(
        { status: "error", data: "Notification not found or already seen" },
        { status: 404 }
      );
    }

    // Atualiza a notificação para `seen: true`
    await prisma.notification.update({
      where: {
        id: notification.id, // Apenas o ID é necessário aqui
      },
      data: {
        seen: true,
      },
    });

    return NextResponse.json(
      { status: "success", data: "Notification updated" },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { status: "error", data: "Internal Server Error" },
      { status: 500 }
    );
  }
}
