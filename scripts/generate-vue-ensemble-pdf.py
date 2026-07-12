#!/usr/bin/env python3
"""Génère docs/vue-d-ensemble.pdf depuis docs/vue-d-ensemble.md"""

from __future__ import annotations

import re
import sys
from pathlib import Path

try:
    from fpdf import FPDF
except ImportError:
    print("Installation requise : pip install fpdf2")
    sys.exit(1)

ROOT = Path(__file__).resolve().parents[1]
MD_PATH = ROOT / "docs" / "vue-d-ensemble.md"
PDF_PATH = ROOT / "docs" / "vue-d-ensemble.pdf"

FONT_REGULAR = Path(r"C:\Windows\Fonts\arial.ttf")
FONT_BOLD = Path(r"C:\Windows\Fonts\arialbd.ttf")
FONT_ITALIC = Path(r"C:\Windows\Fonts\ariali.ttf")
FONT_MONO = Path(r"C:\Windows\Fonts\consola.ttf")


class DocPDF(FPDF):
    def __init__(self) -> None:
        super().__init__(orientation="P", unit="mm", format="A4")
        self.set_auto_page_break(auto=True, margin=18)
        self.add_font("Body", "", str(FONT_REGULAR))
        self.add_font("Body", "B", str(FONT_BOLD))
        self.add_font("Body", "I", str(FONT_ITALIC))
        self.add_font("Mono", "", str(FONT_MONO))
        self._first_page = True

    def header(self) -> None:
        if self._first_page:
            self._first_page = False
            return
        self.set_font("Body", "I", 8)
        self.set_text_color(120, 120, 120)
        self.cell(0, 8, "Immo2Kin — Vue d'ensemble du projet", align="R", new_x="LMARGIN", new_y="NEXT")
        self.set_text_color(0, 0, 0)
        self.ln(2)

    def footer(self) -> None:
        self.set_y(-12)
        self.set_font("Body", "I", 8)
        self.set_text_color(120, 120, 120)
        self.cell(0, 8, f"Page {self.page_no()}", align="C")
        self.set_text_color(0, 0, 0)


def strip_md_inline(text: str) -> str:
    text = re.sub(r"\*\*(.+?)\*\*", r"\1", text)
    text = re.sub(r"`(.+?)`", r"\1", text)
    text = re.sub(r"\[(.+?)\]\(.+?\)", r"\1", text)
    return text


def write_paragraph(pdf: DocPDF, text: str, size: int = 10, bold: bool = False) -> None:
    pdf.set_x(pdf.l_margin)
    pdf.set_font("Body", "B" if bold else "", size)
    pdf.multi_cell(pdf.w - pdf.l_margin - pdf.r_margin, 5.5, strip_md_inline(text))


def write_code_block(pdf: DocPDF, lines: list[str]) -> None:
    pdf.ln(2)
    pdf.set_fill_color(245, 245, 245)
    pdf.set_font("Mono", "", 8)
    w = pdf.w - pdf.l_margin - pdf.r_margin
    for line in lines:
        pdf.set_x(pdf.l_margin)
        pdf.multi_cell(w, 4.5, line.replace("\t", "    "), fill=True)
    pdf.set_font("Body", "", 10)
    pdf.ln(3)


def write_table(pdf: DocPDF, rows: list[list[str]]) -> None:
    if not rows:
        return
    col_count = max(len(r) for r in rows)
    usable = pdf.w - pdf.l_margin - pdf.r_margin
    col_w = usable / col_count
    pdf.ln(2)
    for i, row in enumerate(rows):
        padded = row + [""] * (col_count - len(row))
        pdf.set_font("Body", "B" if i == 0 else "", 9)
        if i == 0:
            pdf.set_fill_color(230, 236, 245)
        else:
            pdf.set_fill_color(255, 255, 255)
        y0 = pdf.get_y()
        x0 = pdf.l_margin
        max_h = 0
        cell_heights: list[float] = []
        for cell in padded:
            nb = pdf.multi_cell(col_w, 5, strip_md_inline(cell), dry_run=True, split_only=True)
            h = max(5, len(nb) * 5)
            cell_heights.append(h)
            max_h = max(max_h, h)
        if y0 + max_h > pdf.h - pdf.b_margin:
            pdf.add_page()
            y0 = pdf.get_y()
            x0 = pdf.l_margin
        for j, cell in enumerate(padded):
            pdf.set_xy(x0 + j * col_w, y0)
            pdf.multi_cell(
                col_w,
                5,
                strip_md_inline(cell),
                border=1,
                fill=(i == 0),
                max_line_height=5,
            )
        pdf.set_xy(pdf.l_margin, y0 + max_h)
    pdf.ln(4)


def parse_table(lines: list[str]) -> list[list[str]]:
    rows: list[list[str]] = []
    for line in lines:
        if re.match(r"^\|[-:\s|]+\|$", line):
            continue
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        rows.append(cells)
    return rows


def build_pdf(md_text: str) -> DocPDF:
    pdf = DocPDF()
    pdf.add_page()
    pdf.set_font("Body", "", 10)

    lines = md_text.splitlines()
    i = 0
    in_code = False
    code_buf: list[str] = []
    table_buf: list[str] = []
    list_buf: list[str] = []

    def flush_list() -> None:
        nonlocal list_buf
        for item in list_buf:
            write_paragraph(pdf, "- " + item, size=10)
        list_buf = []
        pdf.ln(1)

    def flush_table() -> None:
        nonlocal table_buf
        if table_buf:
            write_table(pdf, parse_table(table_buf))
            table_buf = []

    while i < len(lines):
        line = lines[i]

        if line.strip().startswith("```"):
            flush_list()
            flush_table()
            if in_code:
                write_code_block(pdf, code_buf)
                code_buf = []
                in_code = False
            else:
                in_code = True
            i += 1
            continue

        if in_code:
            code_buf.append(line)
            i += 1
            continue

        if line.strip().startswith("|"):
            flush_list()
            table_buf.append(line)
            i += 1
            continue
        else:
            flush_table()

        if line.strip() in ("---", "***", "___"):
            flush_list()
            pdf.ln(2)
            pdf.set_draw_color(200, 200, 200)
            pdf.line(pdf.l_margin, pdf.get_y(), pdf.w - pdf.r_margin, pdf.get_y())
            pdf.ln(4)
            i += 1
            continue

        m = re.match(r"^(#{1,4})\s+(.+)$", line)
        if m:
            flush_list()
            level = len(m.group(1))
            title = strip_md_inline(m.group(2))
            sizes = {1: 18, 2: 14, 3: 12, 4: 11}
            pdf.ln(2 if level > 1 else 0)
            pdf.set_x(pdf.l_margin)
            pdf.set_font("Body", "B", sizes.get(level, 11))
            pdf.multi_cell(pdf.w - pdf.l_margin - pdf.r_margin, 7, title)
            pdf.ln(2)
            pdf.set_font("Body", "", 10)
            i += 1
            continue

        m = re.match(r"^-\s+(.+)$", line.strip())
        if m:
            list_buf.append(m.group(1))
            i += 1
            continue

        if line.strip() == "":
            flush_list()
            pdf.ln(2)
            i += 1
            continue

        if line.strip().startswith("*") and line.strip().endswith("*") and not line.strip().startswith("**"):
            flush_list()
            pdf.set_x(pdf.l_margin)
            pdf.set_font("Body", "I", 9)
            pdf.multi_cell(pdf.w - pdf.l_margin - pdf.r_margin, 5, strip_md_inline(line.strip().strip("*")))
            pdf.set_font("Body", "", 10)
            pdf.ln(2)
            i += 1
            continue

        flush_list()
        write_paragraph(pdf, line)
        i += 1

    flush_list()
    flush_table()
    if in_code and code_buf:
        write_code_block(pdf, code_buf)

    return pdf


def main() -> None:
    if not MD_PATH.is_file():
        print(f"Fichier introuvable : {MD_PATH}")
        sys.exit(1)
    for f in (FONT_REGULAR, FONT_BOLD, FONT_MONO):
        if not f.is_file():
            print(f"Police introuvable : {f}")
            sys.exit(1)

    md_text = MD_PATH.read_text(encoding="utf-8")
    pdf = build_pdf(md_text)
    pdf.output(str(PDF_PATH))
    print(f"PDF généré : {PDF_PATH}")


if __name__ == "__main__":
    main()
