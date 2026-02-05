 import { useState } from "react";
 import { MessageCircle, X, Send, Sparkles } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { cn } from "@/lib/utils";
 
 export function GenieChat() {
   const [isOpen, setIsOpen] = useState(false);
   const [message, setMessage] = useState("");
 
   return (
     <>
       {/* Chat Window */}
       <div
         className={cn(
           "fixed bottom-20 right-4 z-50 w-80 sm:w-96 transition-all duration-300 origin-bottom-right",
           isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0 pointer-events-none"
         )}
       >
         <div className="bg-card border rounded-xl shadow-2xl overflow-hidden flex flex-col h-[28rem]">
           {/* Header */}
           <div className="px-4 py-3 border-b bg-primary/5 flex items-center justify-between">
             <div className="flex items-center gap-2">
               <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                 <Sparkles className="w-4 h-4 text-primary" />
               </div>
               <div>
                 <h3 className="font-semibold text-sm">Genie</h3>
                 <p className="text-xs text-muted-foreground">AI Assistant</p>
               </div>
             </div>
             <Button
               variant="ghost"
               size="icon"
               className="h-8 w-8"
               onClick={() => setIsOpen(false)}
             >
               <X className="w-4 h-4" />
             </Button>
           </div>
 
           {/* Messages Area */}
           <div className="flex-1 overflow-auto p-4 space-y-4">
             {/* Welcome message */}
             <div className="flex gap-3">
               <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                 <Sparkles className="w-4 h-4 text-primary" />
               </div>
               <div className="bg-muted rounded-lg rounded-tl-none px-3 py-2 text-sm">
                 <p>Hi! I'm <strong>Genie</strong>, your AI assistant. 🧞</p>
                 <p className="mt-1 text-muted-foreground">
                   I'm here to help you with your data. This is a placeholder - AI functionality coming soon!
                 </p>
               </div>
             </div>
           </div>
 
           {/* Input Area */}
           <div className="p-3 border-t bg-muted/30">
             <form
               onSubmit={(e) => {
                 e.preventDefault();
                 setMessage("");
               }}
               className="flex gap-2"
             >
               <Input
                 value={message}
                 onChange={(e) => setMessage(e.target.value)}
                 placeholder="Ask Genie anything..."
                 className="flex-1 text-sm"
                 disabled
               />
               <Button type="submit" size="icon" disabled>
                 <Send className="w-4 h-4" />
               </Button>
             </form>
             <p className="text-xs text-muted-foreground text-center mt-2">
               Coming soon
             </p>
           </div>
         </div>
       </div>
 
       {/* Floating Button */}
       <Button
         onClick={() => setIsOpen(!isOpen)}
         className={cn(
           "fixed bottom-4 right-4 z-50 h-14 w-14 rounded-full shadow-lg transition-all duration-300",
           "bg-primary hover:bg-primary/90 text-primary-foreground",
           isOpen && "rotate-90"
         )}
         size="icon"
       >
         {isOpen ? (
           <X className="w-6 h-6" />
         ) : (
           <MessageCircle className="w-6 h-6" />
         )}
       </Button>
     </>
   );
 }