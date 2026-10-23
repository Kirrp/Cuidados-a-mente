"""Gera os três manuais ilustrados a partir dos Markdown em docs/."""

from __future__ import annotations

import html
import re
import shutil
import subprocess
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    CondPageBreak,
    HRFlowable,
    Image,
    KeepTogether,
    PageBreak,
    Paragraph,
    Preformatted,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output" / "pdf"
TMP = ROOT / "tmp" / "pdfs"
NODE = shutil.which("node")
PURPLE = colors.HexColor("#28133F")
VIOLET = colors.HexColor("#6422B5")
PALE = colors.HexColor("#F4F1F8")
INK = colors.HexColor("#45374F")
MUTED = colors.HexColor("#665B73")

pdfmetrics.registerFont(TTFont("Arial", r"C:\Windows\Fonts\arial.ttf"))
pdfmetrics.registerFont(TTFont("ArialBold", r"C:\Windows\Fonts\arialbd.ttf"))
pdfmetrics.registerFont(TTFont("Consolas", r"C:\Windows\Fonts\consola.ttf"))
pdfmetrics.registerFontFamily("Arial", normal="Arial", bold="ArialBold")

ST = {
    "title": ParagraphStyle(
        "TitleCustom",
        fontName="ArialBold",
        fontSize=24,
        leading=31,
        textColor=PURPLE,
        spaceAfter=16,
    ),
    "h2": ParagraphStyle(
        "H2Custom",
        fontName="ArialBold",
        fontSize=16,
        leading=21,
        textColor=PURPLE,
        spaceBefore=18,
        spaceAfter=9,
        keepWithNext=True,
    ),
    "h3": ParagraphStyle(
        "H3Custom",
        fontName="ArialBold",
        fontSize=11.5,
        leading=16,
        textColor=VIOLET,
        spaceBefore=12,
        spaceAfter=6,
        keepWithNext=True,
    ),
    "body": ParagraphStyle(
        "BodyCustom",
        fontName="Arial",
        fontSize=10.5,
        leading=16,
        textColor=INK,
        spaceAfter=8,
        allowWidows=0,
        allowOrphans=0,
    ),
    "quote": ParagraphStyle(
        "QuoteCustom",
        fontName="Arial",
        fontSize=9,
        leading=14,
        textColor=MUTED,
        leftIndent=12,
        borderColor=VIOLET,
        borderWidth=2,
        borderPadding=8,
        spaceAfter=10,
    ),
    "list": ParagraphStyle(
        "ListCustom",
        fontName="Arial",
        fontSize=10.5,
        leading=16,
        textColor=INK,
        leftIndent=15,
        firstLineIndent=-12,
        spaceAfter=4,
    ),
    "cell": ParagraphStyle("CellCustom", fontName="Arial", fontSize=9, leading=12.5, textColor=INK),
    "cellHead": ParagraphStyle(
        "CellHeadCustom", fontName="ArialBold", fontSize=9, leading=12.5, textColor=colors.white
    ),
    "code": ParagraphStyle(
        "CodeCustom",
        fontName="Consolas",
        fontSize=8,
        leading=11,
        textColor=INK,
        backColor=PALE,
        leftIndent=9,
        rightIndent=6,
        borderPadding=8,
        spaceBefore=3,
        spaceAfter=10,
    ),
    "caption": ParagraphStyle(
        "CaptionCustom",
        fontName="Arial",
        fontSize=8,
        leading=11,
        textColor=MUTED,
        alignment=TA_CENTER,
        spaceAfter=13,
    ),
}


def inline(source: str) -> str:
    """Converte somente marcas inline simples, sempre escapando texto do usuário."""
    escaped = html.escape(source)
    escaped = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", escaped)
    escaped = re.sub(r"`([^`]+)`", r'<font name="Consolas" color="#683c85">\1</font>', escaped)
    escaped = re.sub(r"\*\*([^*]+)\*\*", r"<b>\1</b>", escaped)
    escaped = re.sub(r"(?<!\*)\*([^*]+)\*(?!\*)", r"<i>\1</i>", escaped)
    return escaped


def render_svg(source: Path) -> Path:
    target = TMP / (source.stem + ".png")
    if target.exists() and target.stat().st_mtime >= source.stat().st_mtime:
        return target
    if not NODE:
        raise RuntimeError("Node.js não encontrado. Instale-o para converter as ilustrações SVG.")
    js = "const sharp=require('sharp');sharp(process.argv[1],{density:180}).png().toFile(process.argv[2]).catch(e=>{console.error(e);process.exit(1)})"
    subprocess.run([NODE, "-e", js, str(source), str(target)], cwd=ROOT, check=True)
    return target


def split_table_cells(line: str) -> list[str]:
    """Separa colunas Markdown sem quebrar operadores | dentro de código inline."""
    source = line.strip().strip("|")
    cells, current = [], []
    in_code = False
    escaped = False
    for char in source:
        if escaped:
            current.append(char)
            escaped = False
        elif char == "\\":
            escaped = True
        elif char == "`":
            in_code = not in_code
            current.append(char)
        elif char == "|" and not in_code:
            cells.append("".join(current).strip())
            current = []
        else:
            current.append(char)
    cells.append("".join(current).strip())
    return cells


def table_flow(rows: list[str], width: float):
    parsed = []
    for line in rows:
        cells = split_table_cells(line)
        if all(re.fullmatch(r":?-{2,}:?", cell) for cell in cells):
            continue
        parsed.append(cells)
    if not parsed:
        return Spacer(1, 1)
    count = max(map(len, parsed))
    widths = [width / count] * count
    if count == 3:
        widths = [width * 0.24, width * 0.36, width * 0.40]
    cells = []
    for ri, row in enumerate(parsed):
        cells.append(
            [
                Paragraph(
                    inline(row[ci] if ci < len(row) else ""), ST["cellHead" if ri == 0 else "cell"]
                )
                for ci in range(count)
            ]
        )
    tab = Table(cells, colWidths=widths, repeatRows=1, hAlign="LEFT")
    tab.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), PURPLE),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, PALE]),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
                ("LINEBELOW", (0, 0), (-1, 0), 0.6, PURPLE),
            ]
        )
    )
    return tab


def make_story(source: Path, width: float):
    lines = source.read_text(encoding="utf-8").splitlines()
    result = []
    i = 0
    section = 0
    while i < len(lines):
        raw = lines[i].strip()
        if not raw:
            i += 1
            continue
        if raw.startswith("```"):
            i += 1
            code = []
            while i < len(lines) and not lines[i].strip().startswith("```"):
                code.append(lines[i].expandtabs(2))
                i += 1
            result.append(
                KeepTogether(
                    [
                        Preformatted(
                            "\n".join(code), ST["code"], maxLineLength=91, splitChars=" ,.)/"
                        )
                    ]
                )
            )
            i += 1
            continue
        match = re.fullmatch(r"!\[([^]]*)\]\(([^)]+)\)", raw)
        if match:
            image_path = (source.parent / match.group(2)).resolve()
            if image_path.suffix.lower() == ".svg":
                image_path = render_svg(image_path)
            from PIL import Image as PILImage

            with PILImage.open(image_path) as pic:
                w, h = pic.size
            scale = min(width / w, (500 if image_path.stem.startswith("tela-") else 245) / h)
            result.append(
                Image(str(image_path), width=w * scale, height=h * scale, hAlign="CENTER")
            )
            result.append(Paragraph(html.escape(match.group(1)), ST["caption"]))
            i += 1
            continue
        if raw.startswith("|"):
            rows = []
            while i < len(lines) and lines[i].strip().startswith("|"):
                rows.append(lines[i])
                i += 1
            result.append(table_flow(rows, width))
            result.append(Spacer(1, 10))
            continue
        head = re.match(r"^(#{1,3})\s+(.+)$", raw)
        if head:
            level = len(head.group(1))
            if level == 3:
                # Reserva espaço para o título, a fonte, o trecho e sua explicação.
                result.append(CondPageBreak(410))
            style = ST["title" if level == 1 else "h2" if level == 2 else "h3"]
            paragraph = Paragraph(inline(head.group(2)), style)
            paragraph._outline_title = head.group(2)
            paragraph._outline_level = level - 1
            paragraph._outline_key = f"s{section}"
            section += 1
            if level == 2:
                result.append(PageBreak())
                result.append(
                    HRFlowable(
                        width="100%",
                        thickness=0.8,
                        color=colors.HexColor("#dbc4e8"),
                        spaceBefore=7,
                        spaceAfter=2,
                    )
                )
            result.append(paragraph)
            i += 1
            continue
        if raw.startswith(">"):
            result.append(Paragraph(inline(raw[1:].strip()), ST["quote"]))
            i += 1
            continue
        if re.match(r"^(?:-|\d+\.)\s+", raw):
            symbol = "•" if raw.startswith("- ") else raw.split(".", 1)[0] + "."
            content = re.sub(r"^(?:-|\d+\.)\s+", "", raw)
            result.append(Paragraph(f"{symbol}  {inline(content)}", ST["list"]))
            i += 1
            continue
        paragraph = [raw]
        i += 1
        while (
            i < len(lines)
            and lines[i].strip()
            and not re.match(r"^(?:#|>|\||```|!\[|-\s|\d+\.\s)", lines[i].strip())
        ):
            paragraph.append(lines[i].strip())
            i += 1
        block = Paragraph(inline(" ".join(paragraph)), ST["body"])
        if raw.startswith("Fonte:"):
            # Mantém o arquivo, a linha e o código no mesmo bloco.
            cursor = i
            while cursor < len(lines) and not lines[cursor].strip():
                cursor += 1
            if cursor < len(lines) and lines[cursor].strip().startswith(chr(96) * 3):
                cursor += 1
                code = []
                while cursor < len(lines) and not lines[cursor].strip().startswith(chr(96) * 3):
                    code.append(lines[cursor].expandtabs(2))
                    cursor += 1
                result.append(
                    KeepTogether(
                        [
                            block,
                            Preformatted(
                                "\n".join(code), ST["code"], maxLineLength=91, splitChars=" ,.)/"
                            ),
                        ]
                    )
                )
                i = cursor + 1
                continue
            result.append(block)
        else:
            result.append(KeepTogether([block]))
    return result


class ManualDoc(SimpleDocTemplate):
    def afterFlowable(self, flowable):
        if hasattr(flowable, "_outline_title"):
            key = flowable._outline_key
            self.canv.bookmarkPage(key)
            self.canv.addOutlineEntry(
                flowable._outline_title, key, level=flowable._outline_level, closed=False
            )


def decorate(title: str):
    def draw(canvas, doc):
        canvas.saveState()
        w, h = A4
        canvas.setFillColor(PALE)
        canvas.rect(0, h - 35, w, 35, fill=1, stroke=0)
        canvas.setFont("ArialBold", 8)
        canvas.setFillColor(PURPLE)
        canvas.drawString(43, h - 23, "CUIDADOS À MENTE  |  " + title.upper())
        canvas.setStrokeColor(colors.HexColor("#dbc4e8"))
        canvas.line(43, 40, w - 43, 40)
        canvas.setFont("Arial", 8)
        canvas.setFillColor(MUTED)
        canvas.drawString(43, 27, "Guia ilustrado - versão 2026-10-12")
        canvas.drawRightString(w - 43, 27, str(doc.page))
        canvas.restoreState()

    return draw


def create(name: str, source: str, title: str):
    output = OUT / name
    if source.endswith("MANUAL_USUARIO.md"):
        ST["body"].fontSize = 12
        ST["body"].leading = 18
        ST["list"].fontSize = 12
        ST["list"].leading = 18
        ST["cell"].fontSize = 10
        ST["cell"].leading = 14
    doc = ManualDoc(
        str(output),
        pagesize=A4,
        leftMargin=43,
        rightMargin=43,
        topMargin=58,
        bottomMargin=56,
        title=title,
        author="Cuidados à Mente",
        allowSplitting=1,
    )
    story = make_story(ROOT / source, A4[0] - 86)
    doc.build(story, onFirstPage=decorate(title), onLaterPages=decorate(title))
    print(f"{output}: {output.stat().st_size} bytes")


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    TMP.mkdir(parents=True, exist_ok=True)
    create("manual-aula-cuidados-a-mente.pdf", "docs/MANUAL-AULA.md", "Manual-aula do código")
    create("manual-sintaxe-cuidados-a-mente.pdf", "docs/MANUAL-SINTAXE.md", "Manual de sintaxe")
    create("manual-usuario-cuidados-a-mente.pdf", "docs/MANUAL_USUARIO.md", "Manual do usuário")
