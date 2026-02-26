/* eslint-disable @next/next/no-img-element */
"use client";

import { useSession, signIn } from "next-auth/react";
import Link from "next/link";
import config from "@/config";

// Sign-in button that adapts based on auth state.
// If logged in: shows user avatar + link to dashboard.
// If logged out: shows sign-in button.
const ButtonSignin = ({ text = "Get started", extraStyle }) => {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <button className={`btn ${extraStyle ? extraStyle : ""}`} disabled>
        <span className="loading loading-spinner loading-xs"></span>
      </button>
    );
  }

  if (status === "authenticated") {
    const user = session?.user;
    return (
      <Link
        href={config.auth.callbackUrl}
        className={`btn ${extraStyle ? extraStyle : ""}`}
      >
        {user?.image ? (
          <img
            src={user.image}
            alt={user.name || "Account"}
            className="w-6 h-6 rounded-full shrink-0"
            referrerPolicy="no-referrer"
            width={24}
            height={24}
          />
        ) : (
          <span className="w-6 h-6 bg-base-300 flex justify-center items-center rounded-full shrink-0">
            {user?.name?.charAt(0) || user?.email?.charAt(0) || "U"}
          </span>
        )}
        {user?.name || user?.email || "Account"}
      </Link>
    );
  }

  return (
    <button
      onClick={() => signIn("google")}
      className={`btn ${extraStyle ? extraStyle : ""}`}
    >
      {text}
    </button>
  );
};

export default ButtonSignin;
