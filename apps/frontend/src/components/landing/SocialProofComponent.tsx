export const SocialProofComponent = () => {
  return (
    <section
      className="py-16 bg-white"
      style={{
        borderTop: "1px solid #c2c6d6",
        borderBottom: "1px solid #c2c6d6",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-wrap justify-center gap-12 md:gap-24 items-center opacity-40 grayscale">
        {["PUP", "UP", "TUP", "PLM"].map((name) => (
          <span
            key={name}
            className="text-2xl font-bold tracking-tighter text-[#191c1d]"
          >
            {name}
          </span>
        ))}
      </div>
    </section>
  );
};
