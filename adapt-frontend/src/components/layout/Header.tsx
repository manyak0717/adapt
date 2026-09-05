import React from "react";
import { useAdapt } from "../../context/AdaptContext";
import { Sparkles, User, ArrowLeft } from "lucide-react";

export const Header: React.FC = () => {
  const { screen, resetToDashboard, setIsProfileOpen, userProfile } = useAdapt();

  return (
    <header className="sticky top-0 z-30 w-full bg-white/90 backdrop-blur-md border-b border-[#E5E7EB] transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
        {/* Left: Brand / Home */}
        <div className="flex items-center gap-3">
          {screen !== "dashboard" && (
            <button
              onClick={resetToDashboard}
              className="flex items-center gap-1.5 py-2 px-3 rounded-xl text-sm font-medium text-[#64748B] hover:text-[#111827] hover:bg-[#F7F8FC] border border-[#E5E7EB] transition-all cursor-pointer focus-visible:ring-2"
              aria-label="Return to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Home</span>
            </button>
          )}

          <button
            onClick={resetToDashboard}
            className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-none"
            aria-label="ADAPT Home"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#635BFF] to-[#14B8A6] flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-[#111827]">ADAPT</span>
                <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#635BFF]/10 text-[#635BFF]">
                  AI Assistant
                </span>
              </div>
              <p className="text-xs text-[#64748B] hidden md:block">
                Your simpler way to get things done.
              </p>
            </div>
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F7F8FC] border border-[#E5E7EB] text-xs text-[#64748B]">
            <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse"></span>
            <span>Adaptive Engine Live</span>
          </div>

          {/* Profile / Preferences Trigger */}
          <button
            onClick={() => setIsProfileOpen(true)}
            className="flex items-center gap-2 py-2 px-3.5 rounded-xl bg-[#F7F8FC] hover:bg-[#E5E7EB]/70 border border-[#E5E7EB] text-[#111827] font-medium text-sm transition-colors cursor-pointer focus-visible:ring-2"
            aria-label="Open User Profile and Preferences"
          >
            <div className="w-6 h-6 rounded-full bg-[#635BFF]/15 text-[#635BFF] flex items-center justify-center">
              <User className="w-3.5 h-3.5" />
            </div>
            <span className="hidden sm:inline font-medium text-xs">
              {userProfile?.user_id || "USER_1027"}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
