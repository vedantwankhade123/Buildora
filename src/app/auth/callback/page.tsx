"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function AuthCallback() {
  const [message, setMessage] = useState("Confirming your email...");
  const router = useRouter();

  useEffect(() => {
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.replace("#", ""));
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");
    const type = params.get("type");

    if (type === "signup" && access_token && refresh_token) {
      supabase.auth.setSession({ access_token, refresh_token }).then(({ error }) => {
        if (error) {
          setMessage("There was an error confirming your email.");
        } else {
          setMessage("Email confirmed! Redirecting...");
          setTimeout(() => router.push("/"), 2000);
        }
      });
    } else {
      setMessage("Invalid confirmation link.");
    }
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-900 text-white">
      <h2 className="text-2xl font-bold mb-4">{message}</h2>
    </div>
  );
} 