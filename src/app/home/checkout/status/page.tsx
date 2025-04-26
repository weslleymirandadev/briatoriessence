"use client";

import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { FaCheck, FaTimes } from "react-icons/fa";

const PaymentStatus = () => {
  const searchParams = useSearchParams();
  const payment_id = searchParams.get("payment");
  const [paymentStatus, setPaymentStatus] = useState<any>();

  const router = useRouter();

  useEffect(() => {
    const getPaymentStatus = async () => {
      await axios
        .get(`/api/payments/${payment_id}/status`)
        .then((response) => setPaymentStatus(response.data.status));
    };

    getPaymentStatus();
  }, []);

  if (!paymentStatus) return <h1>Carregando...</h1>;

  sessionStorage.removeItem("pedidoPendente");

  return (
    <div className="container mx-auto p-4">
      {paymentStatus === "pago" ? (
        <div className="text-center flex flex-col justify-center items-center">
          <FaCheck className="text-9xl bg-green-300 p-5 rounded-full"/>

          <h2 className="text-xl font-semibold text-green-500">
            Pagamento realizado com sucesso!
          </h2>
          <p className="mt-2">Obrigado por sua compra!</p>
          <button onClick={() => router.push("/home")} className="text-white font-bold bg-black p-2 rounded-md cursor-pointer mt-5">Voltar à página inicial</button>
        </div>
      ) : (
        <div className="text-center flex flex-col justify-center items-center">
          <FaTimes className="text-9xl bg-red-300 p-5 rounded-full"/>

          <h2 className="text-xl font-semibold text-red-500">
            Problema ao verificar pagamento.
          </h2>
          <p className="mt-2">Tente novamente mais tarde</p>
          <button onClick={() => router.push("/home/checkout")} className="text-white font-bold bg-black p-2 rounded-md cursor-pointer mt-5">Voltar à página inicial</button>
        </div>
      )}
    </div>
  );
};

const SuccessPage = () => {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <PaymentStatus />
    </Suspense>
  );
};

export default SuccessPage;
