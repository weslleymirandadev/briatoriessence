import { NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import prisma from "../../../../../prisma";

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN!,
  options: {
    timeout: 5000,
  },
});

export async function POST(req: Request) {
  try {
    const {
      pedido,
      token,
      total,
      metodo,
      payer,
      userid,
      parcelas,
      issuer_id,
      device_id,
    } = await req.json();

    // Validação básica dos dados
    if (!pedido?.produtos || !total || !metodo) {
      console.error("Dados de pagamento inválidos:", { pedido, total, metodo });
      return NextResponse.json(
        { error: "Dados de pagamento inválidos" },
        { status: 400 }
      );
    }

    if (metodo !== "pix" && !token) {
      console.error("Token de pagamento é necessário");
      return NextResponse.json(
        { error: "Token de pagamento é necessário" },
        { status: 400 }
      );
    }

    const payment = new Payment(client);

    let usuario = await prisma.user.findUnique({
      where: { email: payer.email },
      include: { address: true },
    });

    if (!usuario) {
      usuario = await prisma.user.findUnique({
        where: { id: userid },
        include: { address: true },
      });
    }

    if (!usuario) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    const usuarioNome = usuario.name.split(" ");

    // Estrutura de dados para o Mercado Pago
    const paymentData = {
      transaction_amount: total,
      description: "Aquisição de cosmético(s)",
      payment_method_id: metodo,
      installments: parcelas,
      payer: {
        type: "customer",
        entity_type: "individual",
        email: payer.email,
        first_name: usuarioNome[0], // Nome do comprador
        last_name: usuarioNome[usuarioNome.length - 1], // Sobrenome do comprador
        identification: {
          type: "CPF",
          number: payer.cpf,
        },
        address: {
          zip_code: usuario.address?.cep,
          street_name: usuario.address?.rua,
          street_number: usuario.address?.numero,
          neighborhood: usuario.address?.bairro,
          city: usuario.address?.cidade,
          federal_unit: usuario.address?.estado,
        },
        phone: {
          area_code: usuario.telefone?.substring(0, 2),
          number: usuario.telefone?.substring(2),
        },
      },
      notification_url: `${process.env.MERCADO_PAGO_URL}/api/mercado-pago/webhook`,
      external_reference:
        pedido.produtos && pedido.produtos.length > 0
          ? pedido.produtos.map((produto: any) => produto.produtoId).join("-")
          : "temp-reference",
      additional_info: {
        items: pedido.produtos.map((produto: any) => ({
          id: produto.produtoId,
          title: produto.produto.nome,
          description: produto.produto.descricao || "Sem descrição",
          category_id: "cosmético",
          quantity: produto.quantidade,
          picture_url: produto.produto.imagens[0],
          unit_price:
            produto.produto.precoDes > 0
              ? produto.produto.precoDes
              : produto.produto.precoOrg,
        })),
      },
      statement_descriptor: "BRIATORI ESSENCE",
      binary_mode: true,
      capture: true,
      issuer_id: issuer_id,
      ...(token && { token }),
      ...(metodo === "pix" && {
        transaction_details: {
          financial_institution: "pix",
        },
      }),
    };

    // Requisição para a API do Mercado Pago
    const result = await payment.create({
      body: paymentData,
      requestOptions: {
        idempotencyKey: `${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 15)}`,
        meliSessionId: device_id,
      },
    });

    console.log(result);

    // Atualização do pedido no banco de dados
    const userPedido = await prisma.pedido.create({
      data: {
        statusEnvio: "processando",
        status: result.status === "approved" ? "pago" : "pendente",
        pagamentoId: result.id!,
        meioPagamento: metodo,
        valorTotal: total,
        valorFrete: pedido.frete,
        tipoFrete: pedido.tipoFrete,
        nomeDestinatario: pedido.endereco.nome,
        totalProdutos: pedido.produtos.reduce(
          (total: number, item: any) => total + item.quantidade,
          0
        ),
        address: {
          connect: {
            id: usuario.address?.id, // Conecta o endereço existente ao pedido
          },
        },
        user: {
          connect: {
            id: usuario.id,
          },
        },
        produtos: {
          create: pedido.produtos.map((produto: any) => ({
            produtoId: produto.produtoId,
            quantidade: produto.quantidade,
            preco: produto.produto.precoDes || produto.produto.precoOrg,
          })),
        },
      },
    });

    if (!userPedido)
      return NextResponse.json(
        {
          status: "error",
          data: "Não foi possível criar o pedido",
        },
        { status: 409 }
      );

    const responseData = {
      status: result.status === "approved" ? "pago" : "pendente",
      pedido_id: userPedido.id,
      payment_id: result.id,
      ...(metodo === "pix" && {
        qr_code: result.point_of_interaction?.transaction_data?.qr_code,
        qr_code_base64:
          result.point_of_interaction?.transaction_data?.qr_code_base64,
      }),
    };

    return NextResponse.json(responseData, { status: 200 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error }, { status: 500 });
  }
}