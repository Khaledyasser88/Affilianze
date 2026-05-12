import * as pdfjs from 'pdfjs-dist'

// Set worker source for pdfjs (matching version 5.5.207)
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@5.5.207/build/pdf.worker.min.js`

/**
 * Extracts all text content from a PDF file.
 * @param file The PDF file to parse
 * @returns Promise resolving to the extracted text string
 */
export async function extractTextFromPdf(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer })
    const pdf = await loadingTask.promise
    
    let fullText = ''
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ')
      
      fullText += pageText + '\n'
    }
    
    return fullText.trim()
  } catch (error) {
    console.error('Error parsing PDF:', error)
    throw new Error('Could not read PDF content. Please ensure it is a valid PDF file.')
  }
}
