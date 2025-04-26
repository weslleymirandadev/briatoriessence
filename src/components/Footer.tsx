"use client";

import Image from "next/image";
import Link from "next/link";
import { FaInstagram } from "react-icons/fa";
import { FaWhatsapp } from "react-icons/fa6";
import { MdOutlineEmail, MdOutlineLocalPhone } from "react-icons/md";

export default function Footer() {
  return (
    <footer className="bg-[var(--primary)] flex flex-col justify-center items-center border-t-2 border-[var(--primary)]">
      <div className="p-4 md:p-6 w-full bg-black"></div>
      <div>
        <Image
          width={150}
          height={150}
          draggable={false}
          src="/logo.png"
          alt="logo briatori essence"
          className="select-none"
        />
      </div>
      <section className="flex flex-col md:flex-row p-2 justify-start md:gap-0 gap-10 md:justify-around w-full">
        <div className="md:max-w-[300px]">
          <h3 className="font-bold text-2xl mb-4">BRIATORI ESSENCE</h3>
          <p>
            Nosso objetivo é proporcionar boas experiências olfativas, ajudando
            você a encontrar a essência que mais combina com seu estilo
          </p>
        </div>
        <div>
          <h3 className="font-bold text-2xl mb-4">CATEGORIAS</h3>
          <ul className="flex flex-col gap-4">
            <li>
              <Link href="/home/loja/femininos" className="hover:underline">
                Femininos
              </Link>
            </li>
            <li>
              <Link href="/home/loja/masculinos" className="hover:underline">
                Masculinos
              </Link>
            </li>
            <li>
              <Link href="/home/loja/decants" className="hover:underline">
                Decants
              </Link>
            </li>
            <li>
              <Link
                href="/home/loja/perfumes-árabes"
                className="hover:underline"
              >
                Árabes
              </Link>
            </li>
            <li>
              <Link href="/home/loja/hidratantes" className="hover:underline">
                Hidratantes
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-bold text-2xl mb-4">CONTATO</h3>
          <ul className="flex flex-col gap-4">
            <li>
              <Link target="_blank" href="https://wa.me/5543988632006" className="flex items-center hover:underline">
                <FaWhatsapp className="text-xl me-2"/> +55 (43) 98863-2006
              </Link>
            </li>
            <li>
              <Link target="_blank" href="https://www.instagram.com/briatoriessence" className="flex items-center hover:underline">
                <FaInstagram className="text-xl me-2"/> @briatoriessence
              </Link>
            </li>
            <li>
              <Link target="_blank" href="mailto:briatoriessencesuporte@gmail.com" className="flex items-center hover:underline">
                <MdOutlineEmail className="text-xl me-2"/> briatoriessencesuporte@gmail.com
              </Link>
            </li>
            <li>
              <Link target="_blank" href="tel:(43)98863-2006" className="flex items-center hover:underline">
                <MdOutlineLocalPhone className="text-2xl me-2"/> (43) 98863-2006
              </Link>
            </li>
          </ul>
        </div>
      </section>
      <hr className="border border-black w-[90%] my-16" />
      <h1 className="mb-16 text-xl text-center">&copy;{new Date().getFullYear()} Briatori Essence - Todos os direitos reservados.</h1>
    </footer>
  );
}
