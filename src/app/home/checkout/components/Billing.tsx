import axios, { AxiosResponse } from "axios";
import { motion } from "framer-motion";
import { Session } from "next-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { FaCreditCard, FaHouseUser } from "react-icons/fa";
import { HiOutlineTicket } from "react-icons/hi2";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Parallax } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import { FaPix } from "react-icons/fa6";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

export default function Billing({ session }: { session: Session | null }) {
  const router = useRouter();
  const [pedido, setPedido] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeButton, setActiveButton] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [pix, setPix] = useState<any>(null);
  const [cartao, setCartao] = useState<any>(null);

  const cartaoSchema = z.object({
    nomeTitular: z.string().nonempty("Preencha este campo"),
    email: z.string().nonempty("Preencha este campo"),
    numeroCartao: z
      .string()
      .min(16, "Número do cartão deve ter 16 dígitos")
      .max(19, "Número do cartão deve ter 16 dígitos"),
    validade: z
      .string()
      .regex(/^\d{2}\/\d{2}$/, "Validade deve estar no formato MM/AA"),
    cvv: z
      .string()
      .min(3, "CVV deve ter 3 dígitos")
      .max(3, "CVV deve ter 3 dígitos"),
    tipoDocumento: z.enum(["CPF", "CNPJ"]), // Campo para escolher entre CPF e CNPJ
    cpf: z.string().refine((value) => {
      // Validação dinâmica para CPF ou CNPJ
      if (getValues("tipoDocumento") === "CPF") {
        return /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(value); // Formato CPF
      } else {
        return /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(value); // Formato CNPJ
      }
    }, "Documento inválido"),
    parcelas: z
      .number()
      .min(1, "O número de parcelas deve ser pelo menos 1")
      .max(12, "O número de parcelas não pode ser maior que 12"),
    issuer: z.string().nonempty("Selecione a bandeira do cartão"),
  });

  const pixSchema = z.object({
    cpfPix: z
      .string()
      .regex(
        /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
        "CPF deve estar no formato 123.456.789-00"
      ),
  });

  type BillingCardData = z.infer<typeof cartaoSchema>;
  type BillingPixData = z.infer<typeof pixSchema>;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    getValues,
    formState: { errors },
  } = useForm<BillingCardData>({
    resolver: zodResolver(cartaoSchema),
    defaultValues: {
      tipoDocumento: "CPF",
    },
  });

  const tipoDocumento = watch("tipoDocumento");
  const parcelas = watch("parcelas");

  const {
    register: register2,
    handleSubmit: handleSubmit2,
    formState: { errors: errors2 },
  } = useForm<BillingPixData>({
    resolver: zodResolver(pixSchema),
  });

  const notify = async (payment_id: number) => {
    const notificationResponse = await axios.post(
      "/api/usuario/notifications",
      {
        title: "Pedido Finalizado",
        email: session?.user?.email, // O email do usuário que fez o pedido
        href: `/home/pedidos/${payment_id}`, // Link para o detalhe do pedido
      }
    );

    if (notificationResponse.status !== 201) {
      console.error("Erro ao enviar notificação:", notificationResponse.data);
    }

    const notificationResponseAdmin = await axios.post(
      "/api/usuario/notifications",
      {
        title: "Pedido pendente",
        email: process.env.NEXT_PUBLIC_ADMIN_EMAIL1, // O email do usuário que fez o pedido
        href: `/dashboard/pedidos/${payment_id}`, // Link para o detalhe do pedido
      }
    );

    if (notificationResponseAdmin.status !== 201) {
      console.error("Erro ao enviar notificação:", notificationResponse.data);
    }
  };

  const usePaymentStatusChecker = (
    paymentData: any,
    router: any,
    notify: any
  ) => {
    useEffect(() => {
      if (!paymentData) return;

      const checkPaymentStatus = async () => {
        try {
          const response = await fetch(
            `/api/payments/${paymentData.payment_id}/status`
          );
          const data = await response.json();

          if (data.status === "pago") {
            if (setPix) setPix((prev: any) => ({ ...prev, status: "pago" }));
            if (setCartao)
              setCartao((prev: any) => ({ ...prev, status: "pago" }));
            clearInterval(interval);
            notify(paymentData.payment_id);
            router.push(
              `/home/checkout/status?payment=${paymentData.payment_id}`
            );
          }
        } catch (error) {
          console.error("Erro ao verificar status:", error);
          clearInterval(interval);
        }
      };

      const interval = setInterval(checkPaymentStatus, 5000);
      return () => clearInterval(interval);
    }, [paymentData?.payment_id]);
  };

  // Uso no componente:
  usePaymentStatusChecker(cartao, router, notify);
  usePaymentStatusChecker(pix, router, notify);

  useEffect(() => {
    const carregarDados = async () => {
      const dadosPedido = sessionStorage.getItem("pedidoPendente");
      if (!dadosPedido) {
        router.push("/home/checkout/erro");
        return;
      }
      setPedido(JSON.parse(dadosPedido));
      setLoading(false);
    };
    carregarDados();
  }, []);

  const processarPagamentoCartao = async (data: BillingCardData) => {
    try {
      setProcessing(true);

      // @ts-ignore
      const mp = new MercadoPago(
        process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY!
      );

      const token = await mp.createCardToken({
        cardholderName: data.nomeTitular,
        cardNumber: data.numeroCartao.replace(/\s+/g, ""),
        securityCode: data.cvv,
        identificationType: data.tipoDocumento,
        identificationNumber: data.cpf.replace(/\D/g, ""),
        cardExpirationMonth: data.validade.split("/")[0],
        cardExpirationYear: `20${data.validade.split("/")[1]}`,
      });

      const bin = data.numeroCartao.replace(/\s+/g, "").substring(0, 6);

      const { results } = await mp.getPaymentMethods({ bin });
      const paymentMethod = results[0];
      const { additional_info_needed, issuer, id } = paymentMethod;
      let issuerOptions = [issuer];

      if (additional_info_needed.includes("issuer_id")) {
        const issuersResponse = await mp.getIssuers({
          paymentMethodId: id,
          bin,
        });
        issuerOptions = issuersResponse.map((issuer: any) => ({
          ...issuer,
          default: false,
        }));
      }

      const amount = Number(parseFloat(pedido.total).toFixed(2));

      await axios
        .post("/api/mercado-pago/create-checkout", {
          userid: session?.user.id,
          pedido: pedido,
          parcelas: data.parcelas,
          total: amount,
          metodo: id,
          token: token.id,
          issuer_id: issuerOptions[0].id,
          payer: {
            email: data.email,
            cpf: data.cpf.replace(/\D/g, ""),
          },
          // @ts-ignore
          device_id: MP_DEVICE_SESSION_ID,
        })
        .then(async (response) => {
          await finalizarPedido("cartao", response.data);
        })
        .catch((error) => {
          console.error(error);
          alert("Erro ao processar pagamento!");
        })
        .finally(() => {
          setProcessing(false);
        });
    } catch (error) {
      console.error("Erro no pagamento com cartão:", error);
      alert("Erro ao processar pagamento!");
    } finally {
      setProcessing(false);
    }
  };

  const processarPagamentoPix = async (data: BillingPixData) => {
    setProcessing(true);
    try {
      const response = await axios.post("/api/mercado-pago/create-checkout", {
        userId: session?.user.id,
        pedido: pedido,
        parcelas: 1,
        total: Number((pedido.total - (pedido.total * 5) / 100).toFixed(2)),
        metodo: "pix",
        payer: {
          email: session?.user?.email,
          cpf: data.cpfPix,
        },
      });

      await finalizarPedido("pix", await response.data);
    } catch (error) {
      console.error("Erro no pagamento PIX:", error);
      alert("Erro ao gerar PIX!");
    } finally {
      setProcessing(false);
    }
  };

  const finalizarPedido = async (meioPagamento: string, response: any) => {
    try {
      for (const produto of pedido.produtos) {
        await axios.delete("/api/usuario/carrinho", {
          data: { produtoId: produto.productID },
        });
      }

      switch (meioPagamento) {
        case "cartao":
          setCartao(response);
          break;
        case "pix":
          setPix(response);
          break;
      }
    } catch (error) {
      console.error("Erro ao finalizar pedido:", error);
      throw error;
    }
  };

  const cancelarPedido = () => {
    sessionStorage.removeItem("pedidoPendente");
    router.push("/home/checkout/cancel");
  };

  const show = (meioPagamento: string) => setActiveButton(meioPagamento);

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

  const cnpjMask = (v: string): string => {
    v = v.replace(/\D/g, "");
    v = v.replace(/(\d{2})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d)/, "$1/$2");
    v = v.replace(/(\d{4})(\d{1,2})$/, "$1-$2");
    return v;
  };

  const mascaraCartao = (event: any) => {
    let input = event.target;
    input.value = cardMask(input.value);
  };

  const cardMask = (v: string) => {
    v = v.replace(/\D/g, "");
    return v.match(/\d{1,4}/g)?.join(" ") === undefined
      ? ""
      : v.match(/\d{1,4}/g)?.join(" ");
  };

  const validadeMask = (v: string): string => {
    v = v.replace(/\D/g, "");
    v = v.replace(/(\d{2})(\d{1,2})$/, "$1/$2");
    return v;
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
    }
  };

  if (loading || !pedido)
    return <div className="text-center p-8">Carregando...</div>;

  return (
    <motion.div
      key="cart"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="w-full md:max-w-[550px] bg-white border border-gray-300 rounded-md p-4 mt-8"
    >
      <h2 className="text-2xl font-bold mb-6">Finalizar Pedido</h2>

      <button onClick={() => notify(123456)}>Notificar</button>

      {/* Resumo do Pedido */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Resumo do Pedido</h3>
        {pedido.produtos.map((produto: any, index: number) => (
          <div key={index} className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
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
                  className="max-w-[50px]"
                >
                  {produto.produto.imagens.map(
                    (image: string, index: number) => (
                      <SwiperSlide key={index}>
                        <div className="relative w-[50px] h-[50px]">
                          <Image
                            draggable={false}
                            src={image}
                            quality={100}
                            alt={produto.produto.nome}
                            layout="fill"
                            objectFit="cover"
                            loading="lazy"
                            className="select-none rounded-md"
                          />
                        </div>
                      </SwiperSlide>
                    )
                  )}
                </Swiper>
              </div>
              <div>
                <p className="font-medium">{produto.produto.nome}</p>
                <p className="text-sm text-gray-500">
                  Quantidade: {produto.quantidade}
                </p>
              </div>
            </div>
            <p className="font-medium">
              R${" "}
              {produto.produto.precoDes > 0
                ? (produto.produto.precoDes * produto.quantidade).toFixed(2)
                : (produto.produto.precoOrg * produto.quantidade).toFixed(2)}
            </p>
          </div>
        ))}
      </div>

      {/* Endereço de Entrega */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Endereço de Entrega</h3>
        <div className="space-y-2">
          <p className="flex items-center">
            <FaHouseUser className="inline text-[var(--primary)] text-2xl me-2" />
            {pedido.endereco.logradouro}, {pedido.endereco.numero},{" "}
            {pedido.endereco.complemento}, {pedido.endereco.bairro},{" "}
            {pedido.endereco.cep}, {pedido.endereco.estado_cidade}
          </p>
        </div>
      </div>

      <hr className="border border-gray-300 my-6" />

      {/* Total e Botão de Pagamento */}
      <div className="pt-4">
        <div className="flex justify-between mb-2">
          <span>Subtotal:</span>
          <span>R$ {(pedido.total - pedido.frete).toFixed(2)}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span>Frete ({pedido.tipoFrete}):</span>
          <span>R$ {pedido.frete.toFixed(2)}</span>
        </div>
        <section className="flex justify-between font-bold text-lg">
          <span>Total:</span>
          <div>
            <p className="text-black text-lg md:text-xl mt-2 inline-flex items-center">
              <span className="bg-[var(--primary)] rounded-md p-1">
                R$
                {(pedido.total - (pedido.total * 5) / 100)
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
                R${pedido.total.toFixed(2).toString().replace(".", ",")}
              </span>{" "}
              no cartão
            </p>
          </div>
        </section>

        <hr className="border border-gray-300 my-6" />

        <section>
          <div className="w-full flex items-center">
            <div className="font-bold mt-4">
              <h2 className="text-2xl font-bold mb-6">Método de Pagamento</h2>
              <p className="font-normal">Escolha um dentre os métodos abaixo</p>
              <div className="flex gap-2">
                <button
                  onClick={() => show("cartao")}
                  className={`flex items-center cursor-pointer transition-all hover:scale-110 duration-200 shadow-md p-2 rounded-md ${
                    activeButton === "cartao"
                      ? "bg-[var(--primary)]"
                      : "bg-white"
                  }`}
                >
                  <FaCreditCard className="me-2" /> Cartão
                </button>
                <button
                  onClick={() => show("pix")}
                  className={`flex items-center cursor-pointer transition-all hover:scale-110 duration-200 shadow-md p-2 rounded-md ${
                    activeButton === "pix" ? "bg-[var(--primary)]" : "bg-white"
                  }`}
                >
                  <FaPix className="me-2" /> Pix
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Seções de Pagamento */}
        {activeButton === "cartao" && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold">
              Pagamento com Cartão de Crédito ou Débito
            </h3>
            <p className="text-gray-400 my-4">
              Seus dados bancários não serão armazenados.
            </p>
            <form
              id="form-checkout"
              onSubmit={handleSubmit(processarPagamentoCartao)}
              className="space-y-4"
            >
              {/* Número do Cartão */}
              <select
                id="form-checkout__issuer"
                {...register("issuer")}
                defaultValue={"master"}
                className="hidden"
              >
                <option value="master">Mastercard</option>
                <option value="visa">Visa</option>
                <option value="amex">American Express</option>
                <option value="diners">Diners Club</option>
                <option value="discover">Discover</option>
              </select>

              <input type="hidden" id="deviceId" />

              <div className="relative w-full" id="form-checkout__cardNumber">
                <input
                  type="text"
                  minLength={19}
                  maxLength={19}
                  onKeyDown={handleKeyDown}
                  {...register("numeroCartao", {
                    onChange: (e) => mascaraCartao(e),
                  })}
                  className={`peer h-10 w-full border rounded-md px-3 py-5 text-sm focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] outline-none ${
                    errors.numeroCartao ? "border-red-400" : "border-gray-300"
                  }`}
                  placeholder=" "
                />
                <label
                  htmlFor="numeroCartao"
                  className={`select-none pointer-events-none line-clamp-1 absolute bg-white p-[2px] left-3 transition-all 
                        peer-placeholder-shown:top-[0.45rem] peer-placeholder-shown:text-base 
                        peer-placeholder-shown:text-gray-400 top-[-0.8rem] text-sm 
                        ${
                          errors.numeroCartao ? "text-red-400" : "text-gray-300"
                        } 
                        peer-focus:text-[var(--primary)] peer-focus:top-[-0.8rem] peer-focus:text-sm`}
                >
                  Número do Cartão
                </label>
                {errors.numeroCartao && (
                  <span className="text-red-400">
                    {errors.numeroCartao.message}
                  </span>
                )}
              </div>

              <div className="flex gap-4">
                {/* Validade */}

                <div
                  className="relative w-full"
                  id="form-checkout__expirationDate"
                >
                  <input
                    type="text"
                    minLength={5}
                    maxLength={5}
                    onKeyDown={handleKeyDown}
                    {...register("validade", {
                      onChange: (e) => {
                        const value = validadeMask(e.target.value);
                        setValue("validade", value);
                      },
                    })}
                    className={`peer h-10 w-full border rounded-md px-3 py-5 text-sm focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] outline-none ${
                      errors.validade ? "border-red-400" : "border-gray-300"
                    }`}
                    placeholder=" "
                  />
                  <label
                    htmlFor="validade"
                    className={`select-none pointer-events-none line-clamp-1 absolute bg-white p-[2px] left-3 transition-all 
                        peer-placeholder-shown:top-[0.45rem] peer-placeholder-shown:text-base 
                        peer-placeholder-shown:text-gray-400 top-[-0.8rem] text-sm 
                        ${errors.validade ? "text-red-400" : "text-gray-300"} 
                        peer-focus:text-[var(--primary)] peer-focus:top-[-0.8rem] peer-focus:text-sm`}
                  >
                    Validade (MM/AA)
                  </label>
                  {errors.validade && (
                    <span className="text-red-400">
                      {errors.validade.message}
                    </span>
                  )}
                </div>

                {/* CVV */}
                <div
                  className="relative w-full"
                  id="form-checkout__securityCode"
                >
                  <input
                    type="text"
                    maxLength={3}
                    minLength={3}
                    onKeyDown={handleKeyDown}
                    {...register("cvv", {
                      maxLength: 3,
                      minLength: 3,
                    })}
                    className={`peer h-10 w-full border rounded-md px-3 py-5 text-sm focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] outline-none ${
                      "cvv" in errors ? "border-red-400" : "border-gray-300"
                    }`}
                    placeholder=" "
                  />
                  <label
                    htmlFor="cvv"
                    className={`select-none pointer-events-none line-clamp-1 absolute bg-white p-[2px] left-3 transition-all 
                    peer-placeholder-shown:top-[0.45rem] peer-placeholder-shown:text-base 
                    peer-placeholder-shown:text-gray-400 top-[-0.8rem] text-sm 
                    ${errors.cvv ? "text-red-400" : "text-gray-300"} 
                    peer-focus:text-[var(--primary)] peer-focus:top-[-0.8rem] peer-focus:text-sm`}
                  >
                    Código de segurança (CVV)
                  </label>
                  {errors.cvv && (
                    <span className="text-red-400">{errors.cvv.message}</span>
                  )}
                </div>
              </div>

              {/* Nome do Titular */}
              <div className="relative w-full">
                <input
                  id="form-checkout__cardholderName"
                  type="text"
                  onKeyDown={handleKeyDown}
                  {...register("nomeTitular", {
                    onChange: (e) => {
                      const value = e.target.value.toUpperCase();
                      setValue("nomeTitular", value); // Atualiza o valor do campo no formulário
                    },
                  })}
                  className={`peer h-10 w-full border rounded-md px-3 py-5 text-sm focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] outline-none ${
                    errors.nomeTitular ? "border-red-400" : "border-gray-300"
                  }`}
                  placeholder=" "
                />
                <label
                  htmlFor="nomeTitular"
                  className={`select-none pointer-events-none line-clamp-1 absolute bg-white p-[2px] left-3 transition-all 
                        peer-placeholder-shown:top-[0.45rem] peer-placeholder-shown:text-base 
                        peer-placeholder-shown:text-gray-400 top-[-0.8rem] text-sm 
                        ${
                          errors.nomeTitular ? "text-red-400" : "text-gray-300"
                        } 
                        peer-focus:text-[var(--primary)] peer-focus:top-[-0.8rem] peer-focus:text-sm`}
                >
                  Nome do Titular (Como está no cartão)
                </label>
                {errors.nomeTitular && (
                  <span className="text-red-400">
                    {errors.nomeTitular.message}
                  </span>
                )}
              </div>

              {/* Tipo de Documento e Número */}
              <div className="flex gap-4">
                {/* Dropdown para escolher entre CPF e CNPJ */}
                <div className="relative w-1/3">
                  <select
                    id="form-checkout__identificationType"
                    defaultValue="CPF"
                    onKeyDown={handleKeyDown}
                    {...register("tipoDocumento", {
                      onChange: (e) => {
                        const value = e.target.value;
                        if (value === "CPF") {
                          setValue("cpf", cpfMask(getValues("cpf")));
                        } else {
                          setValue("cpf", cnpjMask(getValues("cpf")));
                        }
                      },
                    })}
                    className={`peer h-10 w-full border rounded-md px-3 py-5 text-sm focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] outline-none ${
                      errors.tipoDocumento
                        ? "border-red-400"
                        : "border-gray-300"
                    }`}
                  >
                    <option value="CPF">CPF</option>
                    <option value="CNPJ">CNPJ</option>
                  </select>

                  <div className="absolute cursor-default pointer-events-none top-1/2 transform -translate-y-1/2 left-3">
                    <p>{tipoDocumento}</p>
                  </div>

                  <label
                    htmlFor="tipoDocumento"
                    className={`select-none pointer-events-none line-clamp-1 absolute bg-white p-[2px] left-3 transition-all 
                      peer-placeholder-shown:top-[0.45rem] peer-placeholder-shown:text-base 
                      peer-placeholder-shown:text-gray-400 top-[-0.8rem] text-sm 
                      ${
                        errors.tipoDocumento ? "text-red-400" : "text-gray-300"
                      } 
                      peer-focus:text-[var(--primary)] peer-focus:top-[-0.8rem] peer-focus:text-sm`}
                  >
                    Tipo de Documento
                  </label>
                  {errors.tipoDocumento && (
                    <span className="text-red-400">
                      {errors.tipoDocumento.message}
                    </span>
                  )}
                </div>

                {/* Input para o número do documento (CPF ou CNPJ) */}
                <div className="relative w-2/3">
                  <input
                    type="text"
                    id="form-checkout__identificationNumber"
                    onKeyDown={handleKeyDown}
                    {...register("cpf", {
                      onChange: (e) => {
                        const value = e.target.value;
                        // Aplica a máscara dinamicamente com base no tipo de documento
                        if (getValues("tipoDocumento") === "CPF") {
                          setValue("cpf", cpfMask(value));
                        } else {
                          setValue("cpf", cnpjMask(value));
                        }
                      },
                    })}
                    className={`peer h-10 w-full border rounded-md px-3 py-5 text-sm focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] outline-none ${
                      errors.cpf ? "border-red-400" : "border-gray-300"
                    }`}
                    placeholder=" "
                  />
                  <label
                    htmlFor="cpf"
                    className={`select-none pointer-events-none line-clamp-1 absolute bg-white p-[2px] left-3 transition-all 
                      peer-placeholder-shown:top-[0.45rem] peer-placeholder-shown:text-base 
                      peer-placeholder-shown:text-gray-400 top-[-0.8rem] text-sm 
                      ${errors.cpf ? "text-red-400" : "text-gray-300"} 
                      peer-focus:text-[var(--primary)] peer-focus:top-[-0.8rem] peer-focus:text-sm`}
                  >
                    {tipoDocumento === "CPF" ? "CPF" : "CNPJ"}
                  </label>
                  {errors.cpf && (
                    <span className="text-red-400">{errors.cpf.message}</span>
                  )}
                </div>
              </div>

              {/* Número do Cartão */}
              <div className="relative w-full">
                <input
                  id="form-checkout__cardholderEmail"
                  type="text"
                  onKeyDown={handleKeyDown}
                  {...register("email")}
                  className={`peer h-10 w-full border rounded-md px-3 py-5 text-sm focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] outline-none ${
                    errors.email ? "border-red-400" : "border-gray-300"
                  }`}
                  placeholder=" "
                />
                <label
                  htmlFor="email"
                  className={`select-none pointer-events-none line-clamp-1 absolute bg-white p-[2px] left-3 transition-all 
                        peer-placeholder-shown:top-[0.45rem] peer-placeholder-shown:text-base 
                        peer-placeholder-shown:text-gray-400 top-[-0.8rem] text-sm 
                        ${errors.email ? "text-red-400" : "text-gray-300"} 
                        peer-focus:text-[var(--primary)] peer-focus:top-[-0.8rem] peer-focus:text-sm`}
                >
                  E-mail
                </label>
                {errors.email && (
                  <span className="text-red-400">{errors.email.message}</span>
                )}
              </div>

              {/* Número de Parcelas */}
              <div className="relative w-full">
                <select
                  id="form-checkout__installments"
                  onKeyDown={handleKeyDown}
                  {...register("parcelas", { valueAsNumber: true })}
                  className={`peer h-10 w-full border rounded-md px-3 py-5 text-sm focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] outline-none ${
                    errors.parcelas ? "border-red-400" : "border-gray-300"
                  }`}
                >
                  <option value="Selecionar">Selecionar</option>
                  {Array.from({ length: 5 }, (_, i) => {
                    if (Number((pedido.total / (i + 1)).toFixed(2)) > 5) {
                      return (
                        <option
                          key={i + 1}
                          value={i + 1}
                          className="flex justify-between"
                        >
                          {i + 1}x de R${(pedido.total / (i + 1)).toFixed(2)}
                        </option>
                      );
                    }
                  })}
                </select>
                <div className="absolute cursor-default pointer-events-none top-1/2 transform -translate-y-1/2 left-3">
                  <p>
                    {parcelas
                      ? `${Number(parcelas)}x de R\$${(
                          pedido.total / Number(parcelas)
                        ).toFixed(2)}`
                      : "Selecionar"}
                  </p>
                </div>
                <label
                  htmlFor="parcelas"
                  className={`select-none pointer-events-none line-clamp-1 absolute bg-white p-[2px] left-3 transition-all 
                peer-placeholder-shown:top-[0.45rem] peer-placeholder-shown:text-base 
                peer-placeholder-shown:text-gray-400 top-[-0.8rem] text-sm 
                ${errors.parcelas ? "text-red-400" : "text-gray-300"} 
                peer-focus:text-[var(--primary)] peer-focus:top-[-0.8rem] peer-focus:text-sm`}
                >
                  Número de Parcelas
                </label>
                {errors.parcelas && (
                  <span className="text-red-400">
                    {errors.parcelas.message}
                  </span>
                )}
              </div>

              {cartao && (
                <section className="flex flex-col items-center justify-center gap-5">
                  <h2 className="text-2xl mt-5 font-bold">
                    Status do pagamento:{" "}
                    <span className="bg-[var(--primary)] p-2 rounded-md">
                      {cartao.status}
                    </span>
                  </h2>
                </section>
              )}

              <section className="flex gap-4 mt-6">
                <button
                  onClick={cancelarPedido}
                  className="w-[30%] bg-white border border-red-500 hover:text-white font-bold cursor-pointer text-red-500 py-3 rounded-md hover:bg-red-500 transition-colors"
                  type="button" // Adicione isso para evitar submissão acidental
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="w-[70%] bg-[var(--primary)] text-black font-bold py-3 rounded-md hover:scale-110 cursor-pointer transition-all duration-200 shadow-md hover:shadow-xl disabled:opacity-50"
                >
                  {processing ? "Processando..." : "Finalizar pedido"}
                </button>
              </section>
            </form>
          </div>
        )}

        {activeButton === "pix" && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">Pagamento com PIX</h3>
            <form className="space-y-4">
              {/* CPF */}
              <div className="relative w-full">
                <input
                  id="cpfPix"
                  type="text"
                  onKeyDown={handleKeyDown}
                  {...register2("cpfPix", { onChange: (e) => mascaraCpf(e) })}
                  className={`peer h-10 w-full border rounded-md px-3 py-5 text-sm focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] outline-none ${
                    errors2.cpfPix ? "border-red-400" : "border-gray-300"
                  }`}
                  placeholder=" "
                />
                <label
                  htmlFor="cpfPix"
                  className={`select-none pointer-events-none line-clamp-1 absolute bg-white p-[2px] left-3 transition-all 
                        peer-placeholder-shown:top-[0.45rem] peer-placeholder-shown:text-base 
                        peer-placeholder-shown:text-gray-400 top-[-0.8rem] text-sm 
                        ${errors2.cpfPix ? "text-red-400" : "text-gray-300"} 
                        peer-focus:text-[var(--primary)] peer-focus:top-[-0.8rem] peer-focus:text-sm`}
                >
                  CPF
                </label>
                {errors2.cpfPix && (
                  <span className="text-red-400">{errors2.cpfPix.message}</span>
                )}
              </div>
            </form>
          </div>
        )}

        {pix && (
          <section className="flex flex-col items-center justify-center gap-5">
            <h2 className="text-2xl mt-5 font-bold">
              Status do pagamento:{" "}
              <span className="bg-[var(--primary)] p-2 rounded-md">
                {pix.status}
              </span>
            </h2>

            <Image
              width={300}
              height={300}
              src={`data:image/png;base64,${pix.qr_code_base64}`}
              alt={pix.payment_id}
            />
            <input
              id="pix"
              type="text"
              className="p-2 border border-gray-300 rounded-md w-full"
              value={pix.qr_code}
              disabled
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(pix.qr_code);
              }}
              className="cursor-pointer bg-black text-white rounded-md font-bold p-2"
            >
              Copiar
            </button>
          </section>
        )}

        <section className="flex gap-4">
          {activeButton != "cartao" && (
            <button
              onClick={cancelarPedido}
              className="w-[30%] mt-6 bg-white border border-red-500 hover:text-white font-bold cursor-pointer text-red-500 py-3 rounded-md hover:bg-red-500 transition-colors"
            >
              Cancelar
            </button>
          )}

          {activeButton === "pix" && (
            <button
              onClick={handleSubmit2(processarPagamentoPix)}
              disabled={processing}
              className="w-[70%] mt-6 bg-[var(--primary)] text-black font-bold py-3 rounded-md hover:scale-110 cursor-pointer transition-all duration-200 shadow-md hover:shadow-xl disabled:opacity-50"
            >
              {processing ? "Gerando PIX..." : "Gerar Código PIX"}
            </button>
          )}
        </section>
      </div>
    </motion.div>
  );
}
