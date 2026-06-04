export const BackgroundBlobs = () => {
  return (
    <div className="pointer-events-none absolute top-0 left-0 -z-10 h-full w-full overflow-hidden">
      <div
        className="absolute -top-24 -left-24 h-96 w-96 rounded-full"
        style={{ background: "rgba(0,88,190,0.10)", filter: "blur(60px)" }}
      />
      <div
        className="absolute top-1/2 -right-24 h-64 w-64 rounded-full"
        style={{ background: "rgba(16,185,129,0.10)", filter: "blur(60px)" }}
      />
    </div>
  );
};
