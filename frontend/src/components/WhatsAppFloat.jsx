import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import api from "@/lib/api";

export default function WhatsAppFloat() {
  const [num, setNum] = useState("");
  useEffect(() => {
    api.get("/site/config").then((r) => setNum(r.data.whatsapp_number)).catch(() => {});
  }, []);
  if (!num) return null;
  const url = `https://wa.me/${num}?text=Hi%20Saksham%20Learning,%20I%27d%20like%20to%20know%20more.`;
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      data-testid="whatsapp-float"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-6 right-6 z-50 group flex items-center gap-3 bg-[#25D366] hover:bg-[#1eb858] text-white px-5 py-4 rounded-full shadow-xl transition-all hover:scale-105"
    >
      <MessageCircle className="w-6 h-6" fill="white" />
      <span className="hidden md:inline-block font-semibold text-sm">Chat with us</span>
    </a>
  );
}
