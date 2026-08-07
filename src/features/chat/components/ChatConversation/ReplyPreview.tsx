import { X } from 'lucide-react';

interface ReplyPreviewProps {
   senderName: string;
   content: string;
   onCancel: () => void;
}

export default function ReplyPreview({ senderName, content, onCancel }: ReplyPreviewProps) {
   return (
      <div className="flex items-center justify-between gap-2 border-t border-gray-100 bg-gray-50 px-3 py-2">
         <div className="min-w-0 border-l-2 border-brand-green pl-2">
            <p className="text-xs font-medium text-gray-700">{senderName}</p>
            <p className="truncate text-xs text-gray-500">{content}</p>
         </div>
         <button
            type="button"
            onClick={onCancel}
            aria-label="답장 취소"
            className="shrink-0 cursor-pointer rounded-xs p-1 text-gray-400 hover:bg-gray-200"
         >
            <X size={14} />
         </button>
      </div>
   );
}
