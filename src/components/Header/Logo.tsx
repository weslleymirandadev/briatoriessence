"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

interface LogoProps {
  shrink: boolean;
  searchOpen: boolean;
}

const Logo: React.FC<LogoProps> = ({ shrink, searchOpen }) => (
  <div className="cursor-pointer">
    <Link href={"/home"} className={`flex items-center ${searchOpen ? "scale-0" : "scale-100"}`}>
      <Image
        quality={100}
        width={80}
        height={80}
        draggable={false}
        src="/logo.png"
        alt="logo perfumaria briatori essence"
        className={`transition-all h-auto md:w-[80px] ${
          shrink ? "max-w-[50px]" : "max-w-[60px]"
        }`}
      />
      <Image
        priority={true}
        quality={100}
        width={100}
        height={100}
        draggable={false}
        src="/logo1.png"
        alt="logo perfumaria briatori essence"
        className={`transition-all h-auto md:w-[150px] ${
          shrink ? "max-w-[80px]" : "max-w-[100px]"
        }`}
      />
    </Link>
  </div>
);

export default Logo;
