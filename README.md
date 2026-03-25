# Academic Word Counter

A local running, browser-based app for analyzing academic documents and calculating a more meaningful word count than given by word processors.

## Why this project

Generally word counts from word processors can be misleading when writing academic papers. This project was built to make that process faster, clearer, and more practical than by sending documents to 'who knows where'.

## ✨ Highlights

- **Fast document upload** for PDF, DOCX, and TXT files
- **Smart academic analysis** with configurable exclusion rules
- **Side-by-side text preview** of included and excluded content
- **Clean summary view** with total count, academic count, and exclusions
- **Local-first processing** for a privacy-friendly experience
- **Downloadable output** as a cleaned `.txt` file

## 🚀 Demo Experience

Academic Word Counter is designed to make academic word counting feel simple, modern, and reliable. Upload a document, review the extracted text, toggle exclusion rules as needed, and get an instant breakdown of the content that matters most.

## 🛠 Tech Stack

- React 19
- TypeScript 5.8
- Vite
- Tailwind CSS
- Motion
- Lucide React
- Mammoth for DOCX parsing
- pdfjs-dist for PDF parsing

## 📦 Getting Started

### Prerequisites

- Node.js
- npm
  
### Install dependencies

- npm install

### Run locally

- npm run dev
- Then open the local URL shown in the terminal. In many setups, this is: [http://localhost:3001](http://localhost:3001)


## Supported File Types

- `.pdf`
- `.docx`
- `.txt`

## How It Works

1. Upload a supported document.
2. The app extracts text from the file.
3. Academic content is analyzed using exclusion rules.
4. The app displays:
    - total word count
    - academic word count
    - excluded sections
    - a preview of included and excluded text

## Technical Notes

- PDF extraction is handled with `pdfjs-dist`
- DOCX extraction is handled with `mammoth`
- TXT files are read directly in the browser
- Analysis logic is implemented in TypeScript and can be extended with additional rules

## License
