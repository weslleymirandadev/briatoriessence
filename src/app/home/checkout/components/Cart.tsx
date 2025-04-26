import { useCart } from "@/components/contexts/CartContext";
import { motion } from "framer-motion";
import { Session } from "next-auth";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import Image from "next/image";
import { FaTrashAlt } from "react-icons/fa";
import axios from "axios";

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

export default function CartContent({
  advanceTo,
  session,
  isOpen,
  setIsOpen,
}: {
  advanceTo: (targetStep: "cart" | "address" | "billing" | "success") => void;
  session: Session | null;
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
}) {
  const [cart, setCart] = useState<Cart | null>(null);
  const { cartItemCount, setCartItemCount } = useCart();

  useEffect(() => {
    setIsOpen(true);
  }, []);

  useEffect(() => {
    const fetchCart = async () => {
      if (session) {
        const response = await axios.get("/api/usuario/carrinho");
        const data = await response.data;
        if (data.status === "success") {
          setCart(data.data);
        }
      }
    };
    fetchCart();
  }, [cartItemCount, session]);

  const fetchCartItemCount = async () => {
    if (session) {
      const response = await fetch("/api/usuario/carrinho");
      const data = await response.json();
      if (data.status === "success" && data.data) {
        const itemCount = data.data.products.reduce(
          (acc: number, item: any) => acc + item.quantidade,
          0
        );
        setCartItemCount(itemCount);
      }
    }
  };

  useEffect(() => {
    const carregarDados = async () => {
      const dadosPedido = sessionStorage.getItem("pedidoPendente");

      if (dadosPedido) {
        advanceTo("billing");
        return;
      }
    };

    carregarDados();
  });

  useEffect(() => {
    fetchCartItemCount();
  }, [session]);

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
    <motion.div
      key="cart"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="w-full md:max-w-[550px] bg-white border border-gray-300 rounded-md p-4 mt-8"
    >
      {cart && cart.products.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-4">
          <h2 className="text-xl font-semibold text-center">
            Seu carrinho está vazio
          </h2>
          <button
            onClick={() => (window.location.href = "/home/loja")}
            className="px-6 py-2  duration-200 bg-[var(--primary)] text-black font-bold rounded-md hover:scale-110 transition-all cursor-pointer shadow-md hover:shadow-xl"
          >
            Voltar para a Loja
          </button>
        </div>
      ) : (
        <>
          <motion.div
            layout
            className="bg-white p-4 shadow-md w-full rounded-md md:max-w-[550px] border border-gray-300"
          >
            <h2 className="text-lg font-semibold text-black">
              Produtos no carrinho
            </h2>
          </motion.div>

          <motion.div
            layout
            className="flex flex-col shadow-md space-y-4 w-full md:max-w-[550px] border border-gray-300 bg-white p-4 rounded-md mt-4"
            transition={{ duration: 0.2 }}
          >
            {isOpen &&
              cart &&
              cart.products.map(({ produto, quantidade }) => (
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
                          onClick={() => handleDecrease(produto.id, quantidade)}
                          className="bg-gray-200 p-2 w-8 rounded-md cursor-pointer font-bold"
                        >
                          -
                        </button>
                        <p className="text-sm text-gray-500">{quantidade}</p>
                        <button
                          onClick={() => handleIncrease(produto.id, quantidade)}
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
            <hr className="border border-gray-300" />
            {isOpen && (
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
            )}
            <hr className="border border-gray-300" />
            <div className="flex justify-between">
              <div></div>
              <button
                onClick={() => advanceTo("address")}
                className="cursor-pointer p-2 rounded-md transition-colors border border-black text-black bg-white hover:text-white hover:bg-black"
              >
                Avançar
              </button>
            </div>
          </motion.div>
        </>
      )}
    </motion.div>
  );
}