from pdfminer.high_level import extract_text

pdf_path = 'd:/ung dung/soulfriend/english_foundation/1000 từ vựng IELTS thông dụng nhất.pdf'
txt_path = 'd:/ung dung/soulfriend/english_foundation/ielts_vocab_extracted.txt'

text = extract_text(pdf_path)
with open(txt_path, 'w', encoding='utf-8') as f:
    f.write(text)
print('Extracted text saved to', txt_path)
