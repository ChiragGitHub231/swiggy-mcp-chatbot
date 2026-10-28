import React from "react";

interface LoginButtonProps {
  className?: string;
  label?: string;
}

export function LoginButton({
  className = "",
  label = "Connect Swiggy Account",
}: LoginButtonProps) {
  return (
    <a
      href="/api/auth/login"
      className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-orange-600 hover:bg-orange-700 active:bg-orange-800 transition-all shadow-md hover:shadow-lg ${className}`}
    >
      <span className="text-xl">🛵</span>
      <span>{label}</span>
    </a>
  );
}

export default LoginButton;
