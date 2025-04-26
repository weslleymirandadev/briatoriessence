import { getServerSession } from "next-auth";
import prisma from "../../../../../prisma";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function POST(req: NextRequest) {
  try {
    const {
      userId,
      rua,
      numero,
      complemento,
      bairro,
      cidade,
      estado,
      telefone,
      cep,
      cpf,
      nome,
    } = await req.json();

    if (
      !userId ||
      !rua ||
      !numero ||
      !bairro ||
      !cidade ||
      !estado ||
      !cep ||
      !cpf ||
      !nome
    ) {
      return NextResponse.json(
        { error: "Todos os campos obrigatórios devem ser preenchidos." },
        { status: 400 }
      );
    }

    // Usar upsert para criar ou atualizar o endereço
    const addressOperation = await prisma.address.upsert({
      where: { userId },
      update: {
        rua,
        numero,
        complemento,
        bairro,
        cidade,
        estado,
        cep,
      },
      create: {
        rua,
        numero,
        complemento,
        bairro,
        cidade,
        estado,
        cep,
        user: { connect: { id: userId } },
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { cpf, telefone, name: nome },
    });

    return NextResponse.json(addressOperation, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao processar endereço" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ status: "error", data: "Not authenticated" });
    }

    const email = session.user.email;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { address: true },
    });

    if (!user) {
      return NextResponse.json({ status: "error", data: "User not found" });
    }

    console.log(user);

    return NextResponse.json({ status: "success", data: user });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { status: "error", data: "Internal Server Error" },
      { status: 500 }
    );
  }
}
