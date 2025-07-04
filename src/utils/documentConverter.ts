
export interface ConversionResult {
  text: string;
  success: boolean;
  error?: string;
}

export const convertDocumentToText = async (file: File): Promise<ConversionResult> => {
  try {
    console.log(`Converting file via edge function: ${file.name}, type: ${file.type}`);

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('https://gcfgeigjaqifkvkrbswu.supabase.co/functions/v1/convert-document', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjZmdlaWdqYXFpZmt2a3Jic3d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0NDczMTIsImV4cCI6MjA2NjAyMzMxMn0.qNlrVAvRRYOeTEYw-mtJZbDpEFB6P3PMHmGHTaNFuzE`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;

  } catch (error) {
    console.error('Document conversion error:', error);
    return {
      text: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown conversion error'
    };
  }
};

export const getSupportedFileTypes = () => {
  return '.pdf';
};

export const getFileTypeDescription = (file: File): string => {
  const fileType = file.type.toLowerCase();
  const fileName = file.name.toLowerCase();

  if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
    return 'PDF Document';
  }
  
  return 'Document';
};
