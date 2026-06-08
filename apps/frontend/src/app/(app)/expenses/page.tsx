"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";

// --- Types ---
interface Expense {
  id: string;
  label: string;
  category: string;
  time: string;
  amount: number;
  icon: string;
}

interface DayGroup {
  day: string;
  expenses: Expense[];
}

// --- Initial Data ---
const INITIAL_GROUPS: DayGroup[] = [
  {
    day: "Today",
    expenses: [
      {
        id: "1",
        label: "Lunch",
        category: "Food",
        time: "12:30 PM",
        amount: 85,
        icon: "lunch_dining",
      },
      {
        id: "2",
        label: "Fare",
        category: "Transport",
        time: "08:15 AM",
        amount: 50,
        icon: "commute",
      },
    ],
  },
  {
    day: "Yesterday",
    expenses: [
      {
        id: "3",
        label: "Photocopy",
        category: "School",
        time: "03:45 PM",
        amount: 30,
        icon: "content_copy",
      },
    ],
  },
];

const CATEGORY_DATA = [
  {
    label: "Food",
    icon: "restaurant",
    iconColor: "text-[#3B82F6]",
    percent: 41,
    amount: "₱ 473.55",
  },
  {
    label: "School",
    icon: "school",
    iconColor: "text-[#825100]",
    percent: 26,
    amount: "₱ 300.30",
  },
  {
    label: "Transport",
    icon: "directions_bus",
    percent: 17,
    amount: "₱ 196.35",
    wide: true,
  },
];

// --- Main Page ---
export default function ExpensesPage() {
  const [groups, setGroups] = useState<DayGroup[]>(INITIAL_GROUPS);
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());

  const handleDelete = (id: string) => {
    setRemovingIds((prev) => new Set(prev).add(id));
    setTimeout(() => {
      setGroups((prev) =>
        prev
          .map((group) => ({
            ...group,
            expenses: group.expenses.filter((e) => e.id !== id),
          }))
          .filter((group) => group.expenses.length > 0),
      );
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 300);
  };

  return (
    <div className="bg-[#f8f9fa] text-[#191c1d] min-h-screen pb-32 font-sans">
      {/* Header */}
      <header className="bg-white flex justify-between items-center px-4 py-4 w-full sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#d8e2ff] flex items-center justify-center overflow-hidden">
            <img
              alt="User Profile Picture"
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDaRtE81Eze5Ia1an7hTYaHoBMDwwegPdtdcvZ0SiKkAUtFGEetDGDKNgwEV_d6pYVt-rC44qQSRQVMa8Fe3doKp3jyQb8AqzlgvesU7n_YGYlaH5xI1r1Wtmd90Q8TmmkK49MXiQsfCXsF2TwOBX2ocAtTUsGt1TMG7RWuijBaddPRLTCJZTHI5BKELnwhwX3GyKYMfTXspDcyTkaRAnwNVOcGbAiACg9gtn9mSLw8qrmz3mlsINT-DsLPjM7M3OAdNHS4kMqKqzA"
            />
          </div>
          <h1 className="text-2xl font-bold text-[#0058be]">Expenses</h1>
        </div>
        <button className="text-[#3B82F6] hover:opacity-80 transition-opacity active:scale-95">
          <Icon name="notifications" />
        </button>
      </header>

      <main className="px-4 pt-4 max-w-2xl mx-auto space-y-6">
        {/* Weekly Budget Card */}
        <section
          className="rounded-xl p-5 shadow-sm"
          style={{
            background: "rgba(255,255,255,0.7)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid rgba(229,231,235,0.5)",
          }}
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-sm font-semibold text-[#424754]">
                Weekly Budget
              </h2>
              <p className="text-2xl font-semibold mt-1">
                ₱ 1,155{" "}
                <span className="text-[#424754] text-base font-normal">
                  / ₱ 1,500
                </span>
              </p>
            </div>
            <div className="bg-[#10B981]/10 px-3 py-1 rounded-full">
              <span className="text-[#10B981] text-xs font-medium">
                77% Used
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 bg-[#edeeef] rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-[#10B981] rounded-full"
              style={{ width: "77%" }}
            />
          </div>

          <div className="flex items-center gap-2 text-[#424754]">
            <Icon name="info" className="text-[18px]" />
            <p className="text-xs font-medium">Est. lasts 4 more days</p>
          </div>
        </section>

        {/* Spending by Category */}
        <section>
          <h3 className="text-sm font-semibold text-[#424754] mb-3 px-1">
            Spending by Category
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {/* Food */}
            <div className="bg-white border border-[#c2c6d6]/30 rounded-xl p-4 shadow-sm flex flex-col justify-between h-28 active:scale-[0.98] transition-transform">
              <div className="flex justify-between">
                <Icon name="restaurant" className="text-[#3B82F6]" />
                <span className="text-xs font-medium text-[#424754]">41%</span>
              </div>
              <div>
                <p className="text-sm font-semibold">Food</p>
                <p className="text-xs font-medium text-[#424754]">₱ 473.55</p>
              </div>
            </div>

            {/* School */}
            <div className="bg-white border border-[#c2c6d6]/30 rounded-xl p-4 shadow-sm flex flex-col justify-between h-28 active:scale-[0.98] transition-transform">
              <div className="flex justify-between">
                <Icon name="school" className="text-[#825100]" />
                <span className="text-xs font-medium text-[#424754]">26%</span>
              </div>
              <div>
                <p className="text-sm font-semibold">School</p>
                <p className="text-xs font-medium text-[#424754]">₱ 300.30</p>
              </div>
            </div>

            {/* Transport — full width */}
            <div className="col-span-2 bg-white border border-[#c2c6d6]/30 rounded-xl p-4 shadow-sm flex items-center justify-between active:scale-[0.98] transition-transform">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#6cf8bb] flex items-center justify-center text-[#00714d]">
                  <Icon name="directions_bus" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Transport</p>
                  <p className="text-xs font-medium text-[#424754]">₱ 196.35</p>
                </div>
              </div>
              <span className="text-sm font-bold text-[#191c1d]">17%</span>
            </div>
          </div>
        </section>

        {/* Recent Expenses */}
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-[#424754] mb-3 px-1">
            Recent Expenses
          </h3>

          {groups.map((group) => (
            <div key={group.day} className="space-y-2">
              <p className="text-xs font-medium text-[#424754] px-1">
                {group.day}
              </p>
              <div className="bg-white border border-[#c2c6d6]/30 rounded-xl divide-y divide-[#c2c6d6]/20 overflow-hidden shadow-sm">
                {group.expenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between p-4 hover:bg-[#f3f4f5] transition-all"
                    style={{
                      opacity: removingIds.has(expense.id) ? 0 : 1,
                      transform: removingIds.has(expense.id)
                        ? "translateX(20px)"
                        : "none",
                      transition: "opacity 0.3s ease, transform 0.3s ease",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#edeeef] flex items-center justify-center">
                        <Icon name={expense.icon} className="text-[#424754]" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{expense.label}</p>
                        <p className="text-xs font-medium text-[#424754]">
                          {expense.category} • {expense.time}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-sm font-bold">₱ {expense.amount}</p>
                      <button
                        aria-label="Delete"
                        onClick={() => handleDelete(expense.id)}
                        className="text-[#ba1a1a]/40 hover:text-[#ba1a1a] transition-colors p-1"
                      >
                        <Icon name="delete" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      </main>

      {/* Log Expense FAB */}
      <div className="fixed bottom-24 left-0 right-0 px-4 z-40 md:max-w-md md:mx-auto">
        <button className="w-full bg-[#3B82F6] text-white py-4 rounded-xl text-sm font-semibold shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-transform">
          <Icon name="add" />
          Log Expense
        </button>
      </div>

    </div>
  );
}
