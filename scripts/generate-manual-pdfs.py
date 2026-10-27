"""Gera os três manuais ilustrados a partir dos Markdown em docs/."""

from __future__ import annotations

import html
import os
import re
from urllib.parse import quote, urlparse
from pathlib import Path

import cairosvg
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    CondPageBreak,
    Flowable,
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
from reportlab.platypus.tableofcontents import TableOfContents

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output" / "pdf"
TMP = ROOT / "tmp" / "pdfs"
EDITION = "2026-10-27"
REPO_URL = "https://github.com/Kirrp/Cuidados-a-mente/blob/main/"
PURPLE = colors.HexColor("#28133F")
VIOLET = colors.HexColor("#6422B5")
PALE = colors.HexColor("#F4F1F8")
INK = colors.HexColor("#45374F")
MUTED = colors.HexColor("#665B73")


def font_path(filename, windows_name):
    candidates = [
        Path(os.environ.get("MANUAL_FONTS_DIR", "/usr/share/fonts/truetype/dejavu")) / filename,
        Path("C:/Windows/Fonts") / windows_name,
        Path("/Library/Fonts") / filename,
    ]
    for candidate in candidates:
        if candidate.is_file():
            return str(candidate)
    raise RuntimeError(f"Fonte {filename} ausente. Instale DejaVu ou configure MANUAL_FONTS_DIR.")


pdfmetrics.registerFont(TTFont("Arial", font_path("DejaVuSans.ttf", "arial.ttf")))
pdfmetrics.registerFont(TTFont("ArialBold", font_path("DejaVuSans-Bold.ttf", "arialbd.ttf")))
pdfmetrics.registerFont(TTFont("ArialItalic", font_path("DejaVuSans-Oblique.ttf", "ariali.ttf")))
pdfmetrics.registerFont(TTFont("Consolas", font_path("DejaVuSansMono.ttf", "consola.ttf")))
pdfmetrics.registerFontFamily(
    "Arial", normal="Arial", bold="ArialBold", italic="ArialItalic", boldItalic="ArialBold"
)

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

    def link(match):
        label, target = match.groups()
        target = html.unescape(target)
        parsed = urlparse(target)
        if parsed.scheme not in ("", "http", "https"):
            return label
        if not parsed.scheme:
            target = REPO_URL + quote("docs/" + target, safe="/#")
        return f'<link href="{html.escape(target, quote=True)}" color="#6422B5">{label}</link>'

    escaped = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", link, escaped)
    escaped = re.sub(r"`([^`]+)`", r'<font name="Consolas" color="#683c85">\1</font>', escaped)
    escaped = re.sub(r"\*\*([^*]+)\*\*", r"<b>\1</b>", escaped)
    escaped = re.sub(r"(?<!\*)\*([^*]+)\*(?!\*)", r"<i>\1</i>", escaped)
    return escaped


def render_svg(source: Path) -> Path:
    target = TMP / (source.stem + ".png")
    if target.exists() and target.stat().st_mtime >= source.stat().st_mtime:
        return target
    cairosvg.svg2png(url=str(source), write_to=str(target), scale=1.5)
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
    presentation_added = False
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
            if level == 1:
                # A capa é criada separadamente; não repetir o título.
                if not presentation_added:
                    result.append(Paragraph("Apresentação", ST["h3"]))
                    presentation_added = True
                i += 1
                continue
            if level == 3:
                # Reserva espaço para o título, a fonte, o trecho e sua explicação.
                result.append(CondPageBreak(160))
            style = ST["title" if level == 1 else "h2" if level == 2 else "h3"]
            paragraph = Paragraph(inline(head.group(2)), style)
            paragraph._outline_title = head.group(2)
            paragraph._outline_level = level - 2
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
            if flowable._outline_level == 0:
                self.notify("TOCEntry", (0, html.escape(flowable._outline_title), self.page, key))


class Cover(Flowable):
    """Capa vetorial; mantém texto pesquisável e identidade visual do projeto."""

    def __init__(self, title, subtitle):
        Flowable.__init__(self)
        self.title = title
        self.subtitle = subtitle
        self.width = A4[0] - 86
        self.height = 610

    def draw(self):
        c = self.canv
        w = self.width
        c.setFillColor(PURPLE)
        c.roundRect(0, 0, w, self.height, 20, fill=1, stroke=0)
        c.setFillColor(colors.HexColor("#41205F"))
        c.circle(w - 80, 110, 140, fill=1, stroke=0)
        c.setFillColor(colors.HexColor("#DCC3FA"))
        c.setFont("ArialBold", 12)
        c.drawString(30, 565, "CUIDADOS À MENTE")
        c.setStrokeColor(colors.HexColor("#9B6BC9"))
        c.line(30, 540, w - 30, 540)
        title_style = ParagraphStyle(
            "cover", fontName="ArialBold", fontSize=34, leading=43, textColor=colors.white
        )
        p = Paragraph(self.title, title_style)
        _, h = p.wrap(w - 65, 210)
        p.drawOn(c, 30, 475 - h)
        sub_style = ParagraphStyle(
            "coverSub",
            fontName="Arial",
            fontSize=14,
            leading=23,
            textColor=colors.HexColor("#ECE0F6"),
        )
        p = Paragraph(self.subtitle, sub_style)
        _, h = p.wrap(w - 70, 160)
        p.drawOn(c, 30, 320 - h)
        c.setFillColor(colors.HexColor("#DCC3FA"))
        c.setFont("ArialBold", 11)
        c.drawString(30, 112, "EDIÇÃO AMPLIADA • 27/10/2026")
        c.setFont("Arial", 10)
        c.drawString(30, 84, "Exemplos explicados · Diagramas · Consulta por capítulos")
        c.drawString(30, 58, "Documentação em português • Projeto no GitHub")


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
        canvas.drawString(43, 27, "Guia ilustrado • edição " + EDITION)
        canvas.drawRightString(w - 43, 27, str(doc.page))
        canvas.restoreState()

    return draw


def create(name: str, source: str, title: str):
    output = OUT / name
    if source.endswith("MANUAL_USUARIO.md"):
        ST["body"].fontSize = 11
        ST["body"].leading = 17
        ST["list"].fontSize = 11
        ST["list"].leading = 17
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
    subtitle = (
        "Roteiros completos para pessoas idosas, cuidadores e responsáveis. "
        "Telas de demonstração, passos e solução de dificuldades."
        if source.endswith("MANUAL_USUARIO.md")
        else "Leitura de código com exemplos reais, fundamentos das linguagens "
        "e explicações para acompanhar cada etapa do projeto."
    )
    toc = TableOfContents()
    toc.levelStyles = [
        ParagraphStyle(
            "toc",
            fontName="Arial",
            fontSize=10,
            leading=15,
            textColor=INK,
            spaceBefore=5,
            leftIndent=0,
            rightIndent=22,
        )
    ]
    story = [
        Cover(title, subtitle),
        PageBreak(),
        Paragraph("Sobre esta edição", ST["h2"]),
        Paragraph(
            "Documentação preparada em 27/10/2026 para o Cuidados à Mente. "
            "As capturas usam dados fictícios de uma prévia web e podem mostrar datas "
            "anteriores. Diagramas são explicativos. Recursos nativos e integrações "
            "dependem da configuração e da avaliação na plataforma de destino.",
            ST["body"],
        ),
        Paragraph(
            "Use o sumário clicável e os marcadores do leitor de PDF para navegar. "
            "Exemplos identificados como didáticos foram simplificados. Trechos com "
            "arquivo e linha são extraídos dos fontes. Números de linha não fazem parte "
            "da sintaxe e podem mudar em futuras versões.",
            ST["body"],
        ),
        Paragraph(
            inline(
                "Fontes editáveis, informações da edição e instruções de regeneração: "
                "[Catálogo de manuais](manuais/README.md). "
                "O aplicativo organiza informações declaradas e não substitui avaliação "
                "profissional nem atendimento de urgência."
            ),
            ST["body"],
        ),
        Paragraph("Sumário", ST["h2"]),
        toc,
    ]
    story += make_story(ROOT / source, A4[0] - 86)
    doc.multiBuild(story, onFirstPage=decorate(title), onLaterPages=decorate(title))
    print(f"{output}: {output.stat().st_size} bytes")


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    TMP.mkdir(parents=True, exist_ok=True)
    create("manual-aula-cuidados-a-mente.pdf", "docs/MANUAL-AULA.md", "Manual-aula do código")
    create("manual-sintaxe-cuidados-a-mente.pdf", "docs/MANUAL-SINTAXE.md", "Manual de sintaxe")
    create("manual-usuario-cuidados-a-mente.pdf", "docs/MANUAL_USUARIO.md", "Manual do usuário")
