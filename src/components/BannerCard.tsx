import Image from "next/image";
import axios from "axios";
import { FaTrash } from "react-icons/fa";

interface Banner {
  id: string;
  imagem: string;
  titulo: string;
}

interface BannerCardProps {
  banner: Banner;
}

export default function BannerCard({ banner }: BannerCardProps) {
  const handleDelete = async () => {
    if (confirm("Tem certeza que deseja deletar este banner?")) {
      try {
        await axios.delete(`/api/banners/${banner.id}`);
        alert("Banner deletado com sucesso!");
        window.location.reload(); // Recarrega a página para refletir a deleção
      } catch (error) {
        console.error("Erro ao deletar banner:", error);
        alert("Erro ao deletar banner.");
      }
    }
  };

  return (
    <div className="flex items-center gap-4 p-3 border-2 border-gray-300 rounded-md relative bg-white shadow-xl">
      <div className="relative w-20 h-20 flex-shrink-0">
        <Image
          src={banner.imagem}
          alt={banner.titulo}
          fill
          className="rounded-md object-cover"
        />
      </div>
      <div>
        <h1 className="text-black text-lg font-semibold">{banner.titulo}</h1>
      </div>
      <button
        className="absolute top-2 right-2 text-red-500 hover:text-red-700"
        onClick={handleDelete}
      >
        <FaTrash size={16} />
      </button>
    </div>
  );
}