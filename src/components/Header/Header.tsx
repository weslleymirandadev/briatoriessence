"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import AnnouncementBanner from "./AnnouncementBanner";
import Logo from "./Logo";
import SearchBar from "./SearchBar";
import ProfileMenu from "./ProfileMenu";
import CartModal from "./CartModal";
import NavigationMenu from "./NavigationMenu";
import Skeleton from "react-loading-skeleton";
import { useCart } from "../contexts/CartContext";
import { useNotify } from "../contexts/NotifyContext";
import axios from "axios";

const menuItems = [
  { href: "/home#sobre", label: "Sobre" },
  { href: "/home/loja/femininos", label: "Femininos" },
  { href: "/home/loja/masculinos", label: "Masculinos" },
  { href: "/home/loja/decants", label: "Decants" },
  { href: "/home/loja/perfumes-arabes", label: "Árabes" },
  { href: "/home/loja/hidratantes", label: "Hidratantes" },
  { href: "/home/loja/victorias-secret", label: "Victoria's Secret" },
];

const allowedUrls = [
  "/home#sobre",
  "/home/loja/femininos",
  "/home/loja/masculinos",
  "/home/loja/decants",
  "/home/loja/perfumes-arabes",
  "/home/loja/hidratantes",
  "/home/loja/victorias-secret",
  "/home/dashboard/",
  "/home/minha-conta",
  "/autenticar/login",
];

export default function Header() {
  const { data: session, status } = useSession();
  const [shrink, setShrink] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const profileContainerRef = useRef<HTMLDivElement>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationContainerRef = useRef<HTMLDivElement>(null);
  const cartRef = useRef<HTMLDivElement>(null);
  const { cartItemCount, setCartItemCount } = useCart();
  const { notifyResponse, setNotifyResponse } = useNotify();

  // Fecha o carrinho ao clicar fora
  useEffect(() => {
    const handleClickOutsideCart = (event: MouseEvent) => {
      if (cartRef.current && !cartRef.current.contains(event.target as Node)) {
        setShowCart(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutsideCart);
    return () =>
      document.removeEventListener("mousedown", handleClickOutsideCart);
  }, [showCart]);

  useEffect(() => {
    const handleClickOutsideProfile = (event: MouseEvent) => {
      if (
        notificationContainerRef.current &&
        !notificationContainerRef.current.contains(event.target as Node)
      ) {
        setTimeout(() => setShowNotifications(false), 100);
      }
    };
    document.addEventListener("mousedown", handleClickOutsideProfile);
    return () =>
      document.removeEventListener("mousedown", handleClickOutsideProfile);
  }, [showNotifications]);

  useEffect(() => {
    const handleClickOutsideProfile = (event: MouseEvent) => {
      if (
        profileContainerRef.current &&
        !profileContainerRef.current.contains(event.target as Node)
      ) {
        setTimeout(() => setShowProfileSettings(false), 100);
      }
    };
    document.addEventListener("mousedown", handleClickOutsideProfile);
    return () =>
      document.removeEventListener("mousedown", handleClickOutsideProfile);
  }, [showProfileSettings]);

  // Altera o header conforme o scroll
  useEffect(() => {
    const handleScroll = () => {
      setShrink(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (showSearch) {
      searchInputRef.current?.focus();
    }
  }, [showSearch]);

  const fetchCartItemCount = async () => {
    if (session) {
      const response = await axios.get("/api/usuario/carrinho");
      const data = await response.data;
      if (data.status === "success" && data.data) {
        const itemCount = data.data.products.reduce(
          (acc: number, item: any) => acc + item.quantidade,
          0
        );
        setCartItemCount(itemCount);
      }
    }
  };

  const fetchNotifyItemCount = async () => {
    if (session) {
      const response = await axios.get("/api/usuario/notifications");
      const data = await response.data;
      if (data.status === "success" && data.data) {
        setNotifyResponse(data.data);
      }
    }
  };

  useEffect(() => {
    fetchCartItemCount();
    fetchNotifyItemCount();
  }, [session]);

  return (
    <header className="fixed w-full z-30">
      <section>
        <AnnouncementBanner shrink={shrink} />
        <div
          className={`transition-all select-none w-full bg-[var(--primary)] flex items-center justify-around border-b border-gray-400 ${
            shrink ? "max-h-16" : "max-h-24"
          }`}
        >
          <Logo shrink={shrink} searchOpen={searchOpen} />
          <SearchBar
            searchOpen={searchOpen}
            setSearchOpen={setSearchOpen}
            showSearch={showSearch}
            setShowSearch={setShowSearch}
            searchInputRef={searchInputRef}
          />
          <div>
            {status != "loading" ? (
              <ul
                className={`flex justify-around items-center transition-all ${
                  searchOpen ? "scale-0" : "scale-100"
                }`}
              >
                <li className="relative right-2">
                  <ProfileMenu
                    session={session}
                    showProfileSettings={showProfileSettings}
                    setShowProfileSettings={setShowProfileSettings}
                    profileContainerRef={profileContainerRef}
                    showNotifications={showNotifications}
                    setShowNotifications={setShowNotifications}
                    notificationContainerRef={notificationContainerRef}
                    setShowCart={setShowCart}
                    cartItemCount={cartItemCount}
                    notifyResponse={notifyResponse}
                  />
                </li>
              </ul>
            ) : (
              <div className="flex justify-around items-center gap-2">
                <Skeleton className="bg-[var(--primary)] text-[var(-- )] shadow-md rounded-md p-2 min-w-[3.3em] min-h-[3.3em] flex justify-center items-center" />
                <Skeleton className="bg-[var(--primary)] text-[var(-- )] shadow-md rounded-md p-2 min-w-[3.3em] min-h-[3.3em] flex justify-center items-center" />
                <Skeleton className="bg-[var(--primary)] text-[var(-- )] shadow-md rounded-md p-2 min-w-[3.3em] min-h-[3.3em] flex justify-center items-center" />
              </div>
            )}
          </div>
        </div>
      </section>
      <CartModal
        showCart={showCart}
        setShowCart={setShowCart}
        cartRef={cartRef}
        fetchCartItemCount={fetchCartItemCount}
      />
      <section className="border-b text-nowrap border-gray-400 shadow-md text-sx">
        <NavigationMenu menuItems={menuItems} allowedUrls={allowedUrls} />
      </section>
    </header>
  );
}
