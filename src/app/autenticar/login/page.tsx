"use client";

import { Suspense, useEffect, useState } from "react";
import Main from "@/components/Main";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FaEye, FaEyeSlash, FaGoogle } from "react-icons/fa";
import Link from "next/link";
import { MdOutlineAccountCircle } from "react-icons/md";
import { handleGoogleSignIn } from "@/handlers/handleGoogleSignIn";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";

// Componente que utiliza useSearchParams()
function AutenticarContent() {
  const [showPass, setShowPass] = useState<boolean>(false);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const {data: session} = useSession();
  const router = useRouter();

  const createUserFormSchema = z.object({
    email: z
      .string()
      .email("E-mail inválido")
      .max(40, "E-mail muito longo"),
    password: z
      .string()
      .min(8, "Sua senha deve conter no mínimo 8 caracteres")
      .max(40),
  });

  type userFormData = z.infer<typeof createUserFormSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<userFormData>({ resolver: zodResolver(createUserFormSchema) });

  async function submitFunction(data: userFormData) {
    console.log(data);
  }

  useEffect(() => {
    if (session) router.push("/home");
  }, [session]);

  return (
    <Main noSpace>
      <section className="w-full flex justify-center items-center p-5">
        <form
          onSubmit={handleSubmit(submitFunction)}
          className="border-2 bg-white border-gray-300 p-6 rounded-md w-full md:max-w-[450px] shadow-xl"
        >
          <div className="flex items-center">
            <MdOutlineAccountCircle className="text-4xl me-2 text-[var(--primary)]" />
            <h1 className="inline-block text-2xl my-5 underline decoration-[var(--primary)]">
              Bem vindo(a) de volta
            </h1>
          </div>

          <div className="relative">
            <input
              id="email"
              {...register("email", { required: true })}
              className={`peer h-10 w-full border rounded-md px-3 py-5 text-sm focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] outline-none ${
                errors.email ? "border-red-400" : "border-gray-300"
              }`}
              placeholder=" "
            />
            <label
              htmlFor="email"
              className={`select-none absolute bg-white p-[2px] left-3 transition-all peer-placeholder-shown:top-[0.45rem] peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 top-[-0.8rem] text-sm ${
                errors.email ? "text-red-400" : "text-gray-300"
              } peer-focus:text-[var(--primary)] peer-focus:top-[-0.8rem] peer-focus:text-sm`}
            >
              E-mail
            </label>
            {errors.email && (
              <span className="text-red-400">{errors.email.message}</span>
            )}
          </div>

          <div className="relative py-5">
            <input
              id="password"
              type={showPass ? "text" : "password"}
              {...register("password", { required: true })}
              className={`peer h-10 w-full border rounded-md px-3 py-5 text-sm focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] outline-none ${
                errors.password ? "border-red-400" : "border-gray-300"
              }`}
              placeholder=" "
            />
            <div
              className={`absolute ${
                errors.password ? "top-[-20px]" : "top-0"
              } inset-y-0 right-0 pr-3 flex items-center text-lg text-gray-400 leading-5 cursor-pointer`}
              onClick={() => setShowPass(!showPass)}
            >
              {showPass ? <FaEyeSlash /> : <FaEye />}
            </div>
            <label
              htmlFor="password"
              className={`select-none absolute mt-5 bg-white p-[2px] left-3 transition-all peer-placeholder-shown:top-[0.45rem] peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 top-[-0.8rem] text-sm ${
                errors.password ? "text-red-400" : "text-gray-300"
              } peer-focus:text-[var(--primary)] peer-focus:top-[-0.8rem] peer-focus:text-sm`}
            >
              Senha
            </label>
            {errors.password && (
              <span className="text-red-400">{errors.password.message}</span>
            )}
          </div>

          <div className="flex justify-between items-center">
            <button
              type="submit"
              className="border-2 border-black text-black p-2 rounded-md transition-colors hover:bg-black hover:text-white duration-200 cursor-pointer"
            >
              Entrar
            </button>

            <Link
              href="/autenticar/registrar"
              prefetch={true}
              className="text-[var(--primary)] hover:underline"
            >
              Não tenho conta
            </Link>
          </div>

          <section className="flex flex-col gap-5 justify-center items-center mt-5">
            <div className="w-full relative flex justify-center items-center ">
              <hr className="w-full border border-gray-300" />
              <p className="mx-3 text-gray-300 absolute bg-white p-2">OU</p>
            </div>

            <button
              type="button"
              onClick={() => handleGoogleSignIn(callbackUrl)}
              className="flex items-center justify-center border-2 border-black text-black p-2 rounded-md transition-colors hover:bg-black hover:text-white duration-200 cursor-pointer w-full"
            >
              <FaGoogle className="text-2xl inline-block me-2" />
              <p>Entrar com Google</p>
            </button>
          </section>
        </form>
      </section>
    </Main>
  );
}

// Componente exportado com Suspense que engloba AutenticarContent
export default function Autenticar() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <AutenticarContent />
    </Suspense>
  );
}
