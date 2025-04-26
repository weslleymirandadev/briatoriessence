import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { IoCartOutline } from "react-icons/io5";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FaCheck } from "react-icons/fa";
import { useCart } from "./contexts/CartContext";

type ProdutoProps = {
  produto?: {
    id: string;
    nome: string;
    imagens: string[];
    precoOrg: number;
    precoDes: number;
  };
  loading?: boolean;
  loadingSession?: boolean;
  isAdmin: boolean;
  layout?: "vertical" | "horizontal";
};

export default function ProdutoCard({
  produto,
  loading,
  loadingSession,
  isAdmin,
  layout = "vertical",
}: ProdutoProps) {
  const [swiperInstance, setSwiperInstance] = useState<any>(null);
  const [addingToCart, setAddingToCart] = useState<boolean>(false);
  const [addedToCart, setAddedToCart] = useState<boolean>(false);
  const transitionDuration = 300;
  const { data: session } = useSession();
  const router = useRouter();
  const { setCartItemCount } = useCart()
  
  if (loading) {
    return (
      <div className="bg-white border-2 border-gray-300 rounded-md shadow-md p-4 min-w-[300px]">
        <Skeleton height={300} />
        <Skeleton height={30} className="mt-4" />
        <Skeleton height={30} className="mt-1" />
        <Skeleton height={20} className="mt-2" />
      </div>
    );
  }

  if (!produto) return null;

  const handleMouseEnter = () => {
    if (swiperInstance) {
      // Muda para a próxima imagem com transição
      swiperInstance.slideNext(transitionDuration);
      swiperInstance.autoplay.start();
    }
  };

  const handleMouseLeave = () => {
    if (swiperInstance) {
      swiperInstance.autoplay.stop();
      // Retorna para a primeira imagem (slide original de índice 0) com transição
      swiperInstance.slideToLoop(0, transitionDuration);
    }
  };

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
        `/autenticar/login?callbackUrl=/home/loja/produtos/${produto?.nome}`
      );
    } else {
      addToCart();
      router.push("/home/checkout");
    }
  };

  return (
    <section
      className={`relative z-0 hover:z-10 hover:scale-110 transition-all bg-white border-2 border-gray-300 hover:border-[var(--primary)] rounded-md shadow-md hover:shadow-2xl p-4 flex ${
        layout === "vertical" ? "flex-col" : "flex-row"
      } justify-between`}
    >
      {produto.precoDes > 0 && (
        <div className="absolute left-0 z-10 bg-[var(--primary)] px-4 py-2 rounded-r-full text-black font-bold">
          {Math.floor((produto.precoOrg / produto.precoDes) * 100 - 100)}% OFF
        </div>
      )}

      <Link
        href={`/home/loja/produtos/${produto.nome}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`${layout === "vertical" ? "w-full" : "w-1/3"}`}
      >
        <Swiper
          onSwiper={(swiper) => {
            setSwiperInstance(swiper);
            swiper.autoplay.stop();
          }}
          modules={[Autoplay]}
          autoplay={{ delay: 1000, disableOnInteraction: false }}
          loop={true}
          className={`${layout === "vertical" ? "h-full" : "w-full"}`}
        >
          {produto.imagens.map((image, index) => (
            <SwiperSlide key={index}>
              <div className="relative w-full h-0 pb-[100%]">
                <Image
                  draggable={false}
                  src={image}
                  quality={100}
                  alt={produto.nome}
                  layout="fill"
                  objectFit="cover"
                  loading="lazy"
                  className={`select-none rounded-md ${
                    layout === "vertical" ? "" : "max-h-[250px] max-w-[250px]"
                  }`}
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </Link>
      <div className={layout === "vertical" ? "mt-4" : "ml-4 flex-grow"}>
        <Link href={`/home/loja/produtos/${produto.nome}`}>
          <h2 className="hover:underline text-black text-lg line-clamp-2">
            {produto.nome}
          </h2>
        </Link>
        <section className="flex flex-col w-full justify-between items-start flex-grow">
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
                    R${produto.precoDes.toFixed(2).toString().replace(".", ",")}
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
        </section>
        <div
          className={`relative z-20 flex ${
            layout === "vertical" ? "md:flex-row flex-col" : "flex-row"
          } justify-between mt-4`}
        >
          {loadingSession ? (
            <Skeleton className="p-2 md:p-4 w-full" />
          ) : (
            <>
              {isAdmin ? (
                <Link
                  href={`/dashboard/editar/${produto.nome}`}
                  className="text-center p-2 cursor-pointer transition-colors duration-200 w-full rounded-md border border-black font-bold hover:bg-black hover:text-white text-sm md:text-base"
                >
                  EDITAR
                </Link>
              ) : (
                <>
                  <button
                    onClick={redirectToBuy}
                    className="p-2 md:p-4 mb-4 md:mb-0 cursor-pointer transition-colors duration-200 w-full rounded-md border border-black font-bold hover:bg-black hover:text-white text-sm md:text-base"
                  >
                    COMPRAR
                  </button>
                  <button
                    onClick={addToCart}
                    className="transition-all w-full flex justify-center items-center duration-200 hover:shadow-lg hover:scale-110 cursor-pointer md:ml-2 md:w-[20%] bg-[var(--primary)] p-2 rounded-md text-sm md:text-base"
                  >
                    {addingToCart ? (
                      <div className="inline-block h-4 w-4 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] text-primary motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                    ) : addedToCart ? (
                      <FaCheck className="text-2xl md:text-4xl" />
                    ) : (
                      <IoCartOutline className="text-2xl md:text-4xl" />
                    )}
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}

