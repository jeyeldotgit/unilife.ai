export const FeaturesComponent = () => {
  return (
    <section style={{ backgroundColor: "#f3f4f5" }} className="py-20">
      <div className="max-w-7xl mx-auto px-4 md:px-8 text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[#191c1d] mb-4">
          Everything you need to thrive.
        </h2>
        <p
          className="text-base leading-relaxed max-w-2xl mx-auto"
          style={{ color: "#424754" }}
        >
          Built by students, for students. We&apos;ve combined every essential
          tool into one intelligent dashboard.
        </p>
      </div>
      <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          {
            icon: "auto_awesome_motion",
            color: "#3B82F6",
            title: "Smart Notes",
            desc: "Upload lecture recordings or PDFs and get instant, structured summaries and flashcards.",
          },
          {
            icon: "savings",
            color: "#10B981",
            title: "Budget Bot",
            desc: "Keep your finances in check with automatic expense tracking and student discount alerts.",
          },
          {
            icon: "event_available",
            color: "#F59E0B",
            title: "Adaptive Planner",
            desc: "Your schedule adjusts automatically when life happens. Never miss a deadline again.",
          },
        ].map((feature) => (
          <div
            key={feature.title}
            className="bg-white p-8 rounded-2xl border transition-shadow hover:shadow-md"
            style={{
              border: "1px solid #c2c6d6",
              boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            }}
          >
            <span
              className="material-symbols-outlined mb-6 block"
              style={{ color: feature.color, fontSize: 40 }}
            >
              {feature.icon}
            </span>
            <h3 className="text-2xl font-semibold text-[#191c1d] mb-2">
              {feature.title}
            </h3>
            <p
              className="text-base leading-relaxed"
              style={{ color: "#424754" }}
            >
              {feature.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};
