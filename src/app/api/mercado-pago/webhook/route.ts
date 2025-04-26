import { NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import axios from "axios";

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN!,
  options: { timeout: 5000 },
});

export async function POST(req: Request) {
  try {
    const dados = await req.json();
    const { type, data, topic, resource } = dados;

    if (type != "payment" && topic != "payment") {
      return NextResponse.json(
        { status: "error", data: "Forbidden" },
        { status: 403 }
      );
    }
    const paymentId = data?.id;
    const paymentId2 = resource;

    const payment = new Payment(client);

    let response1;
    if (paymentId) {
      response1 = await payment.get({ id: paymentId });
    }

    let response2; 
    if (paymentId2) {
      response2 = await payment.get({ id: paymentId2 });
    }
    console.log(response1, response2);
    console.log(paymentId, paymentId2);

    if (response1?.status === "approved") {
      await axios.patch(
        `${process.env.MERCADO_PAGO_URL}/api/pedidos`,
        { status: "pago", payment_id: paymentId },
        { headers: { "Content-Type": "application/json" } }
      );
      return NextResponse.json(
        { status: "success", data: "Received" },
        { status: 200 }
      );
    }

    if (response2?.status === "approved") {
      await axios.patch(
        `${process.env.MERCADO_PAGO_URL}/api/pedidos`,
        { status: "pago", payment_id: paymentId2 },
        { headers: { "Content-Type": "application/json" } }
      );
      return NextResponse.json(
        { status: "success", data: "Received" },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { status: "success", data: "Bad Request" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Erro ao processar webhook:", error);
    return NextResponse.json({ error }, { status: 500 });
  }
}
