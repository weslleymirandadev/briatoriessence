"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { GoGear, GoPersonAdd, GoBell } from "react-icons/go";
import { Session } from "next-auth";
import { signOut } from "next-auth/react";
import { IoCartOutline } from "react-icons/io5";
import axios from "axios";
import { FaCircleExclamation } from "react-icons/fa6";
import { useRouter } from "next/navigation";

interface ProfileMenuProps {
  session: Session | null;
  showProfileSettings: boolean;
  setShowProfileSettings: (show: boolean) => void;
  profileContainerRef: React.RefObject<HTMLDivElement | null>;
  showNotifications: boolean;
  setShowNotifications: (show: boolean) => void;
  notificationContainerRef: React.RefObject<HTMLDivElement | null>;
  setShowCart: (show: boolean) => void;
  cartItemCount: number;
  notifyResponse: any;
}

const ProfileMenu: React.FC<ProfileMenuProps> = ({
  session,
  showProfileSettings,
  setShowProfileSettings,
  profileContainerRef,
  showNotifications,
  setShowNotifications,
  notificationContainerRef,
  setShowCart,
  cartItemCount,
  notifyResponse,
}) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    if (notifyResponse) {
      setNotifications(notifyResponse);
      setUnreadCount(notifyResponse.filter((notif: any) => !notif.seen).length);
    }
  }, [notifyResponse]);

  const markAsRead = async (id: string) => {
    try {
      await axios.patch("/api/usuario/notifications", { notificationId: id });
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  if (session?.user?.role === "admin") {
    return (
      <div className="flex items-center space-x-2">
        {/* Notificações Admin */}
        <div className="relative" ref={notificationContainerRef}>
          <div
            className="cursor-pointer w-[3.3em] h-[3.3em] rounded-md shadow-md flex justify-center items-center"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <GoBell className="text-4xl" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 bg-black text-[var(--primary)] rounded-full w-5 h-5 flex items-center justify-center text-xs">
                {unreadCount}
              </span>
            )}
          </div>
          {showNotifications && (
            <div className="absolute top-full right-0 mt-2 w-64 bg-white shadow-md border border-gray-300 z-50 rounded-md">
              <ul className="max-h-[300px]">
                {notifications.length > 0 ? (
                  notifications.map((notif: any) => (
                    <li
                      key={notif.id}
                      className={`px-2 py-4 cursor-pointer flex justify-between ${
                        notif.seen ? "bg-gray-50" : "bg-white"
                      }`}
                      onClick={() => {
                        markAsRead(notif.id);
                        router.push(notif.href);
                      }}
                    >
                      <p className="flex items-center gap-2">
                        {!notif.seen && (
                          <FaCircleExclamation className="text-[var(--primary)]" />
                        )}{" "}
                        {notif.title}
                      </p>
                      <p className="text-gray-400">
                        {
                          new Date(notif.updatedAt)
                            .toLocaleDateString()
                            .split(",")[0]
                        }
                      </p>
                    </li>
                  ))
                ) : (
                  <li className="px-2 py-4 text-gray-500">
                    Não há notificações
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>

        {/* Dashboard Admin */}
        <Link
          href="/dashboard/"
          className="shadow-md rounded-md p-2 w-[3.3em] h-[3.3em] flex justify-center items-center transition-colors"
        >
          <GoGear className="text-4xl" />
        </Link>
      </div>
    );
  } else if (session?.user?.role === "user") {
    return (
      <div className="flex items-center space-x-2">
        {/* Perfil do Usuário */}
        <div className="relative">
          <div
            onClick={() => setShowProfileSettings(!showProfileSettings)}
            ref={profileContainerRef}
            className="cursor-pointer w-[3.3em] h-[3.3em] rounded-md shadow-md flex justify-center items-center transition-colors"
          >
            {session?.user?.image ? (
            <Image
              width={35}
              height={35}
              src={session?.user?.image}
              alt={session?.user?.name!}
              className="rounded-full border border-black shadow-md"
            />): (
              <div
              className="rounded-full flex items-center align-middle border border-black shadow-md w-[35px] h-[35px] bg-black"
              >
                <span className="m-auto text-2xl text-[var(--primary)]">{session?.user?.name?.split("")[0].toUpperCase()}</span>
              </div>
            )}
          </div>
          {showProfileSettings && (
            <ul className="absolute top-full right-0 mt-2 w-48 bg-white shadow-md border border-gray-300 z-50 rounded-md overflow-hidden">
              <li className="line-clamp-1 p-2 underline decoration-[var(--primary)] bg-gray-50">
                {session?.user?.name}
              </li>
              <li>
                <Link
                  href="/home/pedidos"
                  className="block w-full p-2 hover:bg-gray-100"
                >
                  Meus pedidos
                </Link>
              </li>
              <hr className="border border-gray-100" />
              <li>
                <button
                  onClick={() => {
                    signOut();
                    setShowProfileSettings(false);
                  }}
                  className="p-2 hover:bg-gray-100 text-red-500 cursor-pointer hover:underline w-full text-left"
                >
                  Sair da conta
                </button>
              </li>
            </ul>
          )}
        </div>

        {/* Notificações Usuário */}
        <div className="relative" ref={notificationContainerRef}>
          <div
            className="cursor-pointer w-[3.3em] h-[3.3em] rounded-md shadow-md flex justify-center items-center transition-colors"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <GoBell className="text-4xl" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 bg-black text-[var(--primary)] rounded-full w-5 h-5 flex items-center justify-center text-xs">
                {unreadCount}
              </span>
            )}
          </div>
          {showNotifications && (
            <div className="absolute top-full right-0 mt-2 w-64 bg-white shadow-md border border-gray-300 z-50 rounded-md">
              <ul className="max-h-[300px]">
                {notifications.length > 0 ? (
                  notifications.map((notif: any) => (
                    <li
                      key={notif.id}
                      className={`px-2 py-4 cursor-pointer flex justify-between ${
                        notif.seen ? "bg-gray-100" : "bg-gray-50"
                      }`}
                      onClick={() => {
                        markAsRead(notif.id);
                        router.push(notif.href);
                      }}
                    >
                      <p className="flex items-center gap-2">
                        {!notif.seen && (
                          <FaCircleExclamation className="text-[var(--primary)]" />
                        )}{" "}
                        {notif.title}
                      </p>
                      <p className="text-gray-400">
                        {
                          new Date(notif.updatedAt)
                            .toLocaleDateString()
                            .split(",")[0]
                        }
                      </p>
                    </li>
                  ))
                ) : (
                  <li className="px-2 py-4 text-gray-500">
                    Não há notificações
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>

        {/* Carrinho */}
        <div className="relative">
          <button
            onClick={() => setShowCart(true)}
            className="cursor-pointer shadow-md rounded-md p-2 w-[3.3em] h-[3.3em] flex justify-center items-center transition-colors"
          >
            <IoCartOutline className="text-4xl" />
            <span className="absolute top-0 right-0 bg-black text-[var(--primary)] rounded-full w-5 h-5 flex items-center justify-center text-xs">
              {cartItemCount}
            </span>
          </button>
        </div>
      </div>
    );
  } else {
    // Usuário não logado
    return (
      <Link
        href="/autenticar/login"
        className="shadow-md rounded-md p-2 w-[3.3em] h-[3.3em] flex justify-center items-center transition-colors"
      >
        <GoPersonAdd className="text-4xl" />
      </Link>
    );
  }
};

export default ProfileMenu;
