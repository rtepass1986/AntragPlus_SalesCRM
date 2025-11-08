const fs = require('fs');
const PDFParser = require('pdf2json');

const pdfParser = new PDFParser();

pdfParser.on('pdfParser_dataError', errData => console.error(errData.parserError));
pdfParser.on('pdfParser_dataReady', pdfData => {
  const rawText = pdfParser.getRawTextContent();
  console.log('=== PDF CONTENT ===');
  console.log(rawText);
  console.log('=== END PDF CONTENT ===');
});

pdfParser.loadPDF('public/lebenslauf.pdf');
