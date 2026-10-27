from pathlib import Path
import os
import re
import subprocess
from PIL import Image, ImageDraw, ImageFont
from pypdf import PdfReader

root = Path(__file__).resolve().parents[1]
out = root / "tmp" / "pdfs" / "qa"
out.mkdir(parents=True, exist_ok=True)
font_candidates = [
    Path(os.environ.get("MANUAL_FONTS_DIR", "/usr/share/fonts/truetype/dejavu")) / "DejaVuSans.ttf",
    Path("C:/Windows/Fonts/arial.ttf"),
    Path("/Library/Fonts/DejaVuSans.ttf"),
]
font = ImageFont.truetype(str(next(p for p in font_candidates if p.is_file())), 17)
snippets = 0
for source in sorted((root / "docs").glob("MANUAL*.md")):
    content = source.read_text(encoding="utf-8")
    for target in re.findall(r"!?\[[^]]*\]\(([^)]+)\)", content):
        if not target.startswith(("http://", "https://")):
            if not (source.parent / target).exists():
                raise ValueError(f"Link ou imagem ausente em {source.name}: {target}")
    pattern = r"Fonte: `([^`]+)`, linha (\d+)\.[^\n]*\n\n```[^\n]*\n(.*?)\n```"
    for match in re.finditer(pattern, content, re.S):
        lines = (root / match[1]).read_text(encoding="utf-8").splitlines()
        first_number = None
        for line in match[3].splitlines():
            numbered = re.fullmatch(r"(\d+) \| ?(.*)", line)
            if not numbered:
                raise ValueError(f"Trecho sem número em {source.name}: {line}")
            number = int(numbered[1])
            if first_number is None:
                first_number = number
            if number < 1 or number > len(lines) or lines[number - 1].rstrip() != numbered[2]:
                raise ValueError(f"Trecho desatualizado em {source.name}: {match[1]}:{number}")
        if first_number != int(match[2]):
            raise ValueError(f"Linha inicial incorreta em {source.name}: {match[1]}")
        snippets += 1
print(f"Imagens e links locais presentes; {snippets} trechos conferidos com os fontes.", flush=True)
failures = []
for pdf in sorted((root / "output" / "pdf").glob("*.pdf")):
    reader = PdfReader(pdf)
    if not reader.outline:
        failures.append(f"{pdf.name}: sem marcadores de navegação")
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
    if warnings:
        failures.append(f"{pdf.name}: páginas suspeitas {warnings}")
print("Contato de todas as páginas em", out, flush=True)
if failures:
    raise SystemExit("\n".join(failures))
