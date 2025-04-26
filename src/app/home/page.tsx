"use client";

import Carousel from "@/components/Carousel";
import Main from "@/components/Main";
import Image from "next/image";
import { useEffect, useState } from "react";
import axios from "axios";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import ProdutoCard from "@/components/ProdutoCard";
import { useIsVisible } from "@/hooks/useIsVisible";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function Home() {
  const [produtos, setProdutos] = useState<any>([]);
  const [loading, setLoading] = useState(true);
  const { data: session } = useSession();

  const { ref: ref1, isVisible: isVisible1 } = useIsVisible();
  const { ref: ref2, isVisible: isVisible2 } = useIsVisible();
  const { ref: ref3, isVisible: isVisible3 } = useIsVisible();
  const { ref: ref4, isVisible: isVisible4 } = useIsVisible();

  const images = [
    "/banners/banner.jpeg",
    "/banners/banner2.jpg",
    "/banners/banner3.jpg",
    "/banners/banner4.webp",
    "/banners/banner5.webp",
  ];

  useEffect(() => {
    axios
      .get("/api/produtos")
      .then((response) => {
        if (response.data.status === "success") {
          setProdutos(shuffleArray(response.data.data));
        } else {
          console.error("Erro ao buscar produtos:", response.data.message);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("Erro ao buscar produtos:", error);
        setLoading(false);
      });
  }, []);

  const shuffleArray = (array: any[]) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  const produtosPromocao = produtos.filter(
    (produto: any) => produto.precoDes != 0
  );

  return (
    <Main>
      <section
        ref={ref1}
        className={`
        transition-opacity
        ease-in
        duration-700
        ${isVisible1 ? "opacity-100" : "opacity-0"}
      `}
      >
        <Carousel images={images} />
      </section>

      <section
        ref={ref2}
        className={`
        transition-opacity
        ease-in
        duration-700
        ${isVisible2 ? "opacity-100" : "opacity-0"}
      `}
      >
        <h2 className="text-2xl font-semibold text-black mt-5 container mx-auto md:max-w-[1280px]">
          Produtos em promoção:
        </h2>
        <section className="container mx-auto mt-4 flex md:flex-row flex-col items-center w-full md:max-w-[1280px]">
          <div className="hidden md:grid grid-cols-4 gap-4 mt-4">
            {loading
              ? (
                  <>
                    <Skeleton className="w-full h-full max-h-[250px]" />
                    <Skeleton className="w-full h-full max-h-[250px]" />
                    <Skeleton className="w-full h-full max-h-[250px]" />
                    <Skeleton className="w-full h-full max-h-[250px]" />
                  </>
                )
              : produtosPromocao.map((produto: any, index: number) => {
                  if (index < 4)
                    return (
                      <ProdutoCard
                        key={index}
                        produto={produto}
                        loading={loading}
                        isAdmin={session?.user.role === "admin"}
                      />
                    );
                })}
          </div>
          <div className="md:hidden grid grid-cols-2 gap-4 mt-4">
            {loading
              ? Array.from({ length: 2 }).map((_, index) => (
                  <div
                    key={index}
                    className="bg-white border-2 border-gray-300 rounded-md shadow-md p-4"
                  >
                    <Skeleton height={300} />
                    <Skeleton height={30} className="mt-4" />
                    <Skeleton height={30} className="mt-1" />
                    <Skeleton height={20} className="mt-2" />
                  </div>
                ))
              : produtosPromocao.map((produto: any, index: number) => {
                  if (index < 2)
                    return (
                      <ProdutoCard
                        key={index}
                        produto={produto}
                        loading={loading}
                        isAdmin={session?.user.role === "admin"}
                      />
                    );
                })}
          </div>
          <Link
            href="/home/loja/promocao"
            className="md:hidden transition-all hover:scale-110 text-center p-4 my-4 shadow-md bg-[var(--primary)] w-full rounded-md font-bold"
          >
            VER MAIS
          </Link>
        </section>
        <Link
          href="/home/loja/promocao"
          className="hidden md:block mx-auto max-w-[512px] transition-all hover:scale-110 text-center p-4 my-4 shadow-md bg-[var(--primary)] w-full rounded-md font-bold"
        >
          VER MAIS
        </Link>
      </section>

      <section
        id="sobre"
        ref={ref3}
        className={`
        transition-opacity
        ease-in
        duration-700
        ${isVisible3 ? "opacity-100" : "opacity-0"}
        container mx-auto mt-4 flex md:flex-row flex-col items-center justify-center border-2 bg-white border-gray-300 p-6 rounded-md w-full md:max-w-[1280px] shadow-xl`}
      >
        <div className="md:max-w-1/2">
          <h2 className="text-2xl font-semibold text-black">Sobre Nós</h2>
          <p className="text-black mt-4">
            Na Briatori Essence trabalhamos com perfumes e cosméticos, dedicada
            a oferecer fragrâncias de qualidade para todos os gostos.
            Trabalhamos com perfumes masculinos, femininos, árabes e decants,
            além de hidratantes e produtos Victoria's Secret.
          </p>
          <p className="text-black mt-4">
            Nosso objetivo é proporcionar boas experiências olfativas, ajudando
            você a encontrar a essência que mais combina com seu estilo.
          </p>
          <p className="text-black mt-4">
            Encontre o seu perfume ideal conosco!
          </p>
        </div>
        <div>
          <Image
            src="/perfume.svg"
            alt="perfume svg"
            width={350}
            height={350}
            draggable={false}
            className="select-none min-w-[350px] min-h-[350px]"
          />
        </div>
      </section>

      <section
        ref={ref4}
        className={`
        transition-opacity
        ease-in
        duration-700
        ${isVisible4 ? "opacity-100" : "opacity-0"}
      `}
      >
        <h2 className="text-2xl font-semibold text-black mt-5 container mx-auto md:max-w-[1280px]">
          Produtos em destaque:
        </h2>
        <section className="container mx-auto mt-4 flex md:flex-row flex-col items-center w-full md:max-w-[1280px]">
          <section>
            <div className="hidden md:grid grid-cols-4 gap-4 mt-4">
              {produtos.map((produto: any, index: number) => {
                if (index < 4)
                  return (
                    <ProdutoCard
                      key={index}
                      produto={produto}
                      loading={loading}
                      isAdmin={session?.user.role === "admin"}
                    />
                  );
              })}
            </div>
            <div className="md:hidden grid grid-cols-2 gap-4 mt-4">
              {produtos.map((produto: any, index: number) => {
                if (index < 2)
                  return (
                    <ProdutoCard
                      key={index}
                      produto={produto}
                      loading={loading}
                      isAdmin={session?.user.role === "admin"}
                    />
                  );
              })}
            </div>
            <Link
              href="/home/loja"
              className="hidden md:block mx-auto max-w-[512px] transition-all hover:scale-110 text-center p-4 my-4 shadow-md bg-[var(--primary)] w-full rounded-md font-bold"
            >
              VER MAIS
            </Link>
          </section>
          <Link
            href="/home/loja"
            className="md:hidden transition-all hover:scale-110 text-center p-4 my-4 shadow-md bg-[var(--primary)] w-full rounded-md font-bold"
          >
            VER MAIS
          </Link>
        </section>
      </section>
    </Main>
  );
}
