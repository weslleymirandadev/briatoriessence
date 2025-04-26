import AuthProvider from "@/components/AuthProvider";
import Footer from "@/components/Footer";
import Header from "@/components/Header/Header";
import Main from "@/components/Main";
import Link from "next/link";

export default function NotFounds() {
  return (
    <AuthProvider>
      <Header />
      <Main>
        <section className="flex items-center justify-center">
          <div className="my-20 text-center">
            <h1 className="text-5xl bg-[var(--primary)] inline-block p-2 rounded-md">
              404
            </h1>
            <p>Desculpe, a página que você procura não existe.</p>
            <br />
            <Link
              className="hover:text-white font-bold border rounded-md p-2 hover:bg-black text-black transition-all duration-200"
              prefetch={true}
              href="/"
            >
              Voltar à Página Inicial
            </Link>
          </div>
        </section>
      </Main>
      <Footer />
    </AuthProvider>
  );
}
