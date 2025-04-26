import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { cep, produtos } = await req.json();

    if (!produtos || !Array.isArray(produtos) || produtos.length === 0) {
      return NextResponse.json(
        { status: "error", message: "Nenhum produto informado." },
        { status: 400 }
      );
    }

    let volumeTotal = 0;
    let pesoTotal = 0;

    // Calcula o volume total e o peso total
    for (const produto of produtos) {
      const { altura, largura, comprimento, peso } = produto.produto;
      if (!altura || !largura || !comprimento || !peso) {
        return NextResponse.json(
          { status: "error", message: "Dados do produto incompletos." },
          { status: 400 }
        );
      }

      const volume = altura * largura * comprimento * produto.quantidade;
      volumeTotal += volume;
      pesoTotal += peso * produto.quantidade;
    }

    // Calcula a dimensão cúbica base
    let dimensao = Math.cbrt(volumeTotal);

    // Adiciona 10% para segurança
    dimensao *= 1.1;

    // Garante que as dimensões respeitem os mínimos exigidos pelos Correios
    const alturaFinal = Math.max(dimensao, 2);
    const larguraFinal = Math.max(dimensao, 11);
    const comprimentoFinal = Math.max(dimensao, 16);

    // Chamada para a API de frete
    const response = await axios.post(
      "https://api.superfrete.com/api/v0/calculator",
      {
        from: { postal_code: "84940000" },
        to: { postal_code: cep },
        services: "1,2,17",
        options: {
          own_hand: false,
          receipt: false,
          insurance_value: 0,
          use_insurance_value: false,
        },
        package: {
          height: alturaFinal.toFixed(2),
          width: larguraFinal.toFixed(2),
          length: comprimentoFinal.toFixed(2),
          weight: pesoTotal.toFixed(2),
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.SUPER_FRETE_TOKEN}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );

    // Consulta de CEP
    const responseCep = await axios.get(
      `https://viacep.com.br/ws/${cep}/json/`
    );

    return NextResponse.json({
      status: "success",
      frete: response.data,
      cep: responseCep.data,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ status: "error", data: error }, { status: 500 });
  }
}
