'use client';

import { Search } from 'lucide-react';
import { useState } from 'react';

interface SearchInputProps {
   onSearch: (value: string) => void;
   placeholder: string;
   className?: string;
   initialValue?: string;
   heightClassName?: string;
}

// 검색창 공용 컴포넌트
export default function SearchInput({
   onSearch,
   placeholder,
   className = 'w-64',
   initialValue = '',
   heightClassName = 'h-10',
}: SearchInputProps) {
   const [inputValue, setInputValue] = useState(initialValue);

   const handleSubmit = () => {
      onSearch(inputValue.trim());
   };

   return (
      <div className={`relative ${className}`}>
         <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
               if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  handleSubmit();
               }
            }}
            placeholder={placeholder}
            className={`${heightClassName} w-full rounded-xs border border-gray-200 bg-white pl-5 pr-11 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-gray-400`}
         />
         <button
            type="button"
            onClick={handleSubmit}
            aria-label="검색"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-xs p-1.5 text-gray-400 transition-colors hover:bg-brand-sage hover:text-white active:bg-brand-sage active:text-white"
         >
            <Search size={18} />
         </button>
      </div>
   );
}
