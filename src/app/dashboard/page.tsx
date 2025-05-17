"use client";

import Main from "@/components/Main";
import ProdutoCard from "@/components/ProdutoCard";
import BannerCard from "@/components/BannerCard";
import axios from "axios";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

interface Produto {
  id: string;
  nome: string;
  precoOrg: number;
  precoDes: number;
  descricao: string;
  imagens: string[];
  tags: string;
}

export default function Dashboard() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeButton, setActiveButton] = useState<string | null>(null);
  const { data: session } = useSession();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      await axios
        .get("/api/produtos")
        .then((response) => {
          setProdutos(response.data.data);
        })
        .catch((error) => {
          console.error("Erro ao buscar produtos:", error);
        });

      await axios
        .get("/api/pedidos")
        .then((response) => {
          setPedidos(response.data.data);
        })
        .catch((error) => {
          console.error("Erro ao buscar pedidos:", error);
        });

      await axios
        .get("/api/banners")
        .then((response) => {
          setBanners(response.data.data);
          console.log(banners);
        })
        .catch((error) => {
          console.error("Erro ao buscar banners:", error);
        });

      setLoading(false);
    };

    fetchData();
  }, []);

  const sortByNameAsc = () => {
    const sorted = [...produtos].sort((a, b) => a.nome.localeCompare(b.nome));
    setProdutos(sorted);
    setActiveButton("nameAsc");
  };

  const sortByNameDesc = () => {
    const sorted = [...produtos].sort((a, b) => b.nome.localeCompare(a.nome));
    setProdutos(sorted);
    setActiveButton("nameDesc");
  };

  const sortByPriceAsc = () => {
    const sorted = [...produtos].sort((a, b) => a.precoOrg - b.precoOrg);
    setProdutos(sorted);
    setActiveButton("priceAsc");
  };

  const sortByPriceDesc = () => {
    const sorted = [...produtos].sort((a, b) => b.precoOrg - a.precoOrg);
    setProdutos(sorted);
    setActiveButton("priceDesc");
  };

  if (!pedidos || !produtos || !banners) return <h1>Carregando...</h1>;

  const pedidosPendentes = pedidos.filter((pedido) => pedido.statusEnvio === "processando");

  return (
    <Main>
      {/* Nova seção de banners */}
      <section className="flex justify-end w-full">
        <div className="container mx-auto mt-4 flex justify-center md:max-w-[1280px]">
          <div className="w-full max-w-[680px]">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl">Banners</h2>
              </div>
              <Link
                prefetch
                href={"/dashboard/adicionar-banner"}
                className="border font-bold p-2 rounded-md hover:bg-black hover:text-white transition-colors duration-200 text-xs md:text-lg"
              >
                Adicionar Banner
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-4 mt-4 md:ml-auto border-2 rounded-md border-gray-300 overflow-y-auto max-h-[400px] p-4 bg-white shadow-xl">
              {banners.length > 0 ? (
                banners.map((banner, index) => (
                  <BannerCard key={index} banner={banner} />
                ))
              ) : (
                <h1 className="p-4 text-center">Não há banners disponíveis</h1>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Seção de pedidos */}
      <section className="flex justify-end w-full">
        <div className="container mx-auto mt-4 flex justify-center md:max-w-[1280px]">
          <div className="w-full max-w-[680px]">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl">
                  Pedidos - {pedidosPendentes.length} {pedidosPendentes.length === 1 ? "pendente" : "pendentes"}
                </h2>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 mt-4 md:ml-auto border-2 rounded-md border-gray-300 overflow-y-auto max-h-[400px] p-4 bg-white shadow-xl">
              {pedidos.length > 0 ? (
                [...pedidos].reverse().map((pedido, index) => (
                  <Link
                    key={index}
                    className="flex items-center gap-4 p-3 border-2 border-gray-300 rounded-md relative"
                    href={`/dashboard/pedidos/${pedido.pagamentoId}`}
                    prefetch
                  >
                    <div className="relative w-20 h-20 flex-shrink-0">
                      <Image
                        draggable={false}
                        fill
                        className="rounded-md object-cover"
                        src={pedido.produtos[0].imagens[0]}
                        alt={pedido.nomeDestinatario}
                      />
                    </div>
                    <div>
                      <h1 className="text-black text-lg font-semibold">
                        {pedido.nomeDestinatario}
                      </h1>
                      <p className="text-gray-600">R${pedido.valorTotal}</p>
                      <p className="text-gray-600">
                        {new Date(pedido.updatedAt).toLocaleString()} -{" "}
                        {pedido.statusEnvio === "processando" ? "Pendente" : "Enviado"}
                      </p>
                    </div>
                  </Link>
                ))
              ) : (
                <h1 className="p-4 text-center">Não há pedidos pendentes</h1>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Seção de estoque */}
      <section className="flex justify-end w-full">
        <div className="container mx-auto mt-4 flex justify-center md:max-w-[1280px]">
          <div className="w-full max-w-[680px]">
            <div className="flex justify-between place-items-end">
              <div>
                <h2 className="text-2xl">
                  Estoque - {produtos.length} produtos
                </h2>
                <div className="font-bold">
                  <button
                    onClick={sortByNameAsc}
                    className={`cursor-pointer transition-all hover:scale-110 duration-200 shadow-md w-12 p-2 m-1 rounded-md ${
                      activeButton === "nameAsc" ? "bg-[var(--primary)]" : "bg-white"
                    }`}
                  >
                    a-Z
                  </button>
                  <button
                    onClick={sortByNameDesc}
                    className={`cursor-pointer transition-all hover:scale-110 duration-200 shadow-md w-12 p-2 m-1 rounded-md ${
                      activeButton === "nameDesc" ? "bg-[var(--primary)]" : "bg-white"
                    }`}
                  >
                    z-A
                  </button>
                  <button
                    onClick={sortByPriceAsc}
                    className={`cursor-pointer transition-all hover:scale-110 duration-200 shadow-md w-12 p-2 m-1 rounded-md ${
                      activeButton === "priceAsc" ? "bg-[var(--primary)]" : "bg-white"
                    }`}
                  >
                    $
                  </button>
                  <button
                    onClick={sortByPriceDesc}
                    className={`cursor-pointer transition-all hover:scale-110 duration-200 shadow-md w-12 p-2 m-1 rounded-md ${
                      activeButton === "priceDesc" ? "bg-[var(--primary)]" : "bg-white"
                    }`}
                  >
                    $$$
                  </button>
                </div>
              </div>
              <Link
                prefetch
                href={"/dashboard/adicionar-produto"}
                className="border font-bold p-2 rounded-md hover:bg-black hover:text-white transition-colors duration-200 text-xs md:text-lg"
              >
                Adicionar
              </Link>
            </div>
            <div className="hidden md:grid grid-cols-1 gap-4 mt-4 md:ml-auto border-2 rounded-md border-gray-300 overflow-y-scroll max-h-[400px] p-10 bg-white shadow-xl">
              {produtos.length > 0 ? (
                produtos.map((produto, index) => (
                  <ProdutoCard
                    key={index}
                    layout="horizontal"
                    produto={produto}
                    loading={loading}
                    isAdmin={session?.user.role === "admin"}
                  />
                ))
              ) : (
                <h1>Não há produtos no estoque</h1>
              )}
            </div>
            <div className="md:hidden grid grid-cols-1 gap-4 mt-4 md:ml-auto border-2 rounded-md border-gray-300 overflow-y-scroll max-h-[400px] p-10 bg-white shadow-xl">
              {produtos.length > 0 ? (
                produtos.map((produto, index) => (
                  <ProdutoCard
                    key={index}
                    layout="vertical"
                    produto={produto}
                    loading={loading}
                    isAdmin={session?.user.role === "admin"}
                  />
                ))
              ) : (
                <h1>Não há produtos no estoque</h1>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Seção de sair da conta */}
      <section className="flex justify-end w-full py-5">
        <div className="container mx-auto mt-4 flex justify-center md:max-w-[1280px]">
          <div className="w-full max-w-[680px] flex justify-center">
            <button
              className="border cursor-pointer transition-colors duration-200 font-bold text-red-500 border-red-500 hover:bg-red-500 hover:text-white p-2 rounded-md text-2xl"
              onClick={() => signOut({ callbackUrl: "/home" })}
            >
              Sair da conta
            </button>
          </div>
        </div>
      </section>
    </Main>
  );
}