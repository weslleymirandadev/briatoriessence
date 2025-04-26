"use client";

import Main from "@/components/Main";
import axios from "axios";
import Image from "next/image";
import { useEffect, useState } from "react";
import { FaCreditCard, FaHouseUser } from "react-icons/fa";
import { FaPix } from "react-icons/fa6";
import Link from "next/link";
import Swal from "sweetalert2";

export default function Pedido({
  params,
}: {
  params: Promise<{ pedido: string }>;
}) {
  const [pedido, setPedido] = useState<any>();
  const [pedidoId, setPedidoId] = useState<any>();

  useEffect(() => {
    if (!params) return;
    params.then(async (resolvedParams) => {
      await axios
        .get(`/api/pedidos/${resolvedParams.pedido}`)
        .then((response) => {
          setPedido(response.data.data);
          setPedidoId(resolvedParams.pedido);
        });
    });
  }, [params]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    await axios.patch(`/api/pedidos/${pedidoId}`, {
      codigoRastreio: e.target[0].value,
      statusEnvio: "enviado",
    });

    await axios.post("/api/usuario/notifications", {
      title: "Pedido enviado",
      email: pedido.user.email,
      href: `/home/pedidos/${pedidoId}`,
    });

    Swal.fire({
      title: "Sucesso!",
      text: "Código de rastreio atualizado com sucesso.",
      icon: "success",
      confirmButtonText: "Ok",
      color: "black", // Cor do texto
      confirmButtonColor: "#F8C8DC", // Cor do botão
    });
  };

  if (!pedido)
    return (
      <Main>
        <h1>Carregando...</h1>
      </Main>
    );

  console.log(pedido);

  return (
    <Main>
      <section className="flex justify-center">
        <div className="grid grid-cols-1">
          <h2 className="text-center text-2xl mb-4">
            {new Date(pedido.updatedAt).toLocaleString()}
          </h2>
          {pedido && (
            <section className="max-w-[600px] container bg-white p-2 my-2 shadow-md border border-gray-400 rounded-md">
              {pedido.produtos.map((produtoPedido: any) => (
                <Link
                  href={`/home/loja/produtos/${produtoPedido.produto.nome}`}
                  key={produtoPedido.produto.id}
                  className="flex p-3 border-b-2 border-gray-400 last:border-b-0 hover:bg-gray-100"
                >
                  <div className="relative w-[100px] h-[100px]">
                    <Image
                      src={produtoPedido.produto.imagens[0]}
                      alt={produtoPedido.produto.nome}
                      layout="fill"
                      quality={100}
                      objectFit="cover"
                      loading="lazy"
                      className="select-none rounded-md max-h-[250px] max-w-[250px]"
                    />
                  </div>
                  <div className="px-2 flex-1">
                    <h3 className="text-2xl font-semibold">
                      {produtoPedido.produto.nome}
                    </h3>
                    <p className="text-lg text-gray-700">
                      Quantidade: {produtoPedido.quantidade}
                    </p>
                    <p className="text-lg text-gray-700">
                      Preço unitário: R$
                      {produtoPedido.produto.precoOrg.toFixed(2)}
                    </p>
                    <p className="text-lg text-gray-700">
                      Subtotal: R$
                      {(
                        produtoPedido.quantidade *
                        produtoPedido.produto.precoOrg
                      ).toFixed(2)}
                    </p>
                  </div>
                </Link>
              ))}
              <div>
                <h2 className="text-2xl font-semibold py-4">
                  Endereço de entrega
                </h2>

                <p className="flex items-center">
                  <FaHouseUser className="inline text-[var(--primary)] text-2xl me-2" />
                  {pedido.address.rua}, {pedido.address.numero},{" "}
                  {pedido.address.complemento}, {pedido.address.bairro},{" "}
                  {pedido.address.cep}, {pedido.address.estado} -{" "}
                  {pedido.address.cidade}
                </p>

                <h2 className="text-2xl font-semibold py-4">
                  Dados do destinatário
                </h2>
                <p>
                  {pedido.user.name} - {pedido.user.cpf} -{" "}
                  {pedido.user.telefone}
                </p>
              </div>

              <hr className="border border-gray-400 my-5" />

              <form
                onSubmit={handleSubmit}
                className="flex flex-col items-start"
              >
                <label className="text-xl text-gray-700 mb-4">
                  <p className="text-2xl text-black">Código de rastreio:</p>
                  <input
                    name="codigoRastreio"
                    type="text"
                    className="shadow-md border border-gray-400 rounded-md max-w-fit"
                    defaultValue={pedido.codigoRastreio ?? ""}
                  />
                </label>
                <button
                  type="submit"
                  className="p-2 md:mb-0 cursor-pointer transition-colors duration-200 rounded-md border border-black font-bold hover:bg-black hover:text-white text-sm md:text-base"
                >
                  Atualizar Código
                </button>
              </form>

              <hr className="border border-gray-400 my-5" />

              <div className="mt-4">
                <h3 className="text-xl my-1 text-gray-700">
                  Frete: R${pedido.valorFrete.toFixed(2)} ({pedido.tipoFrete})
                </h3>
                <h3 className="text-xl text-gray-700">
                  Preço total: R${pedido.valorTotal.toFixed(2)}{" "}
                  {pedido.meioPagamento == "pix" ? "(5% OFF)" : ""}
                </h3>
                <h3 className="text-xl text-gray-700 flex items-center gap-1">
                  <span className="bg-[var(--primary)] p-1 rounded-md text-black">
                    {pedido.status}
                  </span>{" "}
                  <span className="flex items-center">
                    (
                    {pedido.meioPagamento == "pix" ? (
                      <FaPix />
                    ) : (
                      <FaCreditCard />
                    )}{" "}
                    {String(pedido.meioPagamento).toUpperCase()})
                  </span>
                </h3>
              </div>
            </section>
          )}
        </div>
      </section>
    </Main>
  );
}
