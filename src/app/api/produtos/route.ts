import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../prisma";

export async function GET(req: NextRequest) {
  try {
    return NextResponse.json(
      { status: "success", data: await prisma.produto.findMany() },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao criar produto:", error);
    return NextResponse.json(
      { status: "error", message: `Erro ao buscar produto: ${error}` },
      { status: 500 }
    );
  }
}
