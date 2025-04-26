import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "../../../../../prisma";
import { authOptions } from "../../auth/[...nextauth]/route";
import { v2 as cloudinary } from "cloudinary";

function extractPublicIdFromUrl(url: string): string {
  const urlParts = url.split("/");
  const publicIdWithExtension = urlParts[urlParts.length - 1];
  const publicId = publicIdWithExtension.split(".")[0];
  return publicId;
}

// Configuração do Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function isAdmin(req: NextRequest) {
  const session = await getServerSession(authOptions);
  return session && session.user.role === "admin";
}

// Função para gerar a assinatura do Cloudinary
function generateCloudinarySignature() {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    { timestamp },
    process.env.CLOUDINARY_API_SECRET as string
  );
  return { timestamp, signature };
}

// Função para fazer upload de uma imagem para o Cloudinary
async function uploadImageToCloudinary(file: File) {
  const { timestamp, signature } = generateCloudinarySignature();

  const formData = new FormData();
  formData.append("file", file);
  formData.append("timestamp", timestamp.toString());
  formData.append("api_key", process.env.CLOUDINARY_API_KEY as string);
  formData.append("signature", signature);

  const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`;

  const uploadResponse = await fetch(cloudinaryUrl, {
    method: "POST",
    body: formData,
  });

  if (!uploadResponse.ok) {
    throw new Error("Erro ao fazer upload da imagem para o Cloudinary");
  }

  const uploadData = await uploadResponse.json();
  return uploadData.secure_url;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { produto: string } }
) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json(
        { status: "error", message: "Acesso negado" },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const descricao = formData.get("descricao") as string;
    const preco = parseFloat(formData.get("preco") as string);
    const precoDes = parseFloat(formData.get("precoDes") as string);
    const imagens = formData.getAll("imagens") as File[];
    const tags = formData.get("tags") as string;
    const peso = parseFloat(formData.get("peso") as string);
    const altura = parseFloat(formData.get("altura") as string);
    const largura = parseFloat(formData.get("largura") as string);
    const comprimento = parseFloat(formData.get("comprimento") as string);
    const { produto } = await params;

    if (
      descricao === null ||
      preco === null ||
      precoDes === null ||
      !imagens ||
      imagens.length === 0 ||
      tags === null ||
      peso === null ||
      altura === null ||
      largura === null ||
      comprimento === null
    ) {
      return NextResponse.json(
        { status: "error", message: "Dados incompletos" },
        { status: 400 }
      );
    }

    // Fazer upload das imagens para o Cloudinary
    const imageUrls = [];
    for (const img of imagens) {
      const imageUrl = await uploadImageToCloudinary(img);
      imageUrls.push(imageUrl);
    }

    // Criar o produto no banco de dados
    const novoProduto = await prisma.produto.create({
      data: {
        nome: produto,
        descricao,
        precoOrg: preco,
        precoDes: precoDes,
        imagens: imageUrls,
        tags,
        peso,
        altura,
        largura,
        comprimento,
      },
    });

    return NextResponse.json(
      { status: "success", data: novoProduto },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro ao criar produto:", error);
    return NextResponse.json(
      { status: "error", message: `Erro ao criar produto: ${error}` },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { produto: string } }
) {
  try {
    const { produto } = await params;

    const foundProduct = await prisma.produto.findUnique({
      where: { nome: produto },
    });

    if (!foundProduct) {
      return NextResponse.json(
        { status: "error", message: "Produto não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { status: "success", data: foundProduct },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao buscar produto:", error);
    return NextResponse.json(
      { status: "error", message: `Erro ao buscar produto: ${error}` },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { produto: string } }
) {
  try {
    const { produto } = await params;

    if (!(await isAdmin(req))) {
      return NextResponse.json(
        { status: "error", message: "Acesso negado" },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const descricao = formData.get("descricao") as string;
    const preco = parseFloat(formData.get("preco") as string);
    const precoDes = parseFloat(formData.get("precoDes") as string);
    const imagens = formData.getAll("imagens") as (string | File)[];
    const tags = formData.get("tags") as string;
    const peso = parseFloat(formData.get("peso") as string);
    const altura = parseFloat(formData.get("altura") as string);
    const largura = parseFloat(formData.get("largura") as string);
    const comprimento = parseFloat(formData.get("comprimento") as string);

    // Buscar imagens existentes no banco de dados
    const produtoExistente = await prisma.produto.findUnique({
      where: { nome: produto },
      select: {
        imagens: true,
      },
    });

    if (!produtoExistente) {
      return NextResponse.json(
        { status: "error", message: "Produto não encontrado" },
        { status: 404 }
      );
    }

    let imageUrls = produtoExistente.imagens;

    for (const img of imagens) {
      if (typeof img === "string" && img.includes("cloudinary")) {
        continue; // Pular imagens que já estão no Cloudinary
      }
      if (img instanceof File) {
        const imageUrl = await uploadImageToCloudinary(img);
        imageUrls.push(imageUrl);
      }
    }

    // Atualizar o produto no banco de dados
    const produtoAtualizado = await prisma.produto.update({
      where: { nome: produto },
      data: {
        descricao,
        precoOrg: preco,
        precoDes,
        imagens: imageUrls,
        tags,
        peso,
        altura,
        largura,
        comprimento
      },
    });

    return NextResponse.json(
      { status: "success", data: produtoAtualizado },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao atualizar produto:", error);
    return NextResponse.json(
      { status: "error", message: `Erro ao atualizar produto: ${error}` },
      { status: 500 }
    );
  }
}


export async function DELETE(
  req: NextRequest,
  { params }: { params: { produto: string } }
) {
  try {
    const { produto } = await params;

    if (!(await isAdmin(req))) {
      return NextResponse.json(
        { status: "error", message: "Acesso negado" },
        { status: 403 }
      );
    }

    const produtoExistente = await prisma.produto.findUnique({
      where: { nome: produto },
      select: {
        imagens: true,
      },
    });

    if (!produtoExistente || !produtoExistente.imagens.length) {
      return NextResponse.json(
        { status: "error", message: "Produto não encontrado ou sem imagens" },
        { status: 404 }
      );
    }

    // Deletar as imagens do Cloudinary
    const deleteImagePromises = produtoExistente.imagens.map((imageUrl) => {
      const publicId = extractPublicIdFromUrl(imageUrl);
      return cloudinary.uploader.destroy(publicId);
    });

    await Promise.all(deleteImagePromises);

    // Deletar o produto do banco de dados
    const produtoDeletado = await prisma.produto.delete({
      where: { nome: produto },
    });

    return NextResponse.json(
      { status: "success", data: produtoDeletado },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao deletar produto:", error);
    return NextResponse.json(
      { status: "error", message: `Erro ao deletar produto: ${error}` },
      { status: 500 }
    );
  }
}


