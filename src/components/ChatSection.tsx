
import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

interface ChatSectionProps {
  selectedDocA: string;
  selectedDocB: string;
  getDocumentName: (id: string) => string;
  documentsProcessed: boolean;
}

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'error';
  content: string;
  timestamp: Date;
}

const ChatSection = ({ selectedDocA, selectedDocB, getDocumentName, documentsProcessed }: ChatSectionProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const renderContent = (content: string) => {
    return content.split('\n').map((line, index) => {
      if (line.trim() === '') {
        return <br key={index} />;
      }
      
      // Handle markdown formatting
      let processedLine = line;
      
      // Replace **text** with <strong>text</strong> for bold
      processedLine = processedLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      
      // Handle bullet points and list items
      if (line.trim().startsWith('- ')) {
        processedLine = `<div style="margin-left: 16px; margin-bottom: 4px;">• ${processedLine.replace(/^- /, '')}</div>`;
      }
      
      // Handle section headers (lines that end with colon)
      if (line.trim().endsWith(':') && !line.includes('**')) {
        processedLine = `<div style="font-weight: 600; margin-top: 12px; margin-bottom: 8px; color: #1e293b;">${processedLine}</div>`;
      }
      
      return (
        <div key={index} dangerouslySetInnerHTML={{ __html: processedLine }} />
      );
    });
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading || !documentsProcessed) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      console.log('Sending query to compare documents edge function...');
      console.log('Query:', userMessage.content);
      
      const { data, error } = await supabase.functions.invoke('compare-documents', {
        body: {
          user_prompt: userMessage.content,
        },
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(`Edge function error: ${error.message}`);
      }

      console.log('Edge function response:', data);

      // Extract the output content from the response structure
      const responseContent = data.output || 'I apologize, but I received an empty response. Please try rephrasing your question.';

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: responseContent,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error details:', error);
      
      // More detailed error handling
      let errorMessage = 'I apologize, but I encountered an error while processing your request.';
      
      if (error instanceof Error) {
        errorMessage = `Service error: ${error.message}. Please try again later.`;
      }

      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        type: 'error',
        content: errorMessage,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMsg]);
      
      toast({
        title: "Chat Error",
        description: "There was an issue connecting to the chat service. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!documentsProcessed) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto">
            <Bot className="h-6 w-6 sm:h-8 sm:w-8 text-slate-400" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-medium text-slate-900 mb-1">Ready to Chat</h3>
            <p className="text-sm text-slate-600 max-w-sm mx-auto">
              Process your documents first to start asking questions about their comparison.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto">
                <Bot className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-medium text-slate-900 mb-1">Start Your Analysis</h3>
                <p className="text-sm text-slate-600 max-w-sm mx-auto leading-relaxed">
                  Ask me anything about the differences, similarities, or specific aspects of your documents.
                </p>
              </div>
              {selectedDocA && selectedDocB && (
                <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-600 mb-1">Comparing:</p>
                  <div className="space-y-1 text-xs">
                    <div className="font-medium text-slate-800 truncate">{getDocumentName(selectedDocA)}</div>
                    <div className="text-slate-400">vs</div>
                    <div className="font-medium text-slate-800 truncate">{getDocumentName(selectedDocB)}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3 animate-fade-in",
                message.type === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {(message.type === 'assistant' || message.type === 'error') && (
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1",
                  message.type === 'error' 
                    ? "bg-red-500" 
                    : "bg-gradient-to-br from-blue-500 to-purple-600"
                )}>
                  {message.type === 'error' ? (
                    <AlertCircle className="h-4 w-4 text-white" />
                  ) : (
                    <Bot className="h-4 w-4 text-white" />
                  )}
                </div>
              )}
              <Card
                className={cn(
                  "max-w-[85%] sm:max-w-[75%] p-3 sm:p-4 shadow-sm transition-all duration-200 hover:shadow-md",
                  message.type === 'user'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white border-0'
                    : message.type === 'error'
                    ? 'bg-red-50 border border-red-200'
                    : 'bg-white border border-slate-200/50'
                )}
              >
                <div className={cn(
                  "text-sm leading-relaxed space-y-2",
                  message.type === 'user' 
                    ? 'text-white' 
                    : message.type === 'error'
                    ? 'text-red-800'
                    : 'text-slate-800'
                )}>
                  {renderContent(message.content)}
                </div>
                <div className={cn(
                  "text-xs mt-2 opacity-70",
                  message.type === 'user' 
                    ? 'text-blue-100' 
                    : message.type === 'error'
                    ? 'text-red-600'
                    : 'text-slate-500'
                )}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </Card>
              {message.type === 'user' && (
                <div className="w-8 h-8 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <User className="h-4 w-4 text-white" />
                </div>
              )}
            </div>
          ))
        )}
        
        {isLoading && (
          <div className="flex gap-3 animate-fade-in">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <Card className="bg-white border border-slate-200/50 p-4 shadow-sm">
              <div className="flex items-center space-x-2 text-slate-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Analyzing documents...</span>
              </div>
            </Card>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-slate-200/50 p-4 sm:p-6 bg-white/50">
        <div className="flex gap-2 sm:gap-3">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about document differences, similarities..."
            className="flex-1 bg-white/80 border-slate-200 focus:border-blue-300 transition-colors text-sm sm:text-base h-10 sm:h-11"
            disabled={isLoading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            size={isMobile ? "sm" : "default"}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg transition-all duration-200 hover:scale-105 disabled:hover:scale-100 px-3 sm:px-4"
          >
            <Send className="h-4 w-4" />
            {!isMobile && <span className="ml-2">Send</span>}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatSection;
