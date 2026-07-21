"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Ghost, Menu, X } from "lucide-react";
import { useMidnight } from "@/lib/midnight/useMidnight";

const NAV_LINKS = [
  { label: "Product", href: "#product" },
  { label: "Use Cases", href: "#use-cases" },
  { label: "Developers", href: "#developers" },
  { label: "Pricing", href: "/pricing" },
  { label: "Docs", href: "/docs" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { walletState, connectLace, disconnect } = useMidnight();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
          scrolled
            ? "h-16 bg-[rgba(10,10,10,0.85)] backdrop-blur-2xl border-white/[0.06]"
            : "h-20 bg-[rgba(10,10,10,0.65)] backdrop-blur-xl border-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          {/* Left: Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <Ghost className="w-5 h-5 text-white transition-colors duration-300 group-hover:text-[#b8d4f0]" />
            <span className="font-mono text-sm tracking-[0.2em] font-bold text-white uppercase">
              <span className="text-white/50">/</span> Ghost
            </span>
          </Link>

          {/* Center: Links (Desktop) */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-white/70 hover:text-white transition-colors duration-200"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right: Actions (Desktop) */}
          <div className="hidden md:flex items-center gap-4">
            {!walletState.isConnected ? (
              <button
                onClick={connectLace}
                className="text-sm font-medium text-white/80 hover:text-white transition-colors"
              >
                Connect Wallet
              </button>
            ) : (
              <>
                <span className="text-sm text-white/50 font-mono">
                  {walletState.address?.slice(0, 6)}...{walletState.address?.slice(-4)}
                </span>
                <button
                  onClick={disconnect}
                  className="text-sm font-medium text-white/80 hover:text-white transition-colors"
                >
                  Disconnect
                </button>
                <Link
                  href="/dashboard"
                  className="h-9 px-5 flex items-center justify-center text-sm font-medium bg-white text-black rounded hover:bg-[#b8d4f0] transition-colors"
                >
                  Launch App
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden text-white/80 hover:text-white"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(24px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] bg-[rgba(10,10,10,0.95)] flex flex-col"
          >
            <div className="flex items-center justify-between h-20 px-6 border-b border-white/[0.06]">
              <Link
                href="/"
                className="flex items-center gap-3"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Ghost className="w-5 h-5 text-white" />
                <span className="font-mono text-sm tracking-[0.2em] font-bold text-white uppercase">
                  <span className="text-white/50">/</span> Ghost
                </span>
              </Link>
              <button
                className="text-white/80 hover:text-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex flex-col px-6 py-8 gap-6 flex-1 overflow-y-auto">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-xl font-medium text-white/80 hover:text-white transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="h-px w-full bg-white/[0.06] my-4" />
              {!walletState.isConnected ? (
                <button
                  onClick={() => {
                    connectLace();
                    setMobileMenuOpen(false);
                  }}
                  className="text-lg font-medium text-left text-white/80 hover:text-white"
                >
                  Connect Wallet
                </button>
              ) : (
                <>
                  <span className="text-sm text-white/50 font-mono">
                    {walletState.address?.slice(0, 6)}...{walletState.address?.slice(-4)}
                  </span>
                  <button
                    onClick={() => {
                      disconnect();
                      setMobileMenuOpen(false);
                    }}
                    className="text-lg font-medium text-left text-white/80 hover:text-white"
                  >
                    Disconnect
                  </button>
                  <Link
                    href="/dashboard"
                    className="h-12 w-full flex items-center justify-center text-lg font-medium bg-white text-black rounded mt-2 hover:bg-[#b8d4f0] transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Launch App
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
