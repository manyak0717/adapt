import React from "react";
import { AdaptProvider, useAdapt } from "./context/AdaptContext";
import { Header } from "./components/layout/Header";
import { DemoToolbar } from "./components/layout/DemoToolbar";
import { Dashboard } from "./components/dashboard/Dashboard";
import { TaskProcessing } from "./components/processing/TaskProcessing";
import { TaskOverview } from "./components/overview/TaskOverview";
import { StepScreen } from "./components/step/StepScreen";
import { CompletionScreen } from "./components/completion/CompletionScreen";
import { ProfileModal } from "./components/profile/ProfileModal";

const AppContent: React.FC = () => {
  const { screen } = useAdapt();

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F8FC] text-[#111827] selection:bg-[#635BFF]/20 selection:text-[#635BFF]">
      {/* Universal accessible Header */}
      <Header />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col justify-center">
        {screen === "dashboard" && <Dashboard />}
        {screen === "understanding" && <TaskProcessing />}
        {screen === "overview" && <TaskOverview />}
        {screen === "step" && <StepScreen />}
        {screen === "completion" && <CompletionScreen />}
      </main>

      {/* Profile & Telemetry Modal */}
      <ProfileModal />

      {/* Hackathon Judge Demo Toolbar */}
      <DemoToolbar />

      {/* Subtle Footer */}
      <footer className="py-6 text-center text-xs text-[#64748B] border-t border-[#E5E7EB]/60">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>ADAPT • AI-Powered Accessibility Assistant</span>
          <span className="text-[11px]">Designed for Apple-level simplicity & calm intelligence</span>
        </div>
      </footer>
    </div>
  );
};

export function App() {
  return (
    <AdaptProvider>
      <AppContent />
    </AdaptProvider>
  );
}

export default App;
