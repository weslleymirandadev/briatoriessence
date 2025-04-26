import { NextResponse } from 'next/server';
import prisma from '../../../../../prisma';

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const id = params.id;

  const banner = await prisma.banners.findUnique({
    where: { id },
  });

  if (!banner) {
    return NextResponse.json({ error: 'Banner não encontrado' }, { status: 404 });
  }

  await prisma.banners.delete({
    where: { id },
  });

  return NextResponse.json({ message: 'Banner deletado com sucesso' });
}