
import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer = ({ content }: MarkdownRendererProps) => {
  const renderContent = (content: string) => {
    return content.split('\n').map((line, index) => {
      if (line.trim() === '') {
        return <br key={index} />;
      }
      
      // Handle markdown headers (## Header)
      if (line.trim().startsWith('## ')) {
        const headerText = line.replace(/^## /, '');
        return (
          <h3 key={index} className="font-bold text-lg mt-4 mb-2 text-slate-900">
            {headerText}
          </h3>
        );
      }
      
      // Handle markdown headers (# Header)
      if (line.trim().startsWith('# ')) {
        const headerText = line.replace(/^# /, '');
        return (
          <h2 key={index} className="font-bold text-xl mt-4 mb-2 text-slate-900">
            {headerText}
          </h2>
        );
      }
      
      // Handle bullet points (both - and • and *)
      if (line.trim().startsWith('- ') || line.trim().startsWith('• ') || line.trim().startsWith('* ')) {
        const bulletContent = line.trim().replace(/^[-•*] /, '');
        const processedContent = processBoldText(bulletContent);
        return (
          <div key={index} className="ml-4 mb-2 flex items-start">
            <span className="text-blue-600 mr-2 mt-1 flex-shrink-0">•</span>
            <span dangerouslySetInnerHTML={{ __html: processedContent }} />
          </div>
        );
      }
      
      // Handle section headers (lines that end with colon)
      if (line.trim().endsWith(':') && !line.includes('**') && !line.startsWith('#')) {
        const processedContent = processBoldText(line);
        return (
          <div key={index} className="font-semibold mt-3 mb-2 text-slate-900">
            <span dangerouslySetInnerHTML={{ __html: processedContent }} />
          </div>
        );
      }
      
      // Handle regular paragraphs
      const processedContent = processBoldText(line);
      return (
        <div key={index} className="mb-2" dangerouslySetInnerHTML={{ __html: processedContent }} />
      );
    });
  };

  const processBoldText = (text: string) => {
    // Replace **text** with <strong>text</strong> for bold
    return text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>');
  };

  return (
    <div className="space-y-1">
      {renderContent(content)}
    </div>
  );
};
