export const FooterComponent = () => {
  return (
    <footer
      className="py-12"
      style={{ backgroundColor: "#191c1d", color: "#f8f9fa" }}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
            style={{ backgroundColor: "#0058be" }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 16 }}
            >
              auto_awesome
            </span>
          </div>
          <span className="text-2xl font-bold tracking-tight">UniLife.AI</span>
        </div>
        <div className="flex flex-wrap gap-8">
          {["Privacy Policy", "Terms of Service", "Contact Support"].map(
            (link) => (
              <a
                key={link}
                href="#"
                className="text-xs font-medium transition-colors"
                style={{ color: "#e1e3e4" }}
                onMouseOver={(e) => (e.currentTarget.style.color = "#ffffff")}
                onMouseOut={(e) => (e.currentTarget.style.color = "#e1e3e4")}
              >
                {link}
              </a>
            ),
          )}
        </div>
        <p className="text-xs font-medium" style={{ color: "#e1e3e4" }}>
          © 2026 UniLife.AI. Built for the future of learning.
        </p>
      </div>
    </footer>
  );
};
