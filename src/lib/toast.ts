import { toast as sonnerToast } from 'sonner';

function splitBySentence(message: string) {
   return message.trim().replace(/([.!?])\s+/g, '$1\n');
}

export const toast = {
   success: (message: string) => sonnerToast.success(splitBySentence(message)),
   error: (message: string) => sonnerToast.error(splitBySentence(message)),
   warning: (message: string) => sonnerToast.warning(splitBySentence(message)),
   info: (message: string) => sonnerToast.info(splitBySentence(message)),
};
