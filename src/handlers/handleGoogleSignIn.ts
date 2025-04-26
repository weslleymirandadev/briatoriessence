import { signIn } from "next-auth/react";
import router from "next/router";

export async function handleGoogleSignIn(callbackUrl: string | null) {
  const response = await signIn("google", {
    redirect: true,
    callbackUrl: callbackUrl || "/home",
  });

  if (response) {
    const { ok, url } = response;

    if (ok && url) {
      router.push(url);
    }
  }
}
