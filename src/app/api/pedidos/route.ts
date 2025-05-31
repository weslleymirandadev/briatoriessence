import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../api/auth/[...nextauth]/route";
import prisma from "../../../../prisma";

export async function PATCH(req: NextRequest) {
  try {
    const { status, payment_id } = await req.json();

    const pedido = await prisma.pedido.update({
      where: { pagamentoId: Number(payment_id) },
      data: { status },
    });

    return NextResponse.json(
      { status: "Sucesso ao atualizar pedido", data: pedido },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao atualizar pedido" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

    const {
      produtos,
      frete,
      tipoFrete,
      total,
      endereco,
      status,
      meioPagamento,
      pagamentoId,
    } = await req.json();

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { cart: true, address: true },
    });

    if (!user)
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );

    // Criar pedido
    const pedido = await prisma.pedido.create({
      data: {
        produtos: {
          create: produtos.map((p: any) => ({
            produtoId: p.produtoId,
            quantidade: p.quantidade,
            preco: p.produto.precoDes || p.produto.precoOrg,
          })),
        },
        tipoFrete,
        valorTotal: total,
        valorFrete: frete,
        totalProdutos: produtos.reduce(
          (acc: number, p: any) => acc + p.quantidade,
          0
        ),
        nomeDestinatario: endereco.nome,
        meioPagamento,
        pagamentoId,
        status,
        statusEnvio: "processando",
        address: {
          connect: {
            id: user.address?.id!,
          },
        },
        user: {
          connect: {
            id: user.address?.id!,
          },
        },
      },
    });

    return NextResponse.json(pedido);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao criar pedido" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user)
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );

    // Define the query filter based on user role
    const isAdmin = user.role === "admin"; // Assuming 'role' is a field in your User model
    const whereClause = isAdmin ? {} : { user: { email: session.user.email } };

    // Fetch orders with relationships
    const pedidosComRelacionamentos = await prisma.pedido.findMany({
      where: whereClause,
      include: {
        produtos: {
          include: {
            produto: true, // Include full product data
          },
        },
        user: true, // Include user data if needed
      },
    });

    // Format orders to include products directly
    const pedidosFormatados = pedidosComRelacionamentos.map((pedido) => ({
      ...pedido,
      produtos: pedido.produtos.map((item) => ({
        ...item.produto,
        quantidade: item.quantidade,
        precoUnitario: item.preco,
      })),
    }));

    return NextResponse.json({ status: "success", data: pedidosFormatados });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao buscar pedidos" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { id } = await req.json();
    if (!id) {
      return NextResponse.json(
        { error: "ID do pedido é obrigatório" },
        { status: 400 }
      );
    }

    const pedido = await prisma.pedido.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!pedido) {
      return NextResponse.json(
        { error: "Pedido não encontrado" },
        { status: 404 }
      );
    }

    if (pedido.user.email !== session.user.email) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    await prisma.pedido.delete({ where: { id } });

    return NextResponse.json({ message: "Pedido deletado com sucesso" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao deletar pedido" },
      { status: 500 }
    );
  }
}
