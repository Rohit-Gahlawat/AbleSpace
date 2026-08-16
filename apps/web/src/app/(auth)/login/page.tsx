"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { BrandLockup } from "@/components/brand";
import { GoogleMark } from "@/components/google-mark";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api, setToken } from "@/lib/api";
import type { Session } from "@/lib/types";

export default function LoginPage() {
  const router = useRouter();
  const [isSigningIn, setIsSigningIn] = useState(false);

  async function continueAsGuest() {
    setIsSigningIn(true);
    try {
      const session = await api<Session>("/auth/guest", { method: "POST" });
      setToken(session.token);
      router.push("/tasks");
    } catch (error) {
      setIsSigningIn(false);
      toast.error(
        error instanceof Error ? error.message : "Could not start a guest session",
      );
    }
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-10">
      <BrandLockup />

      <Card className="ring-border w-full max-w-96 gap-6 p-6 text-center">
        <div className="grid gap-1.5">
          <h1 className="text-base leading-6 font-semibold tracking-tight">
            Let&apos;s get back on track
          </h1>
          <p className="text-muted-foreground text-sm leading-5">
            Enter your email below to login to your account.
          </p>
        </div>

        <div className="grid gap-4">
          <Button
            className="bg-foreground text-background hover:bg-foreground/90 w-full"
            onClick={continueAsGuest}
            disabled={isSigningIn}
          >
            {isSigningIn ? "Setting up your workspace…" : "Continue as Guest"}
          </Button>

          <Button
            variant="outline"
            className="w-full"
            disabled
            title="Google sign-in is not part of this assessment"
          >
            <GoogleMark />
            Login with Google
          </Button>
        </div>
      </Card>

      <p className="text-muted-foreground max-w-64 text-center text-xs text-balance">
        By clicking continue, you agree to our{" "}
        <a className="underline underline-offset-4" href="#">
          Terms of Service
        </a>{" "}
        and{" "}
        <a className="underline underline-offset-4" href="#">
          Privacy Policy
        </a>
        .
      </p>
    </main>
  );
}
