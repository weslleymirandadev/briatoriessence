"use client"; 

import { useRouter } from "next/navigation";

export default function Cancel() {
  const router = useRouter();

  return (
    <section className="w-full h-1/2 justify-center flex items-center">
      <div>
        <h1 className="text-2xl bg-[var(--primary)] p-2 rounded-md">Pedido cancelado.</h1>
        <button onClick={() => router.push("/home")} className="w-full my-4 bg-black text-white font-bold rounded-md p-2 cursor-pointer">
          Voltar
        </button>
      </div>
    </section>
  );
}
