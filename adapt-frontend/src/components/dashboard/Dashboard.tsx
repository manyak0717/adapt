import React from "react";
import { useAdapt } from "../../context/AdaptContext";
import { TaskInput } from "./TaskInput";
import {
  Stethoscope,
  Bus,
  Plane,
  FileCheck,
  CreditCard,
  ShoppingBag,
  Sparkles,
} from "lucide-react";

export const Dashboard: React.FC = () => {
  const { startTask, isLoading } = useAdapt();

  const suggestionCards = [
    {
      title: "Book a doctor's appointment",
      subtitle: "Find clinic, pick doctor & schedule time",
      icon: Stethoscope,
      accent: "text-blue-600 bg-blue-50",
    },
    {
      title: "Book a bus ticket",
      subtitle: "Select destination, departure & seats",
      icon: Bus,
      accent: "text-emerald-600 bg-emerald-50",
    },
    {
      title: "Make a bank transfer",
      subtitle: "Send funds securely to a saved recipient",
      icon: CreditCard,
      accent: "text-purple-600 bg-purple-50",
    },
    {
      title: "Apply for a government service",
      subtitle: "Renew documents and submit verification",
      icon: FileCheck,
      accent: "text-amber-600 bg-amber-50",
    },
    {
      title: "Book a flight",
      subtitle: "Explore domestic routes and flight times",
      icon: Plane,
      accent: "text-indigo-600 bg-indigo-50",
    },
    {
      title: "Buy something online",
      subtitle: "Pick products, verify address and checkout",
      icon: ShoppingBag,
      accent: "text-rose-600 bg-rose-50",
    },
  ];

  const handleSuggestionClick = (title: string) => {
    startTask(title, "text");
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-14">
      {/* Hero Header */}
      <section className="text-center mb-10 sm:mb-12">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#635BFF]/10 text-[#635BFF] text-xs font-semibold uppercase tracking-wider mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Intelligent Assistive Guidance</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-bold text-[#111827] tracking-tight mb-4">
          What would you like to do?
        </h1>
        <p className="text-lg sm:text-xl text-[#64748B] max-w-xl mx-auto leading-relaxed">
          Tell us your goal in your own words. We'll guide you through it step by step, adapting to your pace.
        </p>
      </section>

      {/* Main Input Area */}
      <section className="mb-12 sm:mb-14">
        <TaskInput onSubmit={(prompt, mode) => startTask(prompt, mode)} isLoading={isLoading} />
      </section>

      {/* Suggested Tasks */}
      <section className="mb-14 sm:mb-16">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold text-[#64748B] uppercase tracking-wider">
            Popular everyday tasks
          </h2>
          <span className="text-xs text-[#64748B]">Click any task to start</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {suggestionCards.map((item) => {
            const IconComponent = item.icon;
            return (
              <button
                key={item.title}
                onClick={() => handleSuggestionClick(item.title)}
                className="flex items-start gap-4 p-5 rounded-2xl bg-white border border-[#E5E7EB] hover:border-[#635BFF]/50 hover:shadow-md hover:-translate-y-0.5 transition-all text-left group cursor-pointer focus-visible:ring-4"
              >
                <div className={`p-3 rounded-xl ${item.accent} transition-transform group-hover:scale-110`}>
                  <IconComponent className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-base text-[#111827] group-hover:text-[#635BFF] transition-colors leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#64748B] mt-1 line-clamp-1">{item.subtitle}</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* How ADAPT Works Section */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5E7EB] shadow-xs">
        <h2 className="text-lg font-bold text-[#111827] mb-6 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#14B8A6]"></span>
          How ADAPT works
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-[#635BFF]/10 text-[#635BFF] flex items-center justify-center font-bold text-sm shrink-0">
              1
            </div>
            <div>
              <h3 className="font-semibold text-sm text-[#111827] mb-1">Tell us your goal</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Type or speak whatever task you need done in simple language.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-[#14B8A6]/10 text-[#14B8A6] flex items-center justify-center font-bold text-sm shrink-0">
              2
            </div>
            <div>
              <h3 className="font-semibold text-sm text-[#111827] mb-1">We break it into steps</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Complex digital workflows are structured into clear, manageable actions.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-[#16A34A]/10 text-[#16A34A] flex items-center justify-center font-bold text-sm shrink-0">
              3
            </div>
            <div>
              <h3 className="font-semibold text-sm text-[#111827] mb-1">We adapt to you</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                As you interact, ADAPT adjusts text, buttons, and audio to make things easier.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
