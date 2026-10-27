"""Gera diagramas autorais em SVG, sem serviços externos ou dados pessoais."""

from html import escape
from pathlib import Path
from textwrap import wrap

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs/imagens/manuais"


def text(x, y, value, size=20, color="#28133F", bold=False):
    weight = ' font-weight="bold"' if bold else ""
    return (
        f'<text x="{x}" y="{y}" font-size="{size}" fill="{color}"'
        f"{weight}>{escape(value)}</text>"
    )


def box(x, y, w, h, title, body, index):
    s = f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="16" fill="white" stroke="#D6C4E7"/>'
    s += f'<circle cx="{x+28}" cy="{y+29}" r="17" fill="#6422B5"/>'
    s += text(x + 22, y + 36, str(index), 20, "white", True)
    for n, line in enumerate(wrap(title, int((w - 30) / 13))):
        s += text(x + 16, y + 76 + 27 * n, line, 22, bold=True)
    for n, line in enumerate(wrap(body, int((w - 32) / 10))):
        s += text(x + 16, y + 138 + 25 * n, line, 18, "#594965")
    return s


def diagram(name, title, subtitle, items, mode="flow"):
    height = 550 if mode == "decision" else 380
    s = (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="{height}" viewBox="0 0 1100 {height}">'
        '<defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">'
        '<path d="M0 0L10 5L0 10Z" fill="#6422B5"/></marker></defs>'
        f'<rect width="1100" height="{height}" rx="20" fill="#F4F1F8"/>'
        '<g font-family="DejaVu Sans, sans-serif">'
    )
    s += text(30, 43, title, 27, bold=True)
    s += text(30, 76, subtitle, 17, "#594965")
    if mode == "decision":
        s += '<path d="M550 100L735 166L550 232L365 166Z" fill="#28133F"/>'
        s += text(434, 163, "Envio confirmado?", 22, "white", True)
        s += text(447, 191, "Leia a resposta", 18, "white")
        for i, (head, body) in enumerate(items):
            x = 30 + i * 360
            s += f'<path d="M550 232V252H{x+160}V280" fill="none" stroke="#6422B5" stroke-width="3" marker-end="url(#arrow)"/>'
            s += box(x, 285, 320, 218, head, body, i + 1)
    else:
        count = len(items)
        width = (1040 - (count - 1) * 40) / count
        for i, (head, body) in enumerate(items):
            x = 30 + i * (width + 40)
            s += box(x, 105, width, 230, head, body, i + 1)
            if i < count - 1:
                line_y = 215 if mode == "flow" else 120
                s += f'<path d="M{x+width+5} {line_y}H{x+width+35}" stroke="#6422B5" stroke-width="3" marker-end="url(#arrow)"/>'
    s += text(
        30, height - 15, "Diagrama didático • Edição 27/10/2026 • Sem dados reais", 14, "#594965"
    )
    s += "</g></svg>"
    (OUT / f"{name}.svg").write_text(s, encoding="utf-8")


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    diagram(
        "arquitetura",
        "Da interface à persistência",
        "Cada camada possui uma responsabilidade e um contrato.",
        [
            ("TypeScript / TSX", "Tela, estado e cliente HTTP"),
            ("Java / Spring", "Sessão, vínculo e regras da API"),
            ("SQL / SQLite", "Dados persistidos e transações"),
        ],
    )
    diagram(
        "perfis",
        "Três perfis, contextos próprios",
        "O acesso sempre depende da pessoa e das concessões aplicáveis.",
        [
            ("Responsável", "Administra seus cadastros e revisa acessos"),
            ("Cuidador", "Aceita o convite e atua nas áreas concedidas"),
            ("Pessoa idosa", "Acessa o próprio cuidado pelo vínculo preparado"),
        ],
        "sequence",
    )
    diagram(
        "autorizacao",
        "Conferir antes de compartilhar",
        "Uma declaração no aplicativo não comprova representação legal.",
        [
            ("Pessoa", "Confirme a identidade do cadastro selecionado"),
            ("Autorização", "Verifique a base e a declaração aplicáveis"),
            ("Concessão", "Escolha a conta, as ações e a validade"),
        ],
    )
    diagram(
        "acesso-idoso",
        "Preparar o aparelho da pessoa idosa",
        "O QR é uma credencial temporária: não publique sua imagem.",
        [
            ("Gerar", "Adulto autorizado seleciona a pessoa e prepara o QR"),
            ("Usar", "Ler ou digitar em até 10 minutos; uso único"),
            ("Conferir", "Verificar o nome, documentos e navegação permitida"),
        ],
    )
    diagram(
        "ciclo-registro",
        "Do rascunho ao registro confirmado",
        "Uma mudança local ainda precisa da confirmação apropriada.",
        [
            ("Preparar", "Pessoa, campos, data, horário e versão da edição"),
            ("Validar", "API confere sessão, vínculo, ação e versão"),
            ("Confirmar", "Banco grava e a tela apresenta o resultado"),
        ],
    )
    diagram(
        "assincronia",
        "Duas leituras podem terminar fora de ordem",
        "A resposta deve continuar pertencendo à pessoa e à sessão atuais.",
        [
            ("Início: pessoa A", "A consulta A continua em andamento"),
            ("Troca: pessoa B", "Nova consulta recebe o contexto de B"),
            ("Resposta de A", "Não aplicar se a leitura já ficou desatualizada"),
        ],
        "sequence",
    )
    diagram(
        "transacao-versao",
        "Consistência em mais de uma dimensão",
        "Os mecanismos se complementam; cada um trata um problema.",
        [
            ("Transação", "Registro e evento confirmam juntos ou são desfeitos"),
            ("Versão", "Edição antiga recebe conflito em vez de sobrescrever"),
            ("mutationId", "Repetição da mesma criação preserva sua identidade"),
        ],
        "sequence",
    )
    diagram(
        "offline",
        "Interpretar o resultado antes de repetir",
        "A fila nativa depende de SQLCipher, sessão e validade local.",
        [
            ("Sucesso", "Confira o registro no contexto e no filtro corretos"),
            ("Sem transporte", "Se elegível, a alteração aguarda sincronização"),
            ("Recusa ou conflito", "Reveja acesso ou compare versões; não contorne"),
        ],
        "decision",
    )
    diagram(
        "diagnostico",
        "Quando algo não aparece",
        "Confira o contexto antes de cadastrar uma segunda cópia.",
        [
            ("Conta e pessoa", "Perfil, cadastro selecionado, convite e validade"),
            ("Tela e filtros", "Área, pesquisa, data e estado do registro"),
            ("Rede e resposta", "API acessível, aviso apresentado e sincronização"),
        ],
    )
    diagram(
        "rotina-segura",
        "Três conferências no dia a dia",
        "Leia os estados por seu texto, além das cores da interface.",
        [
            ("Começar", "Conta, pessoa, data e passagem do turno anterior"),
            ("Registrar", "Informação correta e resultado confirmado ou pendente"),
            ("Encerrar", "Pendências, comunicação e sincronização antes de sair"),
        ],
    )
    print(f"10 diagramas SVG gravados em {OUT}")


if __name__ == "__main__":
    main()
