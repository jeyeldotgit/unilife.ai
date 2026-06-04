export const CTAComponent = () => {
  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 py-24">
      <div
        className="rounded-[2rem] p-8 md:p-20 text-center relative overflow-hidden shadow-2xl"
        style={{ backgroundColor: "#0058be" }}
      >
        <div
          className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-6">
            Ready to upgrade your student life?
          </h2>
          <p
            className="text-lg leading-relaxed mb-10 max-w-xl mx-auto"
            style={{ color: "#d8e2ff" }}
          >
            Join thousands of students who are achieving more with less stress.
            UniLife.AI is free to start.
          </p>
          <button
            className="bg-white px-10 py-5 rounded-2xl font-bold transition-transform hover:scale-105 active:scale-95 shadow-lg"
            style={{ color: "#3B82F6" }}
          >
            Get Started — It&apos;s Free
          </button>
        </div>
      </div>
    </section>
  );
};
