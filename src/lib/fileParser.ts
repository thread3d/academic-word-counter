import * as mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';

// Set worker source for pdfjs
// Using unpkg for the worker as it's often more reliable for specific versions
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export async function extractTextFromFile(file: File): Promise<string> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (extension === 'docx') {
    return extractTextFromDocx(file);
  } else if (extension === 'pdf') {
    return extractTextFromPdf(file);
  } else if (extension === 'txt') {
    return file.text();
  } else {
    throw new Error('Unsupported file type. Please upload a .docx, .pdf, or .txt file.');
  }
}

async function extractTextFromDocx(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

async function extractTextFromPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    
    let lastY: number | null = null;
    let pageText = '';
    
    // Sort items by vertical position (top to bottom) and then horizontal position
    const items = [...textContent.items] as any[];
    items.sort((a, b) => {
      if (Math.abs(a.transform[5] - b.transform[5]) < 2) {
        return a.transform[4] - b.transform[4];
      }
      return b.transform[5] - a.transform[5];
    });

    for (const item of items) {
      const currentY = item.transform[5];
      
      if (lastY !== null && Math.abs(currentY - lastY) > 5) {
        pageText += '\n';
      } else if (lastY !== null) {
        pageText += ' ';
      }
      
      pageText += item.str;
      lastY = currentY;
    }
    
    fullText += pageText + '\n\n';
  }

  return fullText;
}

export function calculateWordCount(text: string): number {
  if (!text.trim()) return 0;
  return text.trim().split(/\s+/).length;
}

export interface AcademicCountResult {
  totalCount: number;
  academicCount: number;
  excludedSections: string[];
  mainText: string;
  excludedText: string;
}

export interface ExclusionMarker {
  id: string;
  label: string;
  pattern: RegExp;
  enabled: boolean;
}

export const DEFAULT_MARKERS: ExclusionMarker[] = [
  { id: 'title', label: 'Title & Authors', pattern: /^.*$/, enabled: true },
  { id: 'abstract', label: 'Abstract', pattern: /^abstract$/i, enabled: true },
  { id: 'headings', label: 'Section Headings', pattern: /^(?:\d+(?:\.\d+)*\s+)?[A-Z][\w\s]{2,50}$/, enabled: true },
  { id: 'citations', label: 'In-text Citations', pattern: /\((?:(?:e\.g\.|i\.e\.|see|cf\.)\s+)?[A-Z][^)]*?,?\s*\d{4}[a-z]?(?:;\s*[^)]*?,?\s*\d{4}[a-z]?)*\)/g, enabled: true },
  { id: 'headerfooter', label: 'Headers & Footers', pattern: /^(?:\d+|page\s+\d+(?:\s+of\s+\d+)?|.*working\s+paper.*|.*nber.*)$/i, enabled: true },
  { id: 'conclusion', label: 'Conclusion', pattern: /^(?:\d+\s+)?conclusions?$/i, enabled: false },
  { id: 'references', label: 'References', pattern: /^(?:\d+\s+)?references$/i, enabled: true },
  { id: 'bibliography', label: 'Bibliography', pattern: /^(?:\d+\s+)?bibliography$/i, enabled: true },
  { id: 'works-cited', label: 'Works Cited', pattern: /^(?:\d+\s+)?works cited$/i, enabled: true },
  { id: 'appendices', label: 'Appendices', pattern: /^(?:\d+\s+)?appendices$/i, enabled: true },
  { id: 'figures', label: 'Figures', pattern: /^(?:\d+\s+)?figures$/i, enabled: true },
  { id: 'tables', label: 'Tables', pattern: /^(?:\d+\s+)?tables$/i, enabled: true },
];

export function analyzeAcademicWordCount(text: string, markers: ExclusionMarker[] = DEFAULT_MARKERS): AcademicCountResult {
  const lines = text.split('\n');
  let academicText = '';
  let excludedText = '';
  const excludedSections: string[] = [];
  
  const isEnabled = (id: string) => markers.find(m => m.id === id)?.enabled;
  
  // Tail markers (Sections that stop the academic count)
  const tailIds = ['conclusion', 'references', 'bibliography', 'works-cited', 'appendices', 'figures', 'tables'];
  const tailMarkers = markers.filter(m => m.enabled && tailIds.includes(m.id));
  
  // Line markers
  const headingMarker = markers.find(m => m.id === 'headings' && m.enabled);
  const hfMarker = markers.find(m => m.id === 'headerfooter' && m.enabled);
  
  // Inline markers
  const citationMarker = markers.find(m => m.id === 'citations' && m.enabled);
  
  // Block markers (Abstract)
  const abstractMarker = markers.find(m => m.id === 'abstract' && m.enabled);
  
  // Title marker
  const titleEnabled = isEnabled('title');

  let inAbstract = false;
  let foundTail = false;
  let nonQuoteLineCount = 0;

  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (!trimmedLine) {
      if (!foundTail && !inAbstract) academicText += line + '\n';
      else excludedText += line + '\n';
      continue;
    }

    // 1. Check for Tail Markers (Highest priority for stopping)
    const isTailHeader = trimmedLine.length < 50 && tailMarkers.some(m => m.pattern.test(trimmedLine));
    if (isTailHeader && !foundTail) {
      foundTail = true;
      excludedSections.push(trimmedLine);
    }

    if (foundTail) {
      excludedText += line + '\n';
      continue;
    }

    // 2. Check for Headers/Footers (Page numbers, etc.)
    const isHF = hfMarker && (
      trimmedLine.length < 10 && /^\d+$/.test(trimmedLine) || 
      hfMarker.pattern.test(trimmedLine)
    );
    
    if (isHF) {
      excludedText += line + '\n';
      if (!excludedSections.includes("Headers/Footers")) excludedSections.push("Headers/Footers");
      continue;
    }

    nonQuoteLineCount++;

    // 3. Check for Title (First few non-empty lines)
    if (titleEnabled && nonQuoteLineCount <= 8 && !inAbstract) {
       excludedText += line + '\n';
       if (nonQuoteLineCount === 1) excludedSections.push("Title/Metadata");
       continue;
    }

    // 4. Check for Abstract
    const isAbstractHeader = trimmedLine.length < 20 && abstractMarker?.pattern.test(trimmedLine);
    if (isAbstractHeader) {
      inAbstract = true;
      excludedSections.push("Abstract");
    }

    const isHeading = trimmedLine.length < 60 && headingMarker?.pattern.test(trimmedLine);
    if (inAbstract && isHeading && !isAbstractHeader) {
      inAbstract = false;
    }

    if (inAbstract) {
      excludedText += line + '\n';
      continue;
    }

    // 5. Check for Section Headings
    if (isHeading && headingMarker) {
      excludedText += line + '\n';
      continue;
    }

    // If none of the above, it's academic text
    academicText += line + '\n';
  }

  // Apply inline exclusions (Citations)
  if (citationMarker) {
    const citations = academicText.match(citationMarker.pattern);
    if (citations) {
      excludedSections.push(`${citations.length} Citations`);
      excludedText += "\n--- EXCLUDED CITATIONS ---\n" + citations.join('\n') + "\n";
      academicText = academicText.replace(citationMarker.pattern, ' ');
    }
  }

  const totalCount = calculateWordCount(text);
  const academicCount = calculateWordCount(academicText);

  return {
    totalCount,
    academicCount,
    excludedSections,
    mainText: academicText,
    excludedText: excludedText
  };
}
