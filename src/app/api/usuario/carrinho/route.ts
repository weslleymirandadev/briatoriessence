import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../api/auth/[...nextauth]/route";
import prisma from "../../../../../prisma";

export async function POST(req: NextRequest) {
  try {
    const { email, produto } = await req.json();

    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email },
      include: { cart: true },
    });

    if (!user) {
      return NextResponse.json({ status: "error", data: "User not found" });
    }

    // Find the product by id
    const product = await prisma.produto.findUnique({
      where: { id: produto.id },
    });

    if (!product) {
      return NextResponse.json({ status: "error", data: "Product not found" });
    }

    // Check if the user already has a cart
    let cart;
    if (user.cart.length > 0) {
      cart = user.cart[0];
    } else {
      // Create a new cart for the user
      cart = await prisma.cart.create({
        data: {
          userId: user.id,
          total: product.precoDes > 0 ? product.precoDes : product.precoOrg,
          status: "active",
        },
      });
    }

    // Check if the product is already in the cart
    const cartProduct = await prisma.cartProduto.findFirst({
      where: {
        cartId: cart.id,
        produtoId: product.id,
      },
    });

    if (cartProduct) {
      // Update the quantity of the product in the cart
      await prisma.cartProduto.update({
        where: { id: cartProduct.id },
        data: { quantidade: cartProduct.quantidade + 1 },
      });
    } else {
      // Add the product to the cart
      await prisma.cartProduto.create({
        data: {
          cartId: cart.id,
          produtoId: product.id,
          quantidade: 1,
        },
      });
    }

    // Recalculate the total
    const updatedCart = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: { products: { include: { produto: true } } },
    });

    const newTotal = updatedCart!.products.reduce((acc, cartProduct) => {
      return acc + (cartProduct.produto.precoDes > 0 ? cartProduct.produto.precoDes : cartProduct.produto.precoOrg) * cartProduct.quantidade;
    }, 0);

    await prisma.cart.update({
      where: { id: cart.id },
      data: { total: newTotal },
    });

    return NextResponse.json({ status: "success", data: updatedCart });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ status: "error", data: error });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ status: "error", data: "Not authenticated" });
    }

    const email = session.user.email;

    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email },
      include: { cart: { include: { products: { include: { produto: true } } } } },
    });

    if (!user) {
      return NextResponse.json({ status: "error", data: "User not found" });
    }

    const cart = user.cart.length > 0 ? user.cart[0] : null;

    return NextResponse.json({ status: "success", data: cart });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ status: "error", data: error });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ status: "error", data: "Not authenticated" });
    }

    const { produtoId, quantidade } = await req.json();

    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { cart: { include: { products: true } } },
    });

    if (!user) {
      return NextResponse.json({ status: "error", data: "User not found" });
    }

    const cart = user.cart.length > 0 ? user.cart[0] : null;

    if (!cart) {
      return NextResponse.json({ status: "error", data: "Cart not found" });
    }

    // Update the quantity of the product in the cart
    await prisma.cartProduto.updateMany({
      where: {
        cartId: cart.id,
        produtoId: produtoId,
      },
      data: { quantidade },
    });

    // Recalculate the total
    const updatedCart = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: { products: { include: { produto: true } } },
    });

    const newTotal = updatedCart!.products.reduce((acc, cartProduct) => {
      return acc + (cartProduct.produto.precoDes > 0 ? cartProduct.produto.precoDes : cartProduct.produto.precoOrg) * cartProduct.quantidade;
    }, 0);

    await prisma.cart.update({
      where: { id: cart.id },
      data: { total: newTotal },
    });

    return NextResponse.json({ status: "success", data: updatedCart });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ status: "error", data: error });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ status: "error", data: "Not authenticated" });
    }

    const { produtoId } = await req.json();

    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { cart: { include: { products: true } } },
    });

    if (!user) {
      return NextResponse.json({ status: "error", data: "User not found" });
    }

    const cart = user.cart.length > 0 ? user.cart[0] : null;

    if (!cart) {
      return NextResponse.json({ status: "error", data: "Cart not found" });
    }

    // Remove the product from the cart
    await prisma.cartProduto.deleteMany({
      where: {
        cartId: cart.id,
        produtoId: produtoId,
      },
    });

    // Recalculate the total
    const updatedCart = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: { products: { include: { produto: true } } },
    });

    const newTotal = updatedCart!.products.reduce((acc, cartProduct) => {
      return acc + (cartProduct.produto.precoDes > 0 ? cartProduct.produto.precoDes : cartProduct.produto.precoOrg) * cartProduct.quantidade;
    }, 0);

    await prisma.cart.update({
      where: { id: cart.id },
      data: { total: newTotal },
    });

    return NextResponse.json({ status: "success", data: updatedCart });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ status: "error", data: error });
  }
}
