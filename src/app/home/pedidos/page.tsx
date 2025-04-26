"use client";

import Main from "@/components/Main";
import axios from "axios";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Pedidos() {
  const [pedidos, setPedidos] = useState<any>();
  const { data: session } = useSession();

  useEffect(() => {
    const fetchPedidos = async () => {
      await axios
        .get(`/api/pedidos`)
        .then((response) => setPedidos(response.data.data));
    };

    fetchPedidos();
  }, [session]);

  if (!pedidos) return <h1>Carregando...</h1>;

  return (
    <Main>
      <section className="flex justify-center">
        <div className="grid grid-cols-1">
          <h2 className="text-center text-2xl mb-4">Meus Pedidos</h2>
          {pedidos &&
            pedidos.map((pedido: any, pedido_index: number) => (
              <Link
                href={`/home/pedidos/${pedido.pagamentoId}`}
                key={pedido_index}
                className="min-w-[600px] container bg-white p-2 my-2 shadow-md border border-gray-400 rounded-md"
              >
                <h2 className="text-2xl">
                  {new Date(pedido.updatedAt).toLocaleString()}
                </h2>
                <section className="flex py-3">
                  <div className="relative w-[100px] h-[100px]">
                    <Image
                      src={pedido.produtos[0].imagens[0]}
                      alt={pedido.produtos[0].nome}
                      layout="fill"
                      quality={100}
                      objectFit="cover"
                      loading="lazy"
                      className="select-none rounded-md  max-h-[250px] max-w-[250px]"
                    />
                  </div>
                  <div className="px-2">
                    <h3 className="flex text-2xl">
                      Total de produtos: {pedido.totalProdutos}
                    </h3>
                    <h3 className="text-xl my-1 text-gray-700">
                      Frete: R${pedido.valorFrete.toFixed(2)} ({pedido.tipoFrete})
                    </h3>
                    <h3 className="text-xl text-gray-700">
                      Preço total: R${pedido.valorTotal.toFixed(2)}
                    </h3>
                    <h3 className="text-xl text-gray-700">
                      Status do pagamento: <span className="bg-[var(--primary)] p-1 rounded-md text-black">{pedido.status}</span>
                    </h3>
                  </div>
                </section>
              </Link>
            ))}
        </div>
      </section>
    </Main>
  );
}
