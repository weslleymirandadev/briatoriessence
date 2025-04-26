import { NextRequest, NextResponse } from 'next/server';
import cloudinary from 'cloudinary';
import prisma from '../../../../prisma';
import { isAdmin } from '../produtos/[produto]/route';

// Configuração do Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function GET() {
  const banners = await prisma.banners.findMany();
  return NextResponse.json({ data: banners });
}

export async function POST(request: NextRequest) {
  try {
    // Verificar se o usuário é admin
    if (!(await isAdmin(request))) {
      return NextResponse.json(
        { status: 'error', message: 'Acesso negado' },
        { status: 403 }
      );
    }

    // Obter FormData da requisição
    const formData = await request.formData();
    const imagens = formData.getAll('imagens'); // Assume que o campo no FormData é 'imagens'

    if (!imagens || imagens.length === 0) {
      return NextResponse.json(
        { status: 'error', message: 'Pelo menos uma imagem é obrigatória' },
        { status: 400 }
      );
    }

    // Array para armazenar URLs das imagens no Cloudinary
    const imageUrls: string[] = [];

    // Fazer upload de cada imagem para o Cloudinary
    for (const imagem of imagens) {
      if (imagem instanceof File) {
        // Converter File para Buffer
        const arrayBuffer = await imagem.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Fazer upload para o Cloudinary
        const result = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.v2.uploader.upload_stream(
            { folder: 'banners' }, // Pasta no Cloudinary
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          uploadStream.end(buffer);
        });

        // Adicionar URL da imagem ao array
        imageUrls.push((result as any).secure_url);
      }
    }

    if (imageUrls.length === 0) {
      return NextResponse.json(
        { status: 'error', message: 'Nenhuma imagem válida foi enviada' },
        { status: 400 }
      );
    }

    // Criar novo banner no Prisma com as URLs das imagens
    const newBanner = await prisma.banners.create({
      data: {
        imagens: imageUrls,
      },
    });

    return NextResponse.json({ data: newBanner }, { status: 201 });
  } catch (error) {
    console.error('Erro na rota POST:', error);
    return NextResponse.json(
      { status: 'error', message: 'Erro interno no servidor' },
      { status: 500 }
    );
  }
}