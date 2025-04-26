"use client";

import React, { useEffect, useState, Suspense, useRef } from "react";
import { motion } from "framer-motion";
import { CiSearch } from "react-icons/ci";
import { useSearchParams, useRouter } from "next/navigation";
import axios from "axios";
import Link from "next/link";
import { MdOutlineKeyboardArrowRight } from "react-icons/md";
import { GoSearch } from "react-icons/go";

interface SearchBarProps {
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  showSearch: boolean;
  setShowSearch: (show: boolean) => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
}

function SearchBarContent({
  searchOpen,
  setSearchOpen,
  showSearch,
  setShowSearch,
  searchInputRef,
}: SearchBarProps) {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";
  const [search, setSearch] = useState<string>(initialSearch);
  const [results, setResults] = useState<Produto[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const resultsRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  interface Produto {
    id: number;
    nome: string;
    precoOrg: number;
    precoDes: number;
    descricao: string;
    imagens: string[];
    tags: string;
  }

  const handleSearchMobile = () => {
    setSearchOpen(!searchOpen);
    setShowSearch(!showSearch);
    if (searchInputRef.current && searchInputRef.current.value.trim()) {
      router.push(
        `/home/loja?search=${encodeURIComponent(
          searchInputRef.current.value.trim()
        )}`
      );
    }
  };

  const handleSearch = () => {
    if (search.trim()) {
      router.push(`/home/loja?search=${encodeURIComponent(search.trim())}`);
    }
  };

  const fetchSearchResults = async (query: string) => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/produtos`);
      const produtos = response.data.data;

      const filtered = produtos
        .filter((p: Produto) =>
          p.tags.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, 5);
      setResults(filtered);
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
    }
    setLoading(false);
  };

  // Debounce para chamadas de pesquisa
  useEffect(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    if (search.trim()) {
      debounceTimeout.current = setTimeout(() => {
        fetchSearchResults(search.trim());
      }, 300);
    } else {
      setResults([]);
    }
  }, [search]);

  // Lida com a tecla Enter
  useEffect(() => {
    const handleEnterKey = (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        if (searchInputRef.current && searchInputRef.current.value.trim()) {
          router.push(
            `/home/loja?search=${encodeURIComponent(
              searchInputRef.current.value.trim()
            )}`
          );
        } else if (search.trim()) {
          router.push(`/home/loja?search=${encodeURIComponent(search.trim())}`);
        }
      }
    };

    const mobileInput = document.getElementById("input-mobile");
    const desktopInput = document.getElementById("input-desktop");

    mobileInput?.addEventListener("keydown", handleEnterKey);
    desktopInput?.addEventListener("keydown", handleEnterKey);

    return () => {
      mobileInput?.removeEventListener("keydown", handleEnterKey);
      desktopInput?.removeEventListener("keydown", handleEnterKey);
    };
  }, [search, searchInputRef, router]);

  // Detecta clique fora do input e dos resultados para ocultá-los
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        resultsRef.current &&
        !resultsRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setIsFocused(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [resultsRef, searchInputRef]);

  return (
    <div
      className={`flex items-center ${
        searchOpen ? "absolute" : "relative left-2"
      }`}
    >
      {searchOpen ? (
        <motion.input
          id="input-mobile"
          type="search"
          value={search}
          autoComplete="off"
          ref={searchInputRef}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() =>
            setTimeout(() => {
              setIsFocused(false);
            }, 200)
          }
          placeholder="Pesquisar..."
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: searchOpen ? 300 : 0, opacity: searchOpen ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white outline-none h-[3rem] border-gray-400 rounded-md px-4 py-1 text-xl"
        />
      ) : (
        <input
          id="input-desktop"
          type="search"
          autoComplete="off"
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() =>
            setTimeout(() => {
              setIsFocused(false);
            }, 200)
          }
          value={search}
          placeholder="Pesquisar..."
          className="w-full bg-white outline-none h-[3rem] hidden md:block border-gray-400 rounded-md shadow-md px-4 py-1 text-xl"
        />
      )}
      <GoSearch
        id="mobile"
        className="p-1 text-4xl md:hidden block w-[3.4rem] h-[3.4rem] cursor-pointer rounded-md shadow-md ms-2"
        onClick={handleSearchMobile}
      />
      <GoSearch
        onClick={handleSearch}
        className="p-1 text-4xl w-[3.4rem] h-[3.3rem] hidden md:block cursor-pointer rounded-md shadow-md ms-2"
      />
      {isFocused && results.length > 0 && (
        <div
          ref={resultsRef}
          className="absolute top-full mt-2 w-full bg-white border border-gray-300 rounded-md shadow-lg z-10"
        >
          {loading ? (
            <div className="p-4">Carregando...</div>
          ) : (
            results.map((produto: Produto, index: number) => (
              <Link
                className="flex justify-between p-4 hover:bg-gray-100"
                key={index}
                href={`/home/loja/produtos/${produto.nome}`}
                onMouseDown={(e) => e.preventDefault()} // Impede que o clique desfoque o input
                onClick={() => {
                  setIsFocused(false); // Oculta os resultados após o clique
                }}
              >
                {produto.nome}{" "}
                <MdOutlineKeyboardArrowRight className="inline text-lg" />
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function SearchBar(props: SearchBarProps) {
  return (
    <Suspense fallback={<div>Carregando pesquisa...</div>}>
      <SearchBarContent {...props} />
    </Suspense>
  );
}
