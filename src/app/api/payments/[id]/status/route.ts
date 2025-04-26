import { NextResponse } from "next/server";
import prisma from "../../../../../../prisma";

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
      const { id } = await params;
      
      // Consultar banco de dados ou API do Mercado Pago
      const pedido = await prisma.pedido.findFirst({
        where: { pagamentoId: Number(id) },
      });

      console.log(pedido?.status)
  
      return NextResponse.json({ status: pedido?.status });
    } catch (error) {
      return NextResponse.json({ error: "Erro ao verificar status" }, { status: 500 });
    }
  }