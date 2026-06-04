export const HeroComponent = () => {
  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 pt-12 pb-24 flex flex-col md:flex-row items-center gap-12 lg:gap-20">
      {/* Left copy */}
      <div className="w-full md:w-1/2 space-y-8 text-center md:text-left">
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
          style={{ backgroundColor: "#d8e2ff", color: "#001a42" }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            school
          </span>
          <span className="text-xs font-medium tracking-widest uppercase">
            Survive & Thrive in University with AI
          </span>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight text-[#191c1d]">
          Your AI <span style={{ color: "#3B82F6" }}>Student Companion</span>{" "}
          for Academic Mastery.
        </h1>

        <p
          className="text-lg leading-relaxed max-w-xl mx-auto md:mx-0"
          style={{ color: "#424754" }}
        >
          Master your schedule, automate study notes, and manage your student
          budget with the only AI built specifically for university life.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 justify-center md:justify-start">
          <button
            className="w-full sm:w-auto text-white px-8 py-4 rounded-xl text-sm font-semibold transition-all duration-300 hover:shadow-xl active:scale-95"
            style={{ backgroundColor: "#3B82F6" }}
            onMouseOver={(e) =>
              (e.currentTarget.style.transform = "translateY(-2px)")
            }
            onMouseOut={(e) =>
              (e.currentTarget.style.transform = "translateY(0)")
            }
          >
            Get Started — It&apos;s Free
          </button>
          <a
            href="#"
            className="w-full sm:w-auto text-center text-sm font-semibold p-4 rounded-xl transition-all"
            style={{
              color: "#424754",
              border: "1px solid #c2c6d6",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.color = "#0058be";
              e.currentTarget.style.backgroundColor = "#edeeef";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.color = "#424754";
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            Already have an account? Log In
          </a>
        </div>

        <div
          className="flex items-center gap-6 pt-8 justify-center md:justify-start"
          style={{ opacity: 0.7 }}
        >
          <div className="flex -space-x-3">
            {[
              "https://lh3.googleusercontent.com/aida-public/AB6AXuAaHWO6f_6IP2_Zm-7RqRfUqrQHMQu49W3MKplTgfJ2ftKSMXMormTC0qFipJg9OsGaE0u7dRwRH9mH3UxhzvWnQj4pcwJSumk1_hYOkPqc0aMnIlJifnUU1sAShxgb7LjxzgFNLv3nU27nLo_TLDRq6kQ_jbR-3Qny0RunLFbC9Ipa4JidHUHDDQ8YSwuTHt0B5w4W0RWrEu0RcOSxIlYAWJXaoTQnLaKJj8rmQh6Or4v2vlbX4oSq7HjQ_GXu9-_FvXqmzPF4U-g",
              "https://lh3.googleusercontent.com/aida-public/AB6AXuBe1XaCxZRzT9pKeQqbhsGw_VANomzFuVDusGNO-B3OjF4U-BcFhWgaylv8FpeF8IUUhImTEc9IKMKGnVgcXsva4NJTXMnVn7l0sELBi5chcwK1YIhtKwBtPfgeBB5SKbF4w1ZKwoqDuJrFEROEd73eg6qpPlp4msCJixiwFsVTNkb0AdnfwrjcTT6OnDHlbP-6YfHvvy-WnDiTL6NO0zPMcJNbTXmSQBBBn6QVUok04RcMbv7qTlOc4oLjsGF8C1zjcvz1mQhuM-I",
              "https://lh3.googleusercontent.com/aida-public/AB6AXuDDgWjwG0pg9uGDzDw5SamB0X-c0wPN9coGmsZOcmKs_qbQK8GrPrhqvh76HlddSfFKk3580SzUp9w1ZRNDN6cmaQPKyueCljy8TymfdYCIQkciFO8WeC5nY53uZy-2sQG_G_qp8Wp-m6IJAqgrM47524bNqXmOvWXAV9sXyQBx176nWuM7OFBfRl0IqABUP3BLw4NromczBppsDRqdP6UByXoFM73lsE8fYTr3KXUqL5xpF2EwOsq-r81z7s6h9GZu8yzhan8HS7E",
            ].map((src, i) => (
              <img
                key={i}
                src={src}
                alt="Student"
                className="w-10 h-10 rounded-full"
                style={{ border: "2px solid white" }}
              />
            ))}
          </div>
          <p className="text-xs font-medium" style={{ color: "#424754" }}>
            Joined by <span className="font-bold text-[#191c1d]">15,000+</span>{" "}
            students this semester
          </p>
        </div>
      </div>

      {/* Right bento grid */}
      <div className="w-full md:w-1/2 relative">
        <div className="bento-grid">
          {/* Schedule card */}
          <div
            className="col-span-8 row-span-4 bg-white rounded-2xl border p-6 overflow-hidden transition-shadow duration-500 hover:shadow-2xl"
            style={{
              gridColumn: "span 8",
              gridRow: "span 4",
              border: "1px solid #c2c6d6",
              boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[#191c1d]">
                Weekly Schedule
              </h3>
              <span
                className="material-symbols-outlined"
                style={{ color: "#3B82F6" }}
              >
                calendar_today
              </span>
            </div>
            <div className="space-y-3">
              <div
                className="h-12 rounded-lg flex items-center px-4"
                style={{
                  backgroundColor: "#d8e2ff",
                  borderLeft: "4px solid #0058be",
                }}
              >
                <span className="text-xs font-medium text-[#001a42]">
                  Intro to Data Science • 10:00 AM
                </span>
              </div>
              <div
                className="h-12 rounded-lg flex items-center px-4"
                style={{ backgroundColor: "#f3f4f5" }}
              >
                <span
                  className="text-xs font-medium"
                  style={{ color: "#424754" }}
                >
                  Economics Lecture • 2:30 PM
                </span>
              </div>
              <div
                className="h-12 rounded-lg flex items-center px-4"
                style={{
                  backgroundColor: "rgba(111,251,190,0.3)",
                  borderLeft: "4px solid #10B981",
                }}
              >
                <span
                  className="text-xs font-medium"
                  style={{ color: "#006c49" }}
                >
                  Study Group: Library • 5:00 PM
                </span>
              </div>
            </div>
          </div>

          {/* Budget card */}
          <div
            className="glass-card rounded-2xl border p-5 flex flex-col items-center justify-center text-center gap-2 transition-transform hover:scale-105"
            style={{
              gridColumn: "span 4",
              gridRow: "span 3",
              border: "1px solid #c2c6d6",
            }}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{
                backgroundColor: "rgba(16,185,129,0.2)",
                color: "#10B981",
              }}
            >
              <span className="material-symbols-outlined">
                account_balance_wallet
              </span>
            </div>
            <span className="text-xs font-medium" style={{ color: "#424754" }}>
              Budget
            </span>
            <span className="text-2xl font-semibold text-[#191c1d]">
              P1250.00
            </span>
            <span className="text-xs font-medium" style={{ color: "#10B981" }}>
              On Track
            </span>
          </div>

          {/* Campus photo */}
          <div
            className="rounded-2xl border overflow-hidden relative group"
            style={{
              gridColumn: "span 4",
              gridRow: "span 3",
              border: "1px solid #c2c6d6",
              boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
            }}
          >
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDUnur24rmCkHWGVCDvqqNMY_j4vOzdAqeeJQpqH2KWdt_PkDdNFZrk4j4nXT3IsfnZg8oN9K4f31ezwm6hSyyvIhR73QlmJg8gw1w_DLayfB5GQXydbhgQpp2AUY4BwBqrNZpYn7uWprhhOlHn2Xd8V8sx57QgTXFnXKH0CphqvGNmPPHNWDM6Rwn4QCQUaZqc4v4apjTNiIJZZ6Uc8_zpyIDadvKAKieK2lu5dQV7Gv0fwmiL9L9peJfdO_bJHYwBVRdzGKDqP7w"
              alt="Campus library"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div
              className="absolute inset-0 flex items-end p-4"
              style={{
                background:
                  "linear-gradient(to top, rgba(0,0,0,0.6), transparent)",
              }}
            >
              <span className="text-white text-sm font-semibold">
                Campus Hub
              </span>
            </div>
          </div>

          {/* AI chat card */}
          <div
            className="glass-card rounded-2xl border p-4 flex items-center gap-4"
            style={{
              gridColumn: "span 8",
              gridRow: "span 2",
              border: "1px solid #c2c6d6",
            }}
          >
            <div
              className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white animate-bounce"
              style={{ backgroundColor: "#3B82F6" }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 20 }}
              >
                smart_toy
              </span>
            </div>
            <p className="text-xs font-medium italic text-[#191c1d]">
              &ldquo;Hey Alex, you have a deadline for Economics tomorrow. Want
              me to summarize the lecture notes?&rdquo;
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
