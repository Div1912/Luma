import { useState } from "react";
import { getMidnightProvider } from "../midnight-provider";

export default function Navbar() {
  const [connected, setConnected] = useState(false);

  const connectWallet = async () => {
    try {
      const provider = getMidnightProvider();
      if (!provider) throw new Error("Midnight provider not injected. Open Lace (Midnight testnet profile) and reload.");
      const api = typeof provider.enable === "function" ? await provider.enable() : provider;
      setConnected(true);
      window.dispatchEvent(new CustomEvent("midnight:connected", { detail: { api, provider } }));
    } catch (err:any) {
      alert(err?.message || String(err));
      console.error("Wallet connection failed:", err);
    }
  };

  return (
    <nav style={{
      position:"fixed", top:0, left:0, width:"100%", height:"3rem",
      display:"flex", alignItems:"center", justifyContent:"flex-end",
      paddingRight:"3rem", backgroundColor:"#111827", zIndex:50
    }}>
      <button onClick={connectWallet} style={{
        padding:"0.45rem 0.9rem", borderRadius:"0.55rem", border:"none",
        backgroundColor:"#4f46e5", color:"white", fontWeight:700,
        fontSize:"0.9rem", cursor:"pointer"
      }}>
        {connected ? "✅ Connected" : "Connect Midnight Lace Wallet"}
      </button>
    </nav>
  );
}