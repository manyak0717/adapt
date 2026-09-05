import React from "react";
import { Delete, CornerDownLeft } from "lucide-react";

interface NormalKeyboardProps {
  onChar: (char: string) => void;
  onBackspace: () => void;
  onSpace: () => void;
  onSubmit: () => void;
}

export const NormalKeyboard: React.FC<NormalKeyboardProps> = ({
  onChar,
  onBackspace,
  onSpace,
  onSubmit,
}) => {
  const row1 = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];
  const row2 = ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"];
  const row3 = ["A", "S", "D", "F", "G", "H", "J", "K", "L"];
  const row4 = ["Z", "X", "C", "V", "B", "N", "M"];

  return (
    <div className="flex flex-col gap-2 p-2 max-w-2xl mx-auto select-none" role="group" aria-label="On-screen QWERTY Keyboard">
      {/* Numbers */}
      <div className="flex gap-1.5 justify-center">
        {row1.map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => onChar(num)}
            className="flex-1 min-w-[30px] h-12 rounded-xl bg-white hover:bg-[#F7F8FC] active:bg-[#E5E7EB] border border-[#E5E7EB] text-sm font-semibold text-[#111827] shadow-sm transition-colors cursor-pointer"
          >
            {num}
          </button>
        ))}
      </div>

      {/* Row 2 */}
      <div className="flex gap-1.5 justify-center">
        {row2.map((char) => (
          <button
            key={char}
            type="button"
            onClick={() => onChar(char)}
            className="flex-1 min-w-[30px] h-12 rounded-xl bg-white hover:bg-[#F7F8FC] active:bg-[#E5E7EB] border border-[#E5E7EB] text-sm font-semibold text-[#111827] shadow-sm transition-colors cursor-pointer"
          >
            {char}
          </button>
        ))}
      </div>

      {/* Row 3 */}
      <div className="flex gap-1.5 justify-center px-3">
        {row3.map((char) => (
          <button
            key={char}
            type="button"
            onClick={() => onChar(char)}
            className="flex-1 min-w-[30px] h-12 rounded-xl bg-white hover:bg-[#F7F8FC] active:bg-[#E5E7EB] border border-[#E5E7EB] text-sm font-semibold text-[#111827] shadow-sm transition-colors cursor-pointer"
          >
            {char}
          </button>
        ))}
      </div>

      {/* Row 4 */}
      <div className="flex gap-1.5 justify-center">
        {row4.map((char) => (
          <button
            key={char}
            type="button"
            onClick={() => onChar(char)}
            className="flex-1 min-w-[30px] h-12 rounded-xl bg-white hover:bg-[#F7F8FC] active:bg-[#E5E7EB] border border-[#E5E7EB] text-sm font-semibold text-[#111827] shadow-sm transition-colors cursor-pointer"
          >
            {char}
          </button>
        ))}
        <button
          type="button"
          onClick={onBackspace}
          className="flex-1 min-w-[50px] h-12 rounded-xl bg-[#F7F8FC] hover:bg-gray-200 active:bg-gray-300 border border-[#E5E7EB] text-sm font-semibold text-[#111827] flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Backspace"
        >
          <Delete className="w-5 h-5" />
        </button>
      </div>

      {/* Space & Submit row */}
      <div className="flex gap-2 justify-center mt-1">
        <button
          type="button"
          onClick={onSpace}
          className="flex-3 h-12 rounded-xl bg-white hover:bg-[#F7F8FC] active:bg-[#E5E7EB] border border-[#E5E7EB] text-sm font-semibold text-[#64748B] shadow-sm transition-colors cursor-pointer"
        >
          Space
        </button>
        <button
          type="button"
          onClick={onSubmit}
          className="flex-1 h-12 rounded-xl bg-[#635BFF] hover:bg-[#5046E5] text-white text-sm font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
        >
          <span>Done</span>
          <CornerDownLeft className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
