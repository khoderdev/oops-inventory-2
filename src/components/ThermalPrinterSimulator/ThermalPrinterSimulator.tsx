import React from 'react';

export interface ThermalPrinterSimulatorProps {
  content: string;
  width?: number;
  className?: string;
  showPaperEdges?: boolean;
  title?: string;
}

/**
 * ThermalPrinterSimulator - Simulates how thermal printer output will look
 * 
 * This component renders formatted thermal printer content with:
 * - Monospace font to simulate thermal printer character spacing
 * - Fixed width to match thermal paper (80mm = ~48 characters)
 * - ESC/POS command interpretation for bold text
 * - Paper-like styling with realistic margins and background
 */
const ThermalPrinterSimulator: React.FC<ThermalPrinterSimulatorProps> = ({
  content,
  width = 48,
  className = '',
  showPaperEdges = true,
  title = 'Thermal Printer Preview'
}) => {
  /**
   * Process ESC/POS commands and convert them to HTML formatting
   */
  const processEscPosContent = (rawContent: string): JSX.Element[] => {
    const lines = rawContent.split('\n');
    const processedLines: JSX.Element[] = [];
    
    // ESC/POS command constants
    const ESC_CUT = '\u001B\u0069'; // Paper cut command
    const ESC_RESET = '\u001B\u0040'; // Printer reset
    const ESC_BOLD_ON = '\u001B\u0045'; // Bold on
    const ESC_BOLD_OFF = '\u001B\u0046'; // Bold off
    const OTHER_CUT = '\u001D\u0056'; // Other cut command
    
    lines.forEach((line, lineIndex) => {
      // First, let's clean the line by removing non-printable commands except bold
      let processedLine = line
        .split(ESC_CUT).join('') // Remove paper cut command
        .split(OTHER_CUT).join('') // Remove other cut commands
        .split(ESC_RESET).join(''); // Remove printer reset commands
        
      const elements: JSX.Element[] = [];
      let currentIndex = 0;
      let isBold = false;
      
      // Process ESC/POS commands in the line
      while (currentIndex < processedLine.length) {
        // Look for ESC E (bold on)
        const boldOnIndex = processedLine.indexOf(ESC_BOLD_ON, currentIndex);
        // Look for ESC F (bold off)
        const boldOffIndex = processedLine.indexOf(ESC_BOLD_OFF, currentIndex);
        
        let nextCommandIndex = -1;
        let nextCommand = '';
        
        // Find the next command
        if (boldOnIndex !== -1 && (boldOffIndex === -1 || boldOnIndex < boldOffIndex)) {
          nextCommandIndex = boldOnIndex;
          nextCommand = 'boldOn';
        } else if (boldOffIndex !== -1) {
          nextCommandIndex = boldOffIndex;
          nextCommand = 'boldOff';
        }
        
        if (nextCommandIndex === -1) {
          // No more commands, add remaining text
          const remainingText = processedLine.substring(currentIndex);
          if (remainingText) {
            elements.push(
              <span key={`${lineIndex}-${currentIndex}`} className={isBold ? 'font-bold' : ''}>
                {remainingText}
              </span>
            );
          }
          break;
        }
        
        // Add text before the command
        const textBeforeCommand = processedLine.substring(currentIndex, nextCommandIndex);
        if (textBeforeCommand) {
          elements.push(
            <span key={`${lineIndex}-${currentIndex}`} className={isBold ? 'font-bold' : ''}>
              {textBeforeCommand}
            </span>
          );
        }
        
        // Process the command
        if (nextCommand === 'boldOn') {
          isBold = true;
          currentIndex = nextCommandIndex + 2; // Skip ESC_BOLD_ON (2 bytes)
        } else if (nextCommand === 'boldOff') {
          isBold = false;
          currentIndex = nextCommandIndex + 2; // Skip ESC_BOLD_OFF (2 bytes)
        }
      }
      
      // If no elements were added (no ESC/POS commands), add the whole line
      if (elements.length === 0) {
        elements.push(
          <span key={`${lineIndex}-0`}>
            {processedLine}
          </span>
        );
      }
      
      processedLines.push(
        <div key={lineIndex} className="leading-tight">
          {elements.length > 0 ? elements : '\u00A0' /* Non-breaking space for empty lines */}
        </div>
      );
    });
    
    return processedLines;
  };

  // First process ESC/POS commands (including bold), then remove non-printable commands
  const processedContent = processEscPosContent(content);
  
  // Create clean content for line counting (remove all ESC/POS commands)
  const cleanEscPosCommands = (text: string): string => {
    let cleaned = text;
    // Remove specific ESC/POS commands using string methods to avoid ESLint control character errors
    const ESC_BOLD_ON = '\u001B\u0045';
    const ESC_BOLD_OFF = '\u001B\u0046';
    const ESC_CUT = '\u001B\u0069';
    const OTHER_CUT = '\u001D\u0056';
    const ESC_RESET = '\u001B\u0040';
    
    // Use split/join instead of replace to avoid control character regex
    cleaned = cleaned.split(ESC_BOLD_ON).join('');
    cleaned = cleaned.split(ESC_BOLD_OFF).join('');
    cleaned = cleaned.split(ESC_CUT).join('');
    cleaned = cleaned.split(OTHER_CUT).join('');
    cleaned = cleaned.split(ESC_RESET).join('');
    
    // Remove alignment commands (ESC a 0, ESC a 1, ESC a 2)
    cleaned = cleaned.split('\u001B\u0061\u0000').join('');
    cleaned = cleaned.split('\u001B\u0061\u0001').join('');
    cleaned = cleaned.split('\u001B\u0061\u0002').join('');
    
    // Remove any remaining non-printable characters by filtering
    cleaned = cleaned.split('').filter(char => {
      const code = char.charCodeAt(0);
      return code >= 32 && code !== 127; // Keep printable ASCII characters
    }).join('');
    
    return cleaned;
  };
  
  const cleanContent = cleanEscPosCommands(content);
  
  // Note: Bold commands (\x1B\x45 and \x1B\x46) are handled in processEscPosContent
  // Other non-printable commands are removed here

  return (
    <div className={`thermal-printer-simulator ${className}`}>
      {title && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <p className="text-sm text-gray-600">
            Simulating {width} character width thermal paper
          </p>
        </div>
      )}
      
      <div className="relative">
        {/* Paper container */}
        <div 
          className={`
            bg-white 
            border-2 border-gray-300 
            shadow-lg 
            ${showPaperEdges ? 'border-dashed' : 'border-solid'}
            relative
            overflow-hidden
          `}
          style={{
            width: `${width * 0.6}rem`, // Approximate character width in rem
            minHeight: '200px'
          }}
        >
          {/* Paper texture overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-gray-50 to-white opacity-50 pointer-events-none" />
          
          {/* Content area */}
          <div 
            className="
              relative z-10
              p-4 
              pb-8
              font-mono 
              text-sm 
              leading-tight 
              text-black
              whitespace-pre-wrap
              break-words
            "
            style={{
              fontSize: '12px',
              lineHeight: '1.2'
            }}
          >
            {processedContent}
          </div>
          
          {/* Paper cut indicator */}
          {content.includes('\x1B\x69') && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-400 border-t-2 border-dashed border-gray-500">
              <div className="text-xs text-center text-gray-600 mt-1">
                ✂️ Cut Here
              </div>
            </div>
          )}
        </div>
        
        {/* Paper shadow/depth effect */}
        {showPaperEdges && (
          <div 
            className="absolute -bottom-1 -right-1 bg-gray-300 -z-10"
            style={{
              width: `${width * 0.6}rem`,
              height: '200px'
            }}
          />
        )}
      </div>
      
      {/* Character count info */}
      <div className="mt-2 text-xs text-gray-500">
        <div>Lines: {cleanContent.split('\n').length}</div>
        <div>Characters per line: ~{width}</div>
        <div>Contains ESC/POS commands: {content.includes('\x1B') ? 'Yes' : 'No'}</div>
      </div>
    </div>
  );
};

export default ThermalPrinterSimulator;
