import { NextApiRequest, NextApiResponse } from "next";
import cloudinary from "cloudinary";
import prisma from "../../../../../../prisma";
import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "../../[produto]/route";

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function DELETE(
  req: NextRequest,
  { params }: { params: { produto: string } }
) {
  try {
    const { produto } = params; // Extrai produto dos params
    const { imageUrl } = await req.json(); // Assume que o front envia JSON

    if (!(await isAdmin(req))) {
      return NextResponse.json(
        { status: "error", message: "Acesso negado" },
        { status: 403 }
      );
    }

    // Validação reforçada
    if (!produto || !imageUrl?.includes("cloudinary")) {
      return NextResponse.json(
        { status: "error", message: "Dados inválidos" },
        { status: 400 }
      );
    }

    const publicId = imageUrl.split("/").slice(-2).join("/").split(".")[0].split("/")[1];
    console.log(publicId)

    await cloudinary.v2.uploader.destroy(publicId);

    const produtoAtual = await prisma.produto.findUnique({
      where: { nome: produto },
    });

    if (!produtoAtual) {
      return NextResponse.json(
        { status: "error", message: "Produto não encontrado" },
        { status: 404 }
      );
    }

    const novasImagens = produtoAtual.imagens.filter((img) => img !== imageUrl);

    await prisma.produto.update({
      where: { nome: produto },
      data: { imagens: { set: novasImagens } },
    });

    return NextResponse.json(
      { status: "success", message: "Imagem removida" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro na rota DELETE:", error);
    return NextResponse.json(
      { status: "error", message: "Erro interno no servidor" },
      { status: 500 }
    );
  }
}