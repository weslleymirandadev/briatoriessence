"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import React from "react";
import { signIn, useSession } from "next-auth/react";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Parallax } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import { IoCartOutline } from "react-icons/io5";
import Link from "next/link";
import { FaTruckArrowRight } from "react-icons/fa6";
import { FaCheck, FaHouseUser, FaMailBulk } from "react-icons/fa";
import ProdutoCard from "@/components/ProdutoCard";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/contexts/CartContext";

interface Produto {
  id: string;
  nome: string;
  precoOrg: number;
  precoDes: number;
  descricao: string;
  imagens: string[];
  tags: string;
  peso: number;
  altura: number;
  largura: number;
  comprimento: number;
}

export default function Produto({
  params,
}: {
  params: Promise<{ nomeProduto: string }>;
}) {
  const [produto, setProduto] = useState<Produto>({
    id: "",
    nome: "",
    precoOrg: 0,
    precoDes: 0,
    descricao: "",
    imagens: [],
    tags: "",
    peso: 0,
    altura: 0,
    largura: 0,
    comprimento: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [freteLoading, setFreteLoading] = useState<boolean>(false);
  const [nomeProduto, setNomeProduto] = useState<string>();
  const [cep, setCep] = useState<string>();
  const [cepInfo, setCepInfo] = useState<any>();
  const [error, setError] = useState<any>();
  const [frete, setFrete] = useState<any>();
  const [addingToCart, setAddingToCart] = useState<boolean>(false);
  const [addedToCart, setAddedToCart] = useState<boolean>(false);
  const [relatedProdutos, setRelatedProdutos] = useState<Produto[]>([]);
  const router = useRouter();
  const { data: session, status } = useSession();
  const { setCartItemCount } = useCart();

  useEffect(() => {
    params.then((resolvedParams) => {
      setNomeProduto(resolvedParams.nomeProduto);
    });
  }, [params]);

  useEffect(() => {
    if (!nomeProduto) {
      setLoading(true);
      return;
    }

    axios
      .get(`/api/produtos/${decodeURIComponent(nomeProduto)}`)
      .then((response) => {
        setProduto(response.data.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Erro ao buscar produto:", error);
        setLoading(false);
      });
  }, [nomeProduto]);

  useEffect(() => {
    if (produto.tags) {
      axios
        .get("/api/produtos")
        .then((response) => {
          const produtos = response.data.data;
          const produtoTags = produto.tags.split(" ");
          const filteredProdutos = produtos
            .filter((p: Produto) =>
              p.tags.split(" ").some((tag) => produtoTags.includes(tag))
            )
            .sort((a: Produto, b: Produto) => b.precoOrg - a.precoOrg)
            .slice(0, 8)
            .reverse();
          setRelatedProdutos(filteredProdutos);
        })
        .catch((error) => {
          console.error("Erro ao buscar produtos relacionados:", error);
        });
    }
  }, [produto.tags]);

  if (loading) {
    return <div>Loading...</div>;
  }

  async function calcularFrete() {
    if (!cep) return;
    if (cep.length < 8) return;

    setFreteLoading(true);
    setError("");

    await axios
      .post(
        "/api/correios/preco-e-prazo",
        {
          cep,
          produtos: [
            {
              produto,
              quantidade: 1,
            },
          ],
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
      .then((response) => {
        setFrete(response.data.frete);
        setCepInfo(response.data.cep);
        console.log(frete);
        console.log(cepInfo);
      })
      .catch((error) => {
        setError(error);
      });

    setFreteLoading(false);
  }

  const redirectToLogin = (callbackUrl: string) => {
    signIn(undefined, { callbackUrl });
  };

  const addToCart = async () => {
    setAddingToCart(true);
    if (!session) {
      redirectToLogin(
        `/autenticar/login?callbackUrl=/home/loja/produtos/${produto?.nome}`
      );
    } else {
      try {
        const response = await fetch("/api/usuario/carrinho", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: session.user.email,
            produto: { id: produto?.id },
          }),
        });

        const data = await response.json();

        if (data.status === "success") {
          setAddedToCart(true);
          const response = await fetch("/api/usuario/carrinho", {
            method: "get",
            headers: {
              "Content-Type": "application/json",
            },
          });
          setCartItemCount((await response.json()).data.products.length)
          setTimeout(() => {
            setAddedToCart(false);
          }, 3000);
        } else {
          console.error("Erro ao adicionar produto ao carrinho:", data.data);
        }
      } catch (error) {
        console.error("Erro ao adicionar produto ao carrinho:", error);
      } finally {
        setAddingToCart(false);
      }
    }
  };

  const redirectToBuy = () => {
    if (!session) {
      redirectToLogin(
        `/autenticar/login?callbackUrl=/home/loja/produtos/${produto?.nome}?action=buy`
      );
    } else {
      addToCart();
      router.push("/home/checkout");
    }
  };

  return (
    <>
      <section className="container mx-auto mt-4 flex md:flex-row flex-col items-center w-full md:max-w-[1280px] justify-center">
        <section className="relative flex md:flex-row flex-col justify-center items-center md:items-start gap-5 bg-white p-5 rounded-md border-2 border-gray-300 max-w-[1280px]">
          {produto.precoDes > 0 && (
            <div className="absolute left-0 top-[5%] z-10 bg-[var(--primary)] px-4 py-2 rounded-r-full text-black font-bold">
              {Math.floor((produto.precoOrg / produto.precoDes) * 100 - 100)}%
              OFF
            </div>
          )}
          <div>
            <Swiper
              modules={[Autoplay, Pagination, Parallax]}
              autoplay={{ delay: 3000, disableOnInteraction: false }}
              loop={true}
              spaceBetween={0}
              slidesPerView={1}
              pagination={{ clickable: true }}
              navigation={true}
              parallax={true}
              className="max-w-[300px]"
            >
              {produto.imagens.map((image, index) => (
                <SwiperSlide key={index}>
                  <div className="relative w-[300px] h-[300px]">
                    <Image
                      draggable={false}
                      src={image}
                      quality={100}
                      alt={produto.nome}
                      layout="fill"
                      objectFit="cover"
                      loading="lazy"
                      className="select-none rounded-md"
                    />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
          <section className="flex flex-col w-full justify-between items-start flex-grow">
            <h2 className="text-black text-2xl line-clamp-2">{produto.nome}</h2>
            {produto.precoDes > 0 ? (
              <section>
                <div className="flex gap-2 text-gray-400 text-sm md:text-base">
                  de{" "}
                  <p className="line-through">
                    R${produto.precoOrg.toFixed(2).toString().replace(".", ",")}
                  </p>
                  por
                </div>
                <div>
                  <p className="text-black text-lg md:text-xl mt-2 inline-block">
                    <span className="bg-[var(--primary)] rounded-md p-1">
                      R$
                      {(produto.precoDes - (produto.precoDes * 5) / 100)
                        .toFixed(2)
                        .toString()
                        .replace(".", ",")}
                    </span>
                    <span className="ms-2 text-sm md:text-md text-gray-500 italic">
                      NO PIX
                    </span>
                  </p>
                  <p className="italic text-sm md:text-base">
                    ou{" "}
                    <span className="underline">
                      R$
                      {produto.precoDes.toFixed(2).toString().replace(".", ",")}
                    </span>{" "}
                    no cartão
                  </p>
                </div>
              </section>
            ) : (
              <div>
                <p className="text-black text-lg md:text-xl mt-2 inline-flex items-center">
                  <span className="bg-[var(--primary)] rounded-md p-1">
                    R$
                    {(produto.precoOrg - (produto.precoOrg * 5) / 100)
                      .toFixed(2)
                      .toString()
                      .replace(".", ",")}
                  </span>
                  <span className="ms-2 text-sm md:text-md text-gray-500 italic">
                    NO PIX
                  </span>
                </p>
                <p className="italic text-sm md:text-base">
                  ou{" "}
                  <span className="underline">
                    R${produto.precoOrg.toFixed(2).toString().replace(".", ",")}
                  </span>{" "}
                  no cartão
                </p>
              </div>
            )}
            <span className="mt-5 text-gray-400">{produto.descricao}</span>
          </section>
          <div className={`relative z-20 grid grid-cols-1 mt-4 w-full`}>
            <section className="w-full">
              <h2 className="text-lg">
                <FaTruckArrowRight className="text-2xl inline text-[var(--primary)]" />{" "}
                CEP para o cálculo do frete:
              </h2>
              <input
                name="cep"
                minLength={8}
                maxLength={9}
                onChange={(e) => setCep(e.target.value)}
                placeholder="00000-000"
                type="text"
                className="w-1/2 rounded-md p-2 border border-black"
              />
              <button
                onClick={calcularFrete}
                className="cursor-pointer transition-all shadow-md hover:scale-110 hover:shadow-lg ms-2 bg-[var(--primary)] p-2 rounded-md font-bold border border-[var(--primary)] min-w-[80px]"
              >
                {freteLoading ? (
                  <div className="inline-block h-4 w-4 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] text-primary motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                ) : (
                  "BUSCAR"
                )}
              </button>
            </section>
            <section className="mb-5">
              {cepInfo && (
                <section className="block">
                  <h3 className="text-gray-500 inline">
                    <FaHouseUser className="inline" /> Para:
                  </h3>
                  <p className="ms-2 inline">
                    {cepInfo.logradouro}, {cepInfo.bairro}, {cepInfo.localidade}{" "}
                    - {cepInfo.uf}
                  </p>
                </section>
              )}
              {frete && (
                <div className="inline-flex items-center gap-2">
                  <h3>Via:</h3>
                  <Image
                    width={100}
                    height={50}
                    src={frete[0].company.picture}
                    alt={frete[0].company.name}
                    className="my-2"
                  />
                </div>
              )}
              {frete &&
                frete.map((info: any, index: number) => (
                  <section key={index}>
                    <div className="flex items-center w-full">
                      <h3 className="text-gray-500">
                        <FaMailBulk className="inline" /> {info.name}:
                        <span className="text-black ms-2">
                          R${info.price.toFixed(2)}
                        </span>
                        <FaTruckArrowRight className="ms-2 inline" /> Chegará
                        em:{" "}
                        <span className="text-black">
                          {info.delivery_time} dias após o envio.
                        </span>
                      </h3>
                    </div>
                  </section>
                ))}
              {error && error.message}
            </section>
            {session?.user.role === "admin" ? (
              <Link
                href={`/dashboard/editar/${produto.nome}`}
                className="text-center p-2 cursor-pointer transition-colors duration-200 w-full rounded-md border border-black font-bold hover:bg-black hover:text-white text-sm md:text-base"
              >
                EDITAR
              </Link>
            ) : (
              <section className="w-full">
                <section className="grid grid-cols-1 min-w-[200px] h-full justify-items-center w-full">
                  <button
                    onClick={redirectToBuy}
                    className="p-2 md:p-4 md:mb-0 cursor-pointer transition-colors duration-200 w-full rounded-md border border-black font-bold hover:bg-black hover:text-white text-sm md:text-base"
                  >
                    COMPRAR
                  </button>
                  <button
                    onClick={addToCart}
                    className="transition-all mt-3 w-full inline-flex justify-center items-center duration-200 hover:shadow-lg hover:scale-110 cursor-pointer bg-[var(--primary)] p-2 rounded-md text-sm md:text-base"
                  >
                    {addingToCart ? (
                      <div className="inline-block h-4 w-4 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] text-primary motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                    ) : addedToCart ? (
                      <FaCheck className="text-2xl md:text-4xl" />
                    ) : (
                      <IoCartOutline className="text-2xl md:text-4xl" />
                    )}
                  </button>
                </section>
              </section>
            )}
          </div>
        </section>
      </section>

      <h2 className="text-2xl font-semibold text-black mt-5 container mx-auto md:max-w-[1280px]">
        Produtos relacionados:
      </h2>
      <section className="container mx-auto mt-4 flex md:flex-row flex-col items-center w-full md:max-w-[1280px]">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4 w-full">
          {relatedProdutos.map((produto: Produto, index: number) => (
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
    </>
  );
}
