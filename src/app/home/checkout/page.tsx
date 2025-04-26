"use client";

import { AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { useState } from "react";
import AddressForm from "./components/AdressForm";
import CartContent from "./components/Cart";
import Billing from "./components/Billing";

export default function Checkout() {
  const { data: session } = useSession();

  // Estado para controlar a etapa: "cart" ou "address"
  const [step, setStep] = useState<"cart" | "address" | "billing" | "success">(
    "cart"
  );
  const [isOpen, setIsOpen] = useState(false);

  // Função para avançar para a etapa de endereço
  const advanceTo = (
    targetStep: "cart" | "address" | "billing" | "success"
  ) => {
    setStep(targetStep);
    window.scrollTo({ top: 0 });
  };

  return (
    <section className="flex flex-col items-center gap-4">
      
      <AnimatePresence mode="wait">
        {step === "cart" && (
          <CartContent
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            session={session}
            advanceTo={advanceTo}
          />
        )}

        {step === "address" && (
          <AddressForm session={session} advanceTo={advanceTo} />
        )}

        {step === "billing" && (
          <Billing session={session} />
        )}
      </AnimatePresence>
    </section>
  );
}
