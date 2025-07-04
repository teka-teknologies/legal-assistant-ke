import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { convertDocumentToText, getSupportedFileTypes, getFileTypeDescription } from '@/utils/documentConverter';
import { useAuth } from '@/contexts/AuthContext';

interface UploadProgress {
  step: string;
  progress: number;
}

interface DocumentUploadFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

const DocumentUploadForm = ({ onClose, onSuccess }: DocumentUploadFormProps) => {
  const [documentName, setDocumentName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const uploadMutation = useMutation({
    mutationFn: async ({ name, file }: { name: string; file: File }) => {
      if (!user?.id) {
        throw new Error('User must be logged in to upload documents');
      }

      console.log('Starting upload process for:', file.name);
      
      // Step 1: Convert document to text
      setUploadProgress({ step: 'Converting document to text...', progress: 20 });
      const conversionResult = await convertDocumentToText(file);
      
      if (!conversionResult.success) {
        throw new Error(conversionResult.error || 'Failed to convert document');
      }

      // Step 2: Upload original file
      setUploadProgress({ step: 'Uploading original document...', progress: 40 });
      const originalFileName = `originals/${Date.now()}-${file.name}`;
      
      const { data: originalUpload, error: originalError } = await supabase.storage
        .from('documents')
        .upload(originalFileName, file);

      if (originalError) throw originalError;

      // Step 3: Create and upload text file
      setUploadProgress({ step: 'Uploading converted text...', progress: 60 });
      const textBlob = new Blob([conversionResult.text], { type: 'text/plain' });
      const textFileName = `converted/${Date.now()}-${file.name.replace(/\.[^/.]+$/, '')}.txt`;
      
      const { data: textUpload, error: textError } = await supabase.storage
        .from('documents')
        .upload(textFileName, textBlob);

      if (textError) throw textError;

      // Step 4: Get public URLs
      setUploadProgress({ step: 'Finalizing upload...', progress: 80 });
      
      const { data: { publicUrl: originalUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(originalFileName);

      const { data: { publicUrl: textUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(textFileName);

      // Step 5: Save to database
      setUploadProgress({ step: 'Saving to database...', progress: 90 });
      
      const { data, error } = await supabase
        .from('documents')
        .insert({
          name,
          original_url: originalUrl,
          txt_url: textUrl,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      setUploadProgress({ step: 'Upload complete!', progress: 100 });
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast({
        title: "Upload successful",
        description: "Document has been processed and uploaded successfully.",
      });
      
      // Reset form
      setDocumentName('');
      setSelectedFile(null);
      setUploadProgress(null);
      
      // Call the onSuccess callback
      onSuccess();
    },
    onError: (error) => {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
      setUploadProgress(null);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) {
      toast({
        title: "Authentication required",
        description: "Please log in to upload documents.",
        variant: "destructive",
      });
      return;
    }
    
    if (!documentName.trim()) {
      toast({
        title: "Document name required",
        description: "Please enter a name for your document.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedFile) {
      toast({
        title: "File required",
        description: "Please select a PDF document to upload.",
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    if (!selectedFile.name.toLowerCase().endsWith('.pdf') && selectedFile.type !== 'application/pdf') {
      toast({
        title: "Invalid file type",
        description: "Please select a PDF document only.",
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate({ name: documentName.trim(), file: selectedFile });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      
      // Auto-populate document name if empty
      if (!documentName) {
        const nameWithoutExtension = file.name.replace(/\.[^/.]+$/, '');
        setDocumentName(nameWithoutExtension);
      }
    }
  };

  const isUploading = uploadMutation.isPending;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="text-center space-y-3 sm:space-y-4 px-4">
        <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/25 mb-3 sm:mb-4">
          <Upload className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-slate-900 to-blue-900 bg-clip-text text-transparent mb-2 sm:mb-3">
            Upload Document
          </h1>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Upload your PDF document for analysis and comparison.
          </p>
        </div>
      </div>

      {/* Back Button */}
      <div className="px-4 sm:px-0">
        <Button
          variant="outline"
          onClick={onClose}
          className="mb-6"
        >
          ← Back to Documents
        </Button>
      </div>

      {/* Upload Form */}
      <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm mx-4 sm:mx-0 p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="document-name">Document Name</Label>
            <Input
              id="document-name"
              type="text"
              value={documentName}
              onChange={(e) => setDocumentName(e.target.value)}
              placeholder="Enter document name..."
              disabled={isUploading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="document-file">Select PDF Document</Label>
            <Input
              id="document-file"
              type="file"
              accept={getSupportedFileTypes()}
              onChange={handleFileChange}
              disabled={isUploading}
              required
            />
            <p className="text-sm text-slate-500">
              Supported format: PDF only
            </p>
          </div>

          {selectedFile && (
            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-slate-600" />
                <span className="text-sm font-medium">{selectedFile.name}</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {getFileTypeDescription(selectedFile)} • {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          )}

          {uploadProgress && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                {uploadProgress.progress === 100 ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-blue-600 animate-pulse" />
                )}
                <span className="text-sm font-medium text-slate-700">
                  {uploadProgress.step}
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress.progress}%` }}
                />
              </div>
            </div>
          )}

          <Button
            type="submit"
            disabled={isUploading || !documentName.trim() || !selectedFile}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isUploading ? 'Processing...' : 'Upload PDF Document'}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default DocumentUploadForm;
