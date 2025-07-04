
import { useState } from 'react';
import { Eye, FileText, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Document, Page, pdfjs } from 'react-pdf';

// Set up the worker for react-pdf using a more reliable method
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url,
).toString();

interface DocumentPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  document: {
    name: string;
    original_url: string;
    txt_url: string;
  } | null;
}

const DocumentPreview = ({ isOpen, onClose, document }: DocumentPreviewProps) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  if (!document) return null;

  const isPDF = document.original_url.toLowerCase().includes('.pdf');

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
    setError('');
    console.log(`PDF loaded successfully with ${numPages} pages`);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('Error loading PDF:', error);
    setLoading(false);
    setError('Failed to load PDF. The document may be corrupted or inaccessible.');
  };

  const goToPreviousPage = () => {
    setPageNumber(prev => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setPageNumber(prev => Math.min(prev + 1, numPages));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Eye className="h-5 w-5" />
            <span>Preview: {document.name}</span>
          </DialogTitle>
          <DialogDescription>
            {isPDF ? 'PDF document preview with navigation' : 'Document preview'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 flex flex-col">
          {isPDF ? (
            <>
              {/* PDF Navigation Controls */}
              {numPages > 0 && !error && (
                <div className="flex items-center justify-between p-3 border-b bg-slate-50">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToPreviousPage}
                    disabled={pageNumber <= 1}
                    className="flex items-center space-x-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Previous</span>
                  </Button>
                  
                  <span className="text-sm text-slate-600 font-medium">
                    Page {pageNumber} of {numPages}
                  </span>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToNextPage}
                    disabled={pageNumber >= numPages}
                    className="flex items-center space-x-1"
                  >
                    <span>Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* PDF Viewer */}
              <div className="flex-1 overflow-auto bg-slate-100 p-4">
                <div className="flex justify-center">
                  {loading && !error && (
                    <div className="flex items-center justify-center h-64">
                      <div className="text-slate-600">Loading PDF...</div>
                    </div>
                  )}
                  
                  {error ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center">
                      <FileText className="h-12 w-12 text-slate-400 mb-4" />
                      <p className="text-slate-600 mb-4">{error}</p>
                      <Button
                        variant="outline"
                        onClick={() => window.open(document.original_url, '_blank')}
                        className="flex items-center space-x-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span>Open in New Tab</span>
                      </Button>
                    </div>
                  ) : (
                    <Document
                      file={document.original_url}
                      onLoadSuccess={onDocumentLoadSuccess}
                      onLoadError={onDocumentLoadError}
                      loading={
                        <div className="flex items-center justify-center h-64">
                          <div className="text-slate-600">Loading PDF...</div>
                        </div>
                      }
                      options={{
                        cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/',
                        cMapPacked: true,
                      }}
                    >
                      {!loading && !error && (
                        <Page
                          pageNumber={pageNumber}
                          width={Math.min(700, window.innerWidth * 0.7)}
                          renderTextLayer={false}
                          renderAnnotationLayer={false}
                        />
                      )}
                    </Document>
                  )}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex justify-center p-3 border-t bg-slate-50">
                <Button
                  variant="outline"
                  onClick={() => window.open(document.original_url, '_blank')}
                  className="flex items-center space-x-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>Open Full Document</span>
                </Button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600 mb-4">
                  Preview not available for this file type
                </p>
                <Button
                  variant="outline"
                  onClick={() => window.open(document.original_url, '_blank')}
                  className="flex items-center space-x-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>Open in New Tab</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentPreview;
