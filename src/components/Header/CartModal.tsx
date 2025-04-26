"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaXmark } from "react-icons/fa6";
import { IoCartOutline } from "react-icons/io5";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FaTrashAlt } from "react-icons/fa";
import { useCart } from "../contexts/CartContext";

interface CartModalProps {
  showCart: boolean;
  setShowCart: (show: boolean) => void;
  cartRef: React.RefObject<HTMLDivElement | null>;
  fetchCartItemCount: () => void; // Adiciona a função como prop
}

interface Produto {
  id: string;
  nome: string;
  precoOrg: number;
  precoDes: number;
  imagens: string[];
}

interface Cart {
  products: { produto: Produto; quantidade: number }[];
  total: number;
}

const CartModal: React.FC<CartModalProps> = ({
  showCart,
  setShowCart,
  cartRef,
  fetchCartItemCount, // Recebe a função como prop
}) => {
  const { data: session } = useSession();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { cartItemCount, setCartItemCount } = useCart();

  const router = useRouter();

  useEffect(() => {
    const fetchCart = async () => {
      if (session) {
        try {
          const response = await fetch("/api/usuario/carrinho");
          const data = await response.json();
          if (data.status === "success") {
            setCart(data.data);
          } else {
            console.error("Erro ao buscar carrinho:", data.data);
          }
        } catch (error) {
          console.error("Erro ao buscar carrinho:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchCart();
  }, [cartItemCount]);

  const updateQuantity = async (produtoId: string, quantidade: number) => {
    try {
      const response = await fetch("/api/usuario/carrinho", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ produtoId, quantidade }),
      });

      const data = await response.json();

      if (data.status === "success") {
        setCart(data.data);
        fetchCartItemCount();
        setCartItemCount(data.data.products.length);
      } else {
        console.error("Erro ao atualizar quantidade:", data.data);
      }
    } catch (error) {
      console.error("Erro ao atualizar quantidade:", error);
    }
  };

  const handleIncrease = (produtoId: string, currentQuantity: number) => {
    updateQuantity(produtoId, currentQuantity + 1);
  };

  const handleDecrease = (produtoId: string, currentQuantity: number) => {
    if (currentQuantity > 1) {
      updateQuantity(produtoId, currentQuantity - 1);
    }
  };

  const handleRemove = async (produtoId: string) => {
    try {
      const response = await fetch("/api/usuario/carrinho", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ produtoId }),
      });

      const data = await response.json();

      if (data.status === "success") {
        setCart(data.data);
        fetchCartItemCount();
        setCartItemCount(data.data.products.length);
      } else {
        console.error("Erro ao remover produto do carrinho:", data.data);
      }
    } catch (error) {
      console.error("Erro ao remover produto do carrinho:", error);
    }
  };

  const calculateTotal = (
    products: { produto: Produto; quantidade: number }[]
  ) => {
    return products.reduce((acc, { produto, quantidade }) => {
      return (
        acc +
        (produto.precoDes > 0 ? produto.precoDes : produto.precoOrg) *
          quantidade
      );
    }, 0);
  };

  return (
    <AnimatePresence>
      {showCart && (
        <motion.section
          ref={cartRef}
          className="fixed right-0 top-0 h-full w-[400px] bg-white shadow-2xl z-50 flex flex-col"
          initial={{ x: "100%" }}
          animate={{ x: "0%" }}
          exit={{ x: "100%" }}
          transition={{ type: "tween", duration: 0.2 }}
        >
          {/* Header */}
          <header className="flex items-center justify-between p-4 border-b border-gray-200">
            <h1 className="text-xl font-semibold text-black">Carrinho</h1>
            <button
              onClick={() => setShowCart(false)}
              className="bg-[var(--primary)] cursor-pointer shadow-md rounded-md p-2 w-[3em] h-[3em] hover:bg-[var(--primary)] transition-colors flex items-center justify-center"
            >
              <FaXmark className="text-black text-2xl" />
            </button>
          </header>

          {/* Itens do carrinho - área rolável */}
          <section className="flex-1 p-4 overflow-y-auto">
          {cart && cart.products && cart.products.length > 0 ? (
              <div className="flex flex-col space-y-4">
                {cart.products.map(({ produto, quantidade }) => (
                  <div key={produto.id} className="flex items-center space-x-4">
                    <Image
                      width={100}
                      height={100}
                      src={produto.imagens[0]}
                      alt={produto.nome}
                      className="w-16 h-16 object-cover rounded-md"
                    />
                    <div className="flex flex-col flex-1">
                      <h2 className="text-lg font-semibold text-black">
                        {produto.nome}
                      </h2>
                      {produto.precoDes > 0 ? (
                        <section>
                          <div className="flex gap-2 text-gray-400 text-sm md:text-base">
                            de{" "}
                            <p className="line-through">
                              R$
                              {produto.precoOrg
                                .toFixed(2)
                                .toString()
                                .replace(".", ",")}
                            </p>
                            por
                          </div>
                          <div>
                            <p className="text-black text-lg md:text-xl inline-block">
                              <span className="bg-[var(--primary)] rounded-md">
                                R$
                                {(
                                  produto.precoDes -
                                  (produto.precoDes * 5) / 100
                                )
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
                                {produto.precoDes
                                  .toFixed(2)
                                  .toString()
                                  .replace(".", ",")}
                              </span>{" "}
                              no cartão
                            </p>
                          </div>
                        </section>
                      ) : (
                        <div>
                          <p className="text-black text-lg md:text-xl inline-flex items-center">
                            <span className="bg-[var(--primary)] rounded-md">
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
                              R$
                              {produto.precoOrg
                                .toFixed(2)
                                .toString()
                                .replace(".", ",")}
                            </span>{" "}
                            no cartão
                          </p>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <h3>Quantidade:</h3>
                        <div className="flex items-center space-x-2 w-1/2">
                          <button
                            onClick={() =>
                              handleDecrease(produto.id, quantidade)
                            }
                            className="bg-gray-200 p-2 w-8 rounded-md cursor-pointer font-bold"
                          >
                            -
                          </button>
                          <p className="text-sm text-gray-500">{quantidade}</p>
                          <button
                            onClick={() =>
                              handleIncrease(produto.id, quantidade)
                            }
                            className="bg-gray-200 p-2 w-8 rounded-md cursor-pointer font-bold"
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={() => handleRemove(produto.id)}
                          className="transition-colors duration-200 p-2 text-xl rounded-md cursor-pointer hover:bg-red-500 text-red-500 hover:text-white border border-red-500"
                        >
                          <FaTrashAlt />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-1 flex-col h-full items-center justify-center space-y-4">
                <IoCartOutline className="text-8xl text-[var(--primary)]" />
                <div className="text-center">
                  <p className="text-lg text-black">Seu carrinho está vazio.</p>
                  <p className="text-lg text-black">
                    Mas você ainda pode navegar pela loja!
                  </p>
                </div>
                <Link
                  href="/home/loja"
                  onClick={() => setShowCart(false)}
                  className="bg-black cursor-pointer text-white p-2 rounded-md shadow-md mt-4"
                >
                  Ver produtos
                </Link>
              </div>
            )}
          </section>

          {cart?.products && cart.products.length > 0 && (
            <div
              id="total"
              className="w-full p-4 border-t border-gray-200 bg-white"
            >
              <div className="flex justify-between items-center">
                <p className="text-lg font-semibold text-black">Subtotal:</p>
                <div className="text-center">
                  <p className="text-md font-semibold text-black">
                    R$
                    {calculateTotal(cart?.products || [])
                      .toFixed(2)
                      .toString()
                      .replace(".", ",")}{" "}
                    no cartão
                  </p>
                  <span className="italic">OU</span>
                  <p className="text-lg font-semibold text-black">
                    <span className="p-1 bg-[var(--primary)] rounded-md">
                      R$
                      {(
                        calculateTotal(cart?.products || []) -
                        (calculateTotal(cart?.products || []) * 5) / 100
                      )
                        .toFixed(2)
                        .toString()
                        .replace(".", ",")}
                    </span>{" "}
                    no Pix
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowCart(false);
                  router.push("/home/checkout");
                }}
                className="bg-black w-full text-center cursor-pointer text-white p-2 rounded-md shadow-md mt-4"
              >
                Ir para o checkout
              </button>
            </div>
          )}
        </motion.section>
      )}
    </AnimatePresence>
  );
};

export default CartModal;
