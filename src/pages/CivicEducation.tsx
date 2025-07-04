
import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, AlertCircle, GraduationCap, Languages, FileText, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'error';
  content: string;
  timestamp: Date;
  englishContent?: string;
  swahiliContent?: string;
}

const CivicEducation = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<'english' | 'swahili'>('english');
  const [activeTab, setActiveTab] = useState('finance-bill');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

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
      if (activeTab === 'constitution') {
        // For constitution tab, show coming soon message
        const comingSoonMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: selectedLanguage === 'english' 
            ? "The Constitution section is coming soon! We're working hard to bring you comprehensive information about Kenya's Constitution. For now, you can explore the Finance Bill section."
            : "Sehemu ya Katiba inakuja hivi karibuni! Tunafanya kazi kwa bidii kukuletea maelezo ya kina kuhusu Katiba ya Kenya. Kwa sasa, unaweza kuchunguza sehemu ya Mswada wa Fedha.",
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, comingSoonMessage]);
        setIsLoading(false);
        return;
      }

      // Finance Bill logic (existing code)
      console.log('Sending query to finance bill chat workflow...');
      console.log('Query:', userMessage.content);
      
      const url = new URL('https://financebill.app.n8n.cloud/webhook/67f5821e-2f06-4339-8517-93b9dbac9ecb');
      url.searchParams.append('user_prompt', userMessage.content);
      
      console.log('Endpoint URL:', url.toString());
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Finance bill chat workflow response:', result);

      // ... keep existing code (response handling logic)
      let responseContent = 'I apologize, but I received an empty response. Please try rephrasing your question.';
      let englishContent = '';
      let swahiliContent = '';
      
      if (result.success && result.data && result.data.answer) {
        englishContent = result.data.answer.english || '';
        swahiliContent = result.data.answer.swahili || '';
        
        responseContent = selectedLanguage === 'english' ? englishContent : swahiliContent;
        
        if (result.data.markdown && result.data.markdown.formatted) {
          const formattedContent = result.data.markdown.formatted;
          if (formattedContent.includes('## English') && formattedContent.includes('## Swahili')) {
            const sections = formattedContent.split('## ');
            const englishSection = sections.find(s => s.startsWith('English'))?.replace('English\n', '').trim();
            const swahiliSection = sections.find(s => s.startsWith('Swahili'))?.replace('Swahili\n', '').trim();
            
            if (englishSection) englishContent = englishSection;
            if (swahiliSection) swahiliContent = swahiliSection;
            
            responseContent = selectedLanguage === 'english' ? englishContent : swahiliContent;
          } else {
            responseContent = formattedContent;
            englishContent = formattedContent;
            swahiliContent = formattedContent;
          }
        }
      }
      else if (typeof result === 'string') {
        responseContent = result;
        if (selectedLanguage === 'swahili') {
          swahiliContent = result;
        } else {
          englishContent = result;
        }
      }
      else if (result && typeof result === 'object') {
        if (result.content) {
          responseContent = result.content;
        } else if (result.answer) {
          responseContent = result.answer;
        } else if (result.response) {
          responseContent = result.response;
        } else {
          responseContent = JSON.stringify(result, null, 2);
        }
        
        if (selectedLanguage === 'swahili') {
          swahiliContent = responseContent;
        } else {
          englishContent = responseContent;
        }
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: responseContent,
        englishContent,
        swahiliContent,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error details:', error);
      
      let errorMessage = 'I apologize, but I encountered an error while processing your request.';
      
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        errorMessage = 'Unable to connect to the chat service. This might be a temporary network issue or the service might be unavailable. Please try again in a few moments.';
      } else if (error instanceof Error) {
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

  const handleLanguageChange = (language: 'english' | 'swahili') => {
    setSelectedLanguage(language);
    
    setMessages(prev => prev.map(message => {
      if (message.type === 'assistant' && (message.englishContent || message.swahiliContent)) {
        return {
          ...message,
          content: language === 'english' ? message.englishContent || message.content : message.swahiliContent || message.content
        };
      }
      return message;
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setMessages([]); // Clear messages when switching tabs
  };

  const getSuggestedQuestions = () => {
    if (activeTab === 'finance-bill') {
      return [
        "What are the main changes in the Finance Bill 2024?",
        "How will the new tax policies affect ordinary citizens?",
        "What are the proposed changes to VAT rates?",
        "How does the Finance Bill impact small businesses?",
      ];
    } else {
      return [
        "What are the fundamental rights in the Constitution?",
        "How does the Constitution protect citizens?",
        "What are the three arms of government?",
        "What is devolution according to the Constitution?",
      ];
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    setInputValue(question);
  };

  const getEmptyStateContent = () => {
    if (activeTab === 'finance-bill') {
      return {
        title: "Learn About the Finance Bill",
        description: "Ask me anything about the Finance Bill, government policies, taxation, or civic education topics.",
        icon: <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
      };
    } else {
      return {
        title: "Constitution Coming Soon",
        description: "We're preparing comprehensive information about Kenya's Constitution. Stay tuned for updates!",
        icon: <Scale className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
      };
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="container mx-auto px-4 py-4 sm:py-6 flex-1 flex flex-col">
        {/* Header */}
        <div className="text-center space-y-3 mb-4">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-green-600 rounded-xl shadow-lg">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold kenyan-gradient-text mb-1">
              Civic Education Assistant
            </h1>
            <p className="text-sm text-black max-w-xl mx-auto">
              Learn about government policies and civic matters through AI-powered explanations.
            </p>
          </div>
        </div>

        {/* Language Selector */}
        <div className="flex justify-center mb-4">
          <div className="flex items-center space-x-3 bg-white rounded-lg p-3 shadow-lg border border-black/10">
            <Languages className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-black">Language:</span>
            <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-[140px] bg-white border-black/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="english">English</SelectItem>
                <SelectItem value="swahili">Swahili</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Enhanced Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2 bg-gray-50 border-2 border-gray-200 mb-6 p-1 rounded-xl h-14">
            <TabsTrigger 
              value="finance-bill" 
              className={cn(
                "flex items-center justify-center space-x-2 h-10 rounded-lg transition-all duration-300 font-medium text-sm sm:text-base",
                "data-[state=active]:bg-green-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:scale-105",
                "data-[state=inactive]:bg-transparent data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:bg-gray-100",
                "data-[state=inactive]:hover:text-gray-800 data-[state=inactive]:hover:scale-102"
              )}
            >
              <FileText className={cn("h-4 w-4", activeTab === 'finance-bill' ? "text-white" : "text-green-600")} />
              <span className="hidden sm:inline">Finance Bill</span>
              <span className="sm:hidden">Finance</span>
              {activeTab === 'finance-bill' && (
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-green-600 rounded-full"></div>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="constitution" 
              className={cn(
                "flex items-center justify-center space-x-2 h-10 rounded-lg transition-all duration-300 font-medium text-sm sm:text-base relative",
                "data-[state=active]:bg-yellow-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:scale-105",
                "data-[state=inactive]:bg-transparent data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:bg-gray-100",
                "data-[state=inactive]:hover:text-gray-800 data-[state=inactive]:hover:scale-102"
              )}
            >
              <Scale className={cn("h-4 w-4", activeTab === 'constitution' ? "text-white" : "text-yellow-600")} />
              <span className="hidden sm:inline">Constitution</span>
              <span className="sm:hidden">Constitution</span>
              <div className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">
                Soon
              </div>
              {activeTab === 'constitution' && (
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-yellow-500 rounded-full"></div>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="finance-bill" className="flex-1 flex flex-col mt-0">
            <Card className="border-0 shadow-xl bg-white overflow-hidden flex-1 flex flex-col">
              <div className="flex-1 flex flex-col min-h-0">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center space-y-6">
                      <div className="text-center space-y-3">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto">
                          {getEmptyStateContent().icon}
                        </div>
                        <div>
                          <h3 className="text-base sm:text-lg font-medium text-black mb-1">
                            {getEmptyStateContent().title}
                          </h3>
                          <p className="text-sm text-black/70 max-w-sm mx-auto leading-relaxed">
                            {getEmptyStateContent().description}
                          </p>
                        </div>
                      </div>
                      
                      {/* Suggested Questions */}
                      <div className="w-full max-w-2xl space-y-3">
                        <p className="text-xs font-medium text-black text-center">Try asking:</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {getSuggestedQuestions().map((question, index) => (
                            <button
                              key={index}
                              onClick={() => handleSuggestedQuestion(question)}
                              className="text-left p-3 text-xs bg-green-50 hover:bg-green-100 rounded-lg border border-green-200/50 hover:border-green-300 transition-all duration-200 hover:scale-[1.02]"
                            >
                              {question}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    // ... keep existing code (messages rendering logic)
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
                              ? "bg-red-600" 
                              : "bg-green-600"
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
                              ? 'bg-green-600 text-white border-0'
                              : message.type === 'error'
                              ? 'bg-red-50 border border-red-600'
                              : 'bg-white border border-black/20'
                          )}
                        >
                          <div className={cn(
                            "text-sm leading-relaxed",
                            message.type === 'user' 
                              ? 'text-white' 
                              : message.type === 'error'
                              ? 'text-red-600'
                              : 'text-black'
                          )}>
                            {message.type === 'assistant' ? (
                              <MarkdownRenderer content={message.content} />
                            ) : (
                              <div>{message.content}</div>
                            )}
                          </div>
                          <div className={cn(
                            "text-xs mt-2 opacity-70",
                            message.type === 'user' 
                              ? 'text-green-100' 
                              : message.type === 'error'
                              ? 'text-red-600'
                              : 'text-black/50'
                          )}>
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </Card>
                        {message.type === 'user' && (
                          <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                            <User className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </div>
                    ))
                  )}
                  
                  {isLoading && (
                    <div className="flex gap-3 animate-fade-in">
                      <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                      <Card className="bg-white border border-black/20 p-4 shadow-sm">
                        <div className="flex items-center space-x-2 text-black">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">Analyzing your question...</span>
                        </div>
                      </Card>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>

                {/* Input - Fixed at bottom */}
                <div className="border-t border-black/20 p-4 bg-white">
                  <div className="flex gap-2 sm:gap-3">
                    <Input
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={activeTab === 'finance-bill' 
                        ? "Ask about the Finance Bill, taxes, government policies..." 
                        : "Constitution section coming soon..."}
                      className="flex-1 bg-white border-black/20 focus:border-green-600 transition-colors text-sm sm:text-base h-10 sm:h-11"
                      disabled={isLoading || activeTab === 'constitution'}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!inputValue.trim() || isLoading || activeTab === 'constitution'}
                      size={isMobile ? "sm" : "default"}
                      className="bg-green-600 hover:bg-green-700 shadow-lg transition-all duration-200 hover:scale-105 disabled:hover:scale-100 px-3 sm:px-4"
                    >
                      <Send className="h-4 w-4" />
                      {!isMobile && <span className="ml-2">Send</span>}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="constitution" className="flex-1 flex flex-col mt-0">
            <Card className="border-0 shadow-xl bg-white overflow-hidden flex-1 flex flex-col">
              <div className="flex-1 flex flex-col min-h-0">
                {/* Constitution Coming Soon */}
                <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-6">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto">
                      <Scale className="h-8 w-8 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-black mb-2">Constitution Section</h3>
                      <p className="text-black/70 max-w-md mx-auto leading-relaxed mb-4">
                        We're working hard to bring you comprehensive information about Kenya's Constitution. 
                        This section will include detailed explanations of constitutional provisions, rights, and governance structures.
                      </p>
                      <div className="inline-flex items-center space-x-2 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                        <span className="text-sm font-medium text-yellow-800">Coming Soon</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm text-black/60 mb-4">In the meantime, explore the Finance Bill section:</p>
                    <Button 
                      onClick={() => handleTabChange('finance-bill')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Go to Finance Bill
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CivicEducation;
