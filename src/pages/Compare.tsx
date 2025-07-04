
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { GitCompare, FileText, ArrowRight, Zap, MessageSquare, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { supabase, Document } from '@/lib/supabase';
import ChatSection from '@/components/ChatSection';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const Compare = () => {
  const [selectedDocA, setSelectedDocA] = useState<string>('');
  const [selectedDocB, setSelectedDocB] = useState<string>('');
  const [isComparing, setIsComparing] = useState(false);
  const [documentsProcessed, setDocumentsProcessed] = useState(false);
  const isMobile = useIsMobile();
  const { user } = useAuth();

  // Fetch documents
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['documents', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Document[];
    },
    enabled: !!user?.id,
  });

  const handleCompare = async () => {
    if (!selectedDocA || !selectedDocB) {
      toast({
        title: "Selection required",
        description: "Please select two documents to compare.",
        variant: "destructive",
      });
      return;
    }

    if (selectedDocA === selectedDocB) {
      toast({
        title: "Different documents required",
        description: "Please select two different documents to compare.",
        variant: "destructive",
      });
      return;
    }

    const docA = documents.find(d => d.id === selectedDocA);
    const docB = documents.find(d => d.id === selectedDocB);

    if (!docA || !docB) return;

    setIsComparing(true);
    try {
      console.log('Sending PDFs to vector workflow...');
      const vectorResponse = await fetch('https://lawassistant1.app.n8n.cloud/webhook/pdf-to-vector', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file1_url: docA.original_url,
          file2_url: docB.original_url,
        }),
      });

      if (!vectorResponse.ok) {
        throw new Error('Failed to process documents in vector workflow');
      }

      const vectorResult = await vectorResponse.json();
      console.log('Vector workflow response:', vectorResult);

      if (vectorResult.error_count && vectorResult.error_count > 0) {
        console.error('Vector workflow errors:', vectorResult.errors);
        throw new Error(`Vector processing failed with ${vectorResult.error_count} error(s): ${vectorResult.errors?.join(', ')}`);
      }

      setDocumentsProcessed(true);
      
      toast({
        title: "Documents processed successfully",
        description: "You can now chat about the documents and their differences.",
      });
    } catch (error) {
      console.error('Document processing error:', error);
      
      toast({
        title: "Processing failed",
        description: error instanceof Error ? error.message : "An error occurred while processing documents.",
        variant: "destructive",
      });
      
      setDocumentsProcessed(false);
    } finally {
      setIsComparing(false);
    }
  };

  const getDocumentName = (id: string) => {
    const doc = documents.find(d => d.id === id);
    return doc ? doc.name : '';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-red-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Simple Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-green-600 rounded-xl mb-4">
            <GitCompare className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Compare Documents</h1>
          <p className="text-gray-600">Select two documents to analyze their differences</p>
        </div>

        {documents.length < 2 ? (
          <Card className="border-0 shadow-lg bg-white p-8 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Need More Documents</h3>
            <p className="text-gray-600 mb-6">
              You need at least 2 documents to compare. Upload more documents to get started.
            </p>
            <Button
              onClick={() => window.location.href = '/documents'}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <FileText className="h-4 w-4 mr-2" />
              Upload Documents
            </Button>
          </Card>
        ) : (
          <div className={cn(
            "gap-6",
            isMobile ? "space-y-6" : "grid grid-cols-1 lg:grid-cols-2"
          )}>
            {/* Left Column - Document Selection */}
            <div className="space-y-6">
              {/* Document Selection */}
              <Card className="border-0 shadow-lg bg-white p-6">
                <div className={cn(
                  "items-center",
                  isMobile ? "space-y-4" : "grid grid-cols-3 gap-4"
                )}>
                  <div>
                    <Select value={selectedDocA} onValueChange={setSelectedDocA}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="First document" />
                      </SelectTrigger>
                      <SelectContent>
                        {documents.map((doc) => (
                          <SelectItem key={doc.id} value={doc.id}>
                            {doc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-center">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      {isMobile ? (
                        <ArrowDown className="h-4 w-4 text-gray-600" />
                      ) : (
                        <ArrowRight className="h-4 w-4 text-gray-600" />
                      )}
                    </div>
                  </div>

                  <div>
                    <Select value={selectedDocB} onValueChange={setSelectedDocB}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Second document" />
                      </SelectTrigger>
                      <SelectContent>
                        {documents.map((doc) => (
                          <SelectItem key={doc.id} value={doc.id}>
                            {doc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="text-center mt-6">
                  <Button
                    onClick={handleCompare}
                    disabled={!selectedDocA || !selectedDocB || isComparing}
                    size="lg"
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isComparing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 mr-2" />
                        Compare Documents
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            </div>

            {/* Right Column - Chat Section (Always Visible) */}
            <div className="space-y-6">
              <Card className="border-0 shadow-lg bg-white overflow-hidden">
                <div className="p-4 border-b bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <MessageSquare className="h-5 w-5 text-green-600" />
                    <div>
                      <h3 className="font-semibold text-gray-900">AI Comparison Assistant</h3>
                      <p className="text-sm text-gray-600">
                        {documentsProcessed 
                          ? "Ask questions about your document comparison" 
                          : "Process documents to start asking questions"
                        }
                      </p>
                    </div>
                  </div>
                </div>
                <div className={cn(isMobile ? "h-[500px]" : "h-[600px]")}>
                  <ChatSection
                    selectedDocA={selectedDocA}
                    selectedDocB={selectedDocB}
                    getDocumentName={getDocumentName}
                    documentsProcessed={documentsProcessed}
                  />
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Compare;
