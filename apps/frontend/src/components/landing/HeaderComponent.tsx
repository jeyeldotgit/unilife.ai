import Image from "next/image";

export const HeaderComponent = () => {
  return (
    <header className="w-full flex justify-between items-center px-4 md:px-8 py-6 relative z-10">
      <div className="flex items-center gap-2">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg"
          style={{ backgroundColor: "#0058be" }}
        >
          <Image
            src="/unilife-ai-big.svg"
            alt="UniLife.AI icon"
            width={20}
            height={20}
            className="h-10 w-10"
          />
        </div>
        <span
          className="text-2xl font-bold tracking-tight"
          style={{ color: "#0058be" }}
        >
          UniLife.AI
        </span>
      </div>
      <nav className="hidden md:flex gap-8 items-center">
        {["Features", "Pricing", "Community"].map((item) => (
          <a
            key={item}
            href="#"
            className="text-sm font-semibold transition-colors"
            style={{ color: "#424754" }}
            onMouseOver={(e) => (e.currentTarget.style.color = "#0058be")}
            onMouseOut={(e) => (e.currentTarget.style.color = "#424754")}
          >
            {item}
          </a>
        ))}
        <a
          href="#"
          className="text-sm font-bold transition-opacity hover:opacity-80"
          style={{ color: "#3B82F6" }}
        >
          Log In
        </a>
      </nav>
    </header>
  );
};
