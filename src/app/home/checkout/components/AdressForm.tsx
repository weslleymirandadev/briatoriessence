"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FaTruckArrowRight } from "react-icons/fa6";
import { FaMailBulk } from "react-icons/fa";
import { motion } from "framer-motion";
import Image from "next/image";
import { Session } from "next-auth";

// Schema para o formulário de endereço completo
const addressSchema = z.object({
  nome: z.string().min(2, "Nome é obrigatório"),
  telefone: z
    .string()
    .min(14, "Telefone é obrigatório")
    .max(15, "Telefone inválido"),
  cep: z
    .string()
    .min(8, "CEP deve ter no mínimo 8 dígitos")
    .max(9, "CEP inválido"),
  cpf: z
    .string()
    .min(14, "CPF deve ter no mínimo 8 dígitos")
    .max(14, "CPF inválido"),
  logradouro: z.string().min(1, "Rua é obrigatória"),
  numero: z.string().min(1, "Número é obrigatório"),
  complemento: z.string().optional(),
  bairro: z.string().min(1, "Bairro é obrigatório"),
  estado_cidade: z.string().min(1, "Cidade e Estado são obrigatórios"),
  frete: z.string().refine(
    (value) => value !== "" && !isNaN(Number(value)) && Number(value) >= 0,
    { message: "Selecione uma opção de frete" } // Mensagem de erro personalizada
  ),
});

type AddressFormData = z.infer<typeof addressSchema>;

export default function AddressForm({
  advanceTo,
  session,
}: {
  advanceTo: (targetStep: "cart" | "address" | "billing" | "success") => void;
  session: Session | null;
}) {
  const [frete, setFrete] = useState<any>(null);
  const [error, setError] = useState<string>("");
  const [data, setData] = useState<any>();

  // Configuração do formulário com react-hook-form e zod
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
  });

  useEffect(() => {
    const fetchAddress = async () => {
      await axios
        .get("/api/usuario/address")
        .then((response) => {
          setData(response.data.data);
        })
        .catch((err) => console.error(err));
    };

    fetchAddress();
  }, []);

  const cepValue = watch("cep");
  useEffect(() => {
    const numericCep = cepValue?.replace(/\D/g, "");
    if (numericCep && numericCep.length === 8) {
      axios
        .get(`https://viacep.com.br/ws/${numericCep}/json/`)
        .then((res) => {
          if (!res.data.erro) {
            setValue("logradouro", res.data.logradouro || "");
            setValue("bairro", res.data.bairro || "");
            setValue(
              "estado_cidade",
              `${res.data.uf} - ${res.data.localidade}` || ""
            );

            // Obter dados atualizados e calcular frete
            const formData = getValues();
            calcularFrete(formData);
          }
        })
        .catch((err) => console.error("Erro no viacep:", err));
    }
  }, [cepValue, setValue, getValues]);

  // Componente AddressForm (parte relevante)
  const saveAndAdvance = async (data: AddressFormData) => {
    try {
      // 1. Salvar endereço
      const [estado, cidade] = data.estado_cidade.split(" - ");

      const post_data = {
        userId: session?.user.id, // Obter da sessão
        rua: data.logradouro,
        numero: data.numero,
        complemento: data.complemento,
        bairro: data.bairro,
        cidade,
        estado,
        telefone: data.telefone,
        cep: data.cep,
        cpf: data.cpf,
        nome: data.nome,
      };

      await axios.post("/api/usuario/address", post_data, {
        headers: { "Content-Type": "application/json" },
      });

      // 2. Criar pedido preliminar
      const cartResponse = await axios.get("/api/usuario/carrinho");
      const cartData = await cartResponse.data;
      const selectedFrete = frete[Number(data.frete)];

      const orderData = {
        produtos: cartData.data.products,
        frete: selectedFrete.price,
        tipoFrete: selectedFrete.name,
        total: cartData.data.total + selectedFrete.price,
        endereco: data,
        status: "pendente",
      };

      sessionStorage.setItem("pedidoPendente", JSON.stringify(orderData));

      advanceTo("billing");
    } catch (error) {
      console.error(error);
      setError("Erro ao processar pedido. Tente novamente.");
    }
  };

  const mascaraTelefone = (event: any) => {
    let input = event.target;
    input.value = phoneMask(input.value);
  };

  const handleZipCode = (event: any) => {
    let input = event.target;
    input.value = zipCodeMask(input.value);
  };

  const zipCodeMask = (value: string) => {
    if (!value) return "";
    value = value.replace(/\D/g, "");
    value = value.replace(/(\d{5})(\d)/, "$1-$2");
    return value;
  };

  const mascaraCpf = (event: any) => {
    let input = event.target;
    input.value = cpfMask(input.value);
  };

  const cpfMask = (v: string) => {
    v = v.replace(/\D/g, "");
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    return v;
  };

  const phoneMask = (value: string) => {
    if (!value) return "";
    value = value.replace(/\D/g, "");
    value = value.replace(/(\d{2})(\d)/, "($1) $2");
    value = value.replace(/(\d)(\d{4})$/, "$1-$2");
    return value;
  };

  const calcularFrete = async (data: AddressFormData) => {
    const { cep } = data;
    if (!cep || cep.replace(/\D/g, "").length < 8) return;
    setError("");

    const produtos = await (await axios.get("/api/usuario/carrinho")).data.data;

    try {
      const response = await axios.post(
        "/api/correios/preco-e-prazo",
        {
          cep,
          produtos: produtos.products,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      setFrete(response.data.frete);
    } catch (err: any) {
      setError(err.message || "Erro ao calcular frete");
    }
  };

  if (!data) return <h1>Carregando...</h1>;

  return (
    <motion.div
      key="address"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="w-full md:max-w-[550px] bg-white border border-gray-300 rounded-md p-4 mt-8"
    >
      <form onSubmit={handleSubmit(saveAndAdvance)}>
        <h2 className="text-lg font-semibold text-black flex items-center gap-2">
          <FaTruckArrowRight className="text-2xl text-[var(--primary)]" />
          Endereço de entrega
        </h2>
        <div className="space-y-4 mt-4">
          <div className="flex items-start justify-between gap-4">
            {/* Nome */}
            <div className="relative w-full">
              <input
                id="nome"
                defaultValue={data?.name ?? ""}
                {...register("nome", { required: "Nome é obrigatório" })}
                className={`peer h-10 w-full border rounded-md px-3 py-5 text-sm focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] outline-none ${
                  errors.nome ? "border-red-400" : "border-gray-300"
                }`}
                placeholder=" "
              />
              <label
                htmlFor="nome"
                className={`select-none absolute bg-white p-[2px] left-3 transition-all 
                peer-placeholder-shown:top-[0.45rem] peer-placeholder-shown:text-base 
                peer-placeholder-shown:text-gray-400 top-[-0.8rem] text-sm 
                ${errors.nome ? "text-red-400" : "text-gray-300"} 
                peer-focus:text-[var(--primary)] peer-focus:top-[-0.8rem] peer-focus:text-sm`}
              >
                Nome Completo
              </label>
              {errors.nome && (
                <span className="text-red-400">{errors.nome.message}</span>
              )}
            </div>

            {/* Telefone */}
            <div className="relative w-full">
              <input
                id="telefone"
                type="tel"
                defaultValue={data?.telefone ?? ""}
                minLength={14}
                maxLength={15}
                {...register("telefone", {
                  required: "Telefone é obrigatório",
                  onChange: (e) => mascaraTelefone(e),
                })}
                className={`peer h-10 w-full border rounded-md px-3 py-5 text-sm focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] outline-none ${
                  errors.telefone ? "border-red-400" : "border-gray-300"
                }`}
                placeholder=" "
              />
              <label
                htmlFor="telefone"
                className={`select-none line-clamp-1 absolute bg-white p-[2px] left-3 transition-all 
                      peer-placeholder-shown:top-[0.45rem] peer-placeholder-shown:text-base 
                      peer-placeholder-shown:text-gray-400 top-[-0.8rem] text-sm 
                      ${errors.telefone ? "text-red-400" : "text-gray-300"} 
                      peer-focus:text-[var(--primary)] peer-focus:top-[-0.8rem] peer-focus:text-sm`}
              >
                Número de Telefone
              </label>
              {errors.telefone && (
                <span className="text-red-400">{errors.telefone.message}</span>
              )}
            </div>
          </div>

          {/* CPF */}
          <div className="relative">
            <input
              id="cpf"
              defaultValue={data?.cpf ?? ""}
              minLength={14}
              maxLength={14}
              {...register("cpf", {
                required: "CPF é obrigatório",
                onChange: (e) => mascaraCpf(e),
              })}
              className={`peer h-10 w-full border rounded-md px-3 py-5 text-sm focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] outline-none ${
                errors.cpf ? "border-red-400" : "border-gray-300"
              }`}
              placeholder=" "
            />
            <label
              htmlFor="cpf"
              className={`select-none absolute bg-white p-[2px] left-3 transition-all 
                peer-placeholder-shown:top-[0.45rem] peer-placeholder-shown:text-base 
                peer-placeholder-shown:text-gray-400 top-[-0.8rem] text-sm 
                ${errors.cpf ? "text-red-400" : "text-gray-300"} 
                peer-focus:text-[var(--primary)] peer-focus:top-[-0.8rem] peer-focus:text-sm`}
            >
              CPF
            </label>
            {errors.cpf && (
              <span className="text-red-400">{errors.cpf.message}</span>
            )}
          </div>

          {/* CEP */}
          <div className="relative">
            <input
              id="cep"
              minLength={8}
              maxLength={9}
              {...register("cep", {
                required: "CEP é obrigatório",
                onChange: (e) => handleZipCode(e),
              })}
              className={`peer h-10 w-full border rounded-md px-3 py-5 text-sm focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] outline-none ${
                errors.cep ? "border-red-400" : "border-gray-300"
              }`}
              placeholder=" "
            />
            <label
              htmlFor="cep"
              className={`select-none absolute bg-white p-[2px] left-3 transition-all 
                peer-placeholder-shown:top-[0.45rem] peer-placeholder-shown:text-base 
                peer-placeholder-shown:text-gray-400 top-[-0.8rem] text-sm 
                ${errors.cep ? "text-red-400" : "text-gray-300"} 
                peer-focus:text-[var(--primary)] peer-focus:top-[-0.8rem] peer-focus:text-sm`}
            >
              CEP
            </label>
            {errors.cep && (
              <span className="text-red-400">{errors.cep.message}</span>
            )}
          </div>

          {/* Cidade */}
          <div className="relative">
            <input
              id="estado_cidade"
              defaultValue={
                data?.address?.estado
                  ? `${data?.address?.estado} - ${data?.address?.cidade}`
                  : ""
              }
              {...register("estado_cidade", {
                required: "Cidade é obrigatória",
              })}
              className={`peer h-10 w-full border rounded-md px-3 py-5 text-sm focus:border-[var(--primary)] 
                 focus:ring-1 focus:ring-[var(--primary)] outline-none ${
                   errors.estado_cidade ? "border-red-400" : "border-gray-300"
                 }`}
              placeholder=" "
            />
            <label
              htmlFor="estado_cidade"
              className={`select-none absolute bg-white p-[2px] left-3 transition-all 
                peer-placeholder-shown:top-[0.45rem] peer-placeholder-shown:text-base 
                peer-placeholder-shown:text-gray-400 top-[-0.8rem] text-sm 
                ${errors.estado_cidade ? "text-red-400" : "text-gray-300"} 
                peer-focus:text-[var(--primary)] peer-focus:top-[-0.8rem] peer-focus:text-sm`}
            >
              Estado - Cidade
            </label>
            {errors.estado_cidade && (
              <span className="text-red-400">
                {errors.estado_cidade.message}
              </span>
            )}
          </div>

          {/* Bairro */}
          <div className="relative">
            <input
              id="bairro"
              defaultValue={data?.address?.bairro ?? ""}
              {...register("bairro", {
                required: "Bairro é obrigatório",
              })}
              className={`peer h-10 w-full border rounded-md px-3 py-5 text-sm focus:border-[var(--primary)] 
                 focus:ring-1 focus:ring-[var(--primary)] outline-none ${
                   errors.bairro ? "border-red-400" : "border-gray-300"
                 }`}
              placeholder=" "
            />
            <label
              htmlFor="bairro"
              className={`select-none absolute bg-white p-[2px] left-3 transition-all 
                peer-placeholder-shown:top-[0.45rem] peer-placeholder-shown:text-base 
                peer-placeholder-shown:text-gray-400 top-[-0.8rem] text-sm 
                ${errors.bairro ? "text-red-400" : "text-gray-300"} 
                peer-focus:text-[var(--primary)] peer-focus:top-[-0.8rem] peer-focus:text-sm`}
            >
              Bairro
            </label>
            {errors.bairro && (
              <span className="text-red-400">{errors.bairro.message}</span>
            )}
          </div>

          <div className="flex items-start justify-between gap-4">
            {/* Logradouro */}
            <div className="relative w-[70%]">
              <input
                id="logradouro"
                defaultValue={data?.address?.rua ?? ""}
                {...register("logradouro", {
                  required: "Rua é obrigatória",
                })}
                className={`peer h-10 w-full border rounded-md px-3 py-5 text-sm focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] outline-none ${
                  errors.logradouro ? "border-red-400" : "border-gray-300"
                }`}
                placeholder=" "
              />
              <label
                htmlFor="logradouro"
                className={`select-none absolute bg-white p-[2px] left-3 transition-all 
                peer-placeholder-shown:top-[0.45rem] peer-placeholder-shown:text-base 
                peer-placeholder-shown:text-gray-400 top-[-0.8rem] text-sm 
                ${errors.logradouro ? "text-red-400" : "text-gray-300"} 
                peer-focus:text-[var(--primary)] peer-focus:top-[-0.8rem] peer-focus:text-sm`}
              >
                Rua / Avenida
              </label>
              {errors.logradouro && (
                <span className="text-red-400">
                  {errors.logradouro.message}
                </span>
              )}
            </div>

            {/* Número */}
            <div className="relative w-[30%]">
              <input
                id="numero"
                defaultValue={data?.address?.numero ?? ""}
                {...register("numero")}
                className={`peer h-10 w-full border rounded-md px-3 py-5 text-sm focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] outline-none ${
                  errors.numero ? "border-red-400" : "border-gray-300"
                }`}
                placeholder=" "
              />
              <label
                htmlFor="numero"
                className={`select-none absolute bg-white p-[2px] left-3 transition-all 
                peer-placeholder-shown:top-[0.45rem] peer-placeholder-shown:text-base 
                peer-placeholder-shown:text-gray-400 top-[-0.8rem] text-sm 
                ${errors.numero ? "text-red-400" : "text-gray-300"} 
                peer-focus:text-[var(--primary)] peer-focus:top-[-0.8rem] peer-focus:text-sm`}
              >
                Número
              </label>
              {errors.numero && (
                <span className="text-red-400">{errors.numero.message}</span>
              )}
            </div>
          </div>

          {/* Complemento */}
          <div className="relative">
            <input
              id="complemento"
              defaultValue={data?.address?.complemento ?? ""}
              {...register("complemento")}
              className="peer h-10 w-full border rounded-md px-3 py-5 text-sm focus:border-[var(--primary)] 
                 focus:ring-1 focus:ring-[var(--primary)] outline-none border-gray-300"
              placeholder=" "
            />
            <label
              htmlFor="complemento"
              className="select-none line-clamp-1 absolute bg-white p-[2px] left-3 transition-all 
                 peer-placeholder-shown:top-[0.45rem] peer-placeholder-shown:text-base 
                 peer-placeholder-shown:text-gray-400 top-[-0.8rem] text-sm text-gray-300 
                 peer-focus:text-[var(--primary)] peer-focus:top-[-0.8rem] peer-focus:text-sm"
            >
              Complemento/Referências Próx./Descrição do Prédio
            </label>
          </div>
        </div>

        <section className="mb-5 mt-4">
          {frete && (
            <>
              <hr className="border border-gray-300 my-4" />
              <h2 className="text-center text-2xl">Opções de Envio</h2>
              <div className="inline items-center gap-2 mt-2">
                <Image
                  width={100}
                  height={50}
                  src={frete[0].company.picture}
                  alt={frete[0].company.name}
                  className="my-2"
                />
              </div>
            </>
          )}
          {frete &&
            frete.map((info: any, index: number) => (
              <section key={index}>
                <label className="flex items-center w-full p-3 border border-gray-300 rounded-md mb-2 cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    value={index.toString()}
                    {...register("frete")}
                    className="mr-3"
                  />
                  <div className="flex-grow">
                    <h3 className="text-gray-500">
                      <FaMailBulk className="inline" /> {info.name}:
                      <span className="text-black ms-2">
                        R${info.price.toFixed(2)}
                      </span>
                      <FaTruckArrowRight className="ms-2 inline" /> Chegará em:{" "}
                      <span className="text-black">
                        {info.delivery_time} dias após o envio.
                      </span>
                    </h3>
                  </div>
                </label>
              </section>
            ))}
          {/* Exibir erro de validação do frete */}
          {errors.frete && (
            <span className="text-red-400 block text-center mt-2">
              {errors.frete.message}
            </span>
          )}
          {error && <p className="text-red-500 mt-2 text-center">{error}</p>}
        </section>

        <hr className="border border-gray-300 my-4" />

        <div className="flex justify-between">
          <div></div>
          <button
            type="submit"
            className="cursor-pointer p-2 rounded-md transition-colors border border-black text-black bg-white hover:text-white hover:bg-black"
          >
            Salvar & Avançar
          </button>
        </div>
      </form>
    </motion.div>
  );
}
