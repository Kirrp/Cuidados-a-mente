from pathlib import Path
import subprocess
from PIL import Image, ImageDraw, ImageFont
from pypdf import PdfReader

root = Path(__file__).resolve().parents[1]
out = root / "tmp" / "pdfs" / "qa"
out.mkdir(parents=True, exist_ok=True)
font = ImageFont.truetype(r"C:\Windows\Fonts\arial.ttf", 17)
for pdf in sorted((root / "output" / "pdf").glob("*.pdf")):
    reader = PdfReader(pdf)
    name = pdf.stem.replace("-cuidados-a-mente", "")
    dest = out / name
    dest.mkdir(exist_ok=True)
    subprocess.run(["pdftoppm", "-r", "125", "-png", str(pdf), str(dest / "page")], check=True)
    pages = sorted(dest.glob("page-*.png"))[: len(reader.pages)]
    warnings = []
    for i, page in enumerate(reader.pages):
        value = page.extract_text() or ""
        if len(value.strip()) < 70 or "\ufffd" in value:
            warnings.append(i + 1)
    for start in range(0, len(pages), 9):
        sheet = Image.new("RGB", (1152, 1698), "#e8e4ec")
        draw = ImageDraw.Draw(sheet)
        for pos, file in enumerate(pages[start : start + 9]):
            image = Image.open(file).convert("RGB")
            image.thumbnail((368, 523))
            x = 8 + (pos % 3) * 384
            y = 8 + (pos // 3) * 566
            sheet.paste(image, (x, y + 27))
            draw.text((x, y), f"{name} | página {start + pos + 1}", fill="#322839", font=font)
        sheet.save(out / f"{name}-folha-{start // 9 + 1}.png")
    print(pdf.name, len(pages), "páginas; páginas suspeitas:", warnings, flush=True)
print("Contato de todas as páginas em", out, flush=True)
