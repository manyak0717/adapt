import React from "react";
import { Delete, CornerDownLeft } from "lucide-react";

interface SimpleKeyboardProps {
  onChar: (char: string) => void;
  onBackspace: () => void;
  onSpace: () => void;
  onSubmit: () => void;
}

export const SimpleKeyboard: React.FC<SimpleKeyboardProps> = ({
  onChar,
  onBackspace,
  onSpace,
  onSubmit,
}) => {
  const numbers = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];
  const alphabet = [
    "A", "B", "C", "D", "E", "F", "G",
    "H", "I", "J", "K", "L", "M", "N",
    "O", "P", "Q", "R", "S", "T", "U",
    "V", "W", "X", "Y", "Z",
  ];

  return (
    <div className="flex flex-col gap-3 p-3 max-w-2xl mx-auto select-none" role="group" aria-label="Simplified On-screen Keyboard with Large Buttons">
      {/* Numbers */}
      <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
        {numbers.map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => onChar(num)}
            className="h-14 sm:h-16 rounded-2xl bg-white hover:bg-[#F7F8FC] active:bg-[#E5E7EB] border-2 border-[#E5E7EB] text-xl font-bold text-[#111827] shadow-sm transition-transform active:scale-95 cursor-pointer focus-visible:ring-4"
          >
            {num}
          </button>
        ))}
      </div>

      {/* Alphabet grid */}
      <div className="grid grid-cols-5 sm:grid-cols-7 gap-2">
        {alphabet.map((char) => (
          <button
            key={char}
            type="button"
            onClick={() => onChar(char)}
            className="h-14 sm:h-16 rounded-2xl bg-white hover:bg-[#635BFF]/5 active:bg-[#635BFF]/15 border-2 border-[#E5E7EB] hover:border-[#635BFF]/50 text-xl font-bold text-[#111827] shadow-sm transition-transform active:scale-95 cursor-pointer focus-visible:ring-4"
          >
            {char}
          </button>
        ))}
        {/* Backspace inside grid */}
        <button
          type="button"
          onClick={onBackspace}
          className="col-span-2 sm:col-span-2 h-14 sm:h-16 rounded-2xl bg-red-50 hover:bg-red-100 active:bg-red-200 border-2 border-red-200 text-red-700 font-bold flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer focus-visible:ring-4"
          aria-label="Delete character"
        >
          <Delete className="w-6 h-6" />
          <span className="text-base">Delete</span>
        </button>
      </div>

      {/* Space & Done Action Row */}
      <div className="flex gap-3 mt-1">
        <button
          type="button"
          onClick={onSpace}
          className="flex-3 h-16 rounded-2xl bg-white hover:bg-[#F7F8FC] active:bg-gray-100 border-2 border-[#E5E7EB] text-lg font-bold text-[#64748B] shadow-sm transition-transform active:scale-98 cursor-pointer flex items-center justify-center focus-visible:ring-4"
        >
          SPACE
        </button>
        <button
          type="button"
          onClick={onSubmit}
          className="flex-2 h-16 rounded-2xl bg-[#635BFF] hover:bg-[#5046E5] text-white text-lg font-bold flex items-center justify-center gap-2 shadow-md transition-transform active:scale-95 cursor-pointer focus-visible:ring-4"
        >
          <span>DONE</span>
          <CornerDownLeft className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
