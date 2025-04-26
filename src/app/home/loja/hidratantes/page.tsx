"use client";

import { useEffect, useState, Suspense } from "react";
import axios from "axios";
import ProdutoCard from "@/components/ProdutoCard";
import { useSession } from "next-auth/react";

interface Produto {
  id: string;
  nome: string;
  precoOrg: number;
  precoDes: number;
  descricao: string;
  imagens: string[];
  tags: string;
}

export default function Loja() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [filteredProdutos, setFilteredProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeButton, setActiveButton] = useState<string | null>(null);
  const { data: session, status } = useSession();
  const title = "hidratante";

  useEffect(() => {
    if (title) {
      const filtered = produtos.filter((produto) =>
        produto.tags.toLowerCase().includes(title.toLowerCase())
      );
      setFilteredProdutos(filtered);
    } else {
      setFilteredProdutos(produtos);
    }
  }, [title, produtos]);

  useEffect(() => {
    const fetchProdutos = async () => {
      try {
        const response = await axios.get("/api/produtos");
        setProdutos(shuffleArray(response.data.data));
        setLoading(false);
      } catch (error) {
        console.error("Erro ao buscar produtos:", error);
      }
    };

    fetchProdutos();
  }, []);

  const sortByNameAsc = () => {
    const sorted = [...filteredProdutos].sort((a, b) =>
      a.nome.localeCompare(b.nome)
    );
    setFilteredProdutos(sorted);
    setActiveButton("nameAsc");
  };

  const sortByNameDesc = () => {
    const sorted = [...filteredProdutos].sort((a, b) =>
      b.nome.localeCompare(a.nome)
    );
    setFilteredProdutos(sorted);
    setActiveButton("nameDesc");
  };

  const sortByPriceAsc = () => {
    const sorted = [...filteredProdutos].sort(
      (a, b) => a.precoOrg - b.precoOrg
    );
    setFilteredProdutos(sorted);
    setActiveButton("priceAsc");
  };

  const sortByPriceDesc = () => {
    const sorted = [...filteredProdutos].sort(
      (a, b) => b.precoOrg - a.precoOrg
    );
    setFilteredProdutos(sorted);
    setActiveButton("priceDesc");
  };

  const shuffleArray = (array: any[]) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  return (
    <section className="w-full">
      <section className="container mx-auto mt-4 flex flex-col items-center w-full md:max-w-[1280px]">
        <h2 className="text-4xl">Hidratantes</h2>
        <div className="w-full flex items-center">
          <div className="font-bold mt-4">
            <h3>Filtrar:</h3>
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
                activeButton === "priceDesc"
                  ? "bg-[var(--primary)]"
                  : "bg-white"
              }`}
            >
              $$$
            </button>
          </div>
        </div>
      </section>
      {filteredProdutos.length > 0 ? (
        <section className="container mx-auto mt-4 flex flex-col items-center w-full md:max-w-[1280px]">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4 w-full">
            {filteredProdutos.map((produto: Produto, index: number) => (
              <ProdutoCard
                key={index}
                produto={produto}
                loading={loading}
                loadingSession={status === "loading"}
                isAdmin={session?.user.role === "admin"}
              />
            ))}
          </div>
        </section>
      ) : (
        <p>Nenhum produto encontrado.</p>
      )}
    </section>
  );
}
