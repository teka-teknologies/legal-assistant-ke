
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Upload, Eye, Trash2, Download, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { supabase, Document } from '@/lib/supabase';
import DocumentUploadForm from '@/components/DocumentUploadForm';
import DocumentPreview from '@/components/DocumentPreview';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const Documents = () => {
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const isMobile = useIsMobile();
  const { user } = useAuth();

  const { data: documents = [], isLoading, refetch } = useQuery({
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

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete document.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Document deleted successfully.",
      });
      refetch();
    }
  };

  const filteredDocuments = documents.filter(doc =>
    doc.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (selectedDocument) {
    return (
      <DocumentPreview
        isOpen={true}
        document={selectedDocument}
        onClose={() => setSelectedDocument(null)}
      />
    );
  }

  if (showUploadForm) {
    return (
      <DocumentUploadForm
        onClose={() => setShowUploadForm(false)}
        onSuccess={() => {
          setShowUploadForm(false);
          refetch();
        }}
      />
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="text-center space-y-3 sm:space-y-4 px-4">
        <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-red-600 to-green-600 rounded-2xl shadow-lg shadow-red-600/25 mb-3 sm:mb-4">
          <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-4xl font-bold kenyan-gradient-text mb-2 sm:mb-3">
            Document Library
          </h1>
          <p className="text-base sm:text-lg text-black max-w-2xl mx-auto leading-relaxed">
            Upload, manage and organize your legal documents for analysis and comparison.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 px-4 sm:px-0">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-black/60" />
          <Input
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white/80 border-black/20 focus:border-green-600 transition-colors h-11"
          />
        </div>
        <Button
          onClick={() => setShowUploadForm(true)}
          size={isMobile ? "default" : "lg"}
          className="bg-gradient-to-r from-green-600 to-red-600 hover:from-green-700 hover:to-red-700 text-white shadow-lg shadow-green-600/25 transition-all duration-200 hover:scale-105 w-full sm:w-auto"
        >
          <Upload className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
          Upload Document
        </Button>
      </div>

      {/* Documents Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm mx-4 sm:mx-0">
          <div className="p-8 sm:p-12 text-center space-y-4 sm:space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-green-50 rounded-3xl">
              <FileText className="h-8 w-8 sm:h-10 sm:w-10 text-green-600" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg sm:text-xl font-semibold text-black">
                {searchTerm ? 'No documents found' : 'No documents yet'}
              </h3>
              <p className="text-black/70 max-w-md mx-auto text-sm sm:text-base">
                {searchTerm 
                  ? 'Try adjusting your search terms or upload new documents.'
                  : 'Upload your first document to get started with analysis and comparison.'
                }
              </p>
            </div>
            {!searchTerm && (
              <Button
                onClick={() => setShowUploadForm(true)}
                size={isMobile ? "default" : "lg"}
                className="bg-gradient-to-r from-green-600 to-red-600 hover:from-green-700 hover:to-red-700 text-white shadow-lg shadow-green-600/25 transition-all duration-200 hover:scale-105 w-full sm:w-auto"
              >
                <Upload className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                Upload Your First Document
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className={cn(
          "gap-4 sm:gap-6 px-4 sm:px-0",
          isMobile ? "space-y-4" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
        )}>
          {filteredDocuments.map((document) => (
            <Card 
              key={document.id}
              className="border-0 shadow-lg bg-white/70 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02] group"
            >
              <div className="p-4 sm:p-6 space-y-4">
                {/* Document Icon & Name */}
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-50 to-red-50 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                    <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-black text-sm sm:text-base truncate mb-1">
                      {document.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-black/60">
                      {new Date(document.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedDocument(document)}
                    className="flex-1 bg-white/50 border-black/20 hover:bg-green-50 hover:border-green-600 hover:text-green-700 transition-colors"
                  >
                    <Eye className="h-4 w-4 mr-1 sm:mr-2" />
                    <span className="text-xs sm:text-sm">View</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(document.original_url, '_blank')}
                    className="bg-white/50 border-black/20 hover:bg-green-50 hover:border-green-600 hover:text-green-700 transition-colors px-2 sm:px-3"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(document.id)}
                    className="bg-white/50 border-black/20 hover:bg-red-50 hover:border-red-600 hover:text-red-600 transition-colors px-2 sm:px-3"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Documents;
