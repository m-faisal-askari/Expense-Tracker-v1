import io
from decimal import Decimal
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

from backend.app.engine.money import from_cents

def generate_invoice_pdf(invoice, client, user_profile=None) -> bytes:
    """
    Generates a clean, professional PDF invoice using ReportLab.
    Returns the PDF file bytes.
    
    Note: invoice monetary fields (subtotal, discount_amount, tax_amount,
    total_amount, amount_paid, balance_due) are stored as integer cents.
    Item fields (unit_price, total_amount) are also integer cents.
    quantity and tax_rate are Numeric (not money).
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#1e293b'),
        spaceAfter=6
    )
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor('#64748b')
    )
    bold_style = ParagraphStyle(
        'BoldText',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor('#0f172a'),
        fontName='Helvetica-Bold'
    )
    normal_style = ParagraphStyle(
        'RegularText',
        parent=styles['Normal'],
        fontSize=9,
        textColor=colors.HexColor('#334155'),
        leading=13
    )

    story = []

    # 1. Top Header: Brand & Invoice Meta
    freelancer_name = (user_profile.full_name if user_profile and user_profile.full_name else "Independent Freelancer")
    freelancer_email = (user_profile.email if user_profile and user_profile.email else "")
    
    header_data = [
        [
            Paragraph(f"<b>{freelancer_name}</b><br/>{freelancer_email}", normal_style),
            Paragraph(f"<b>INVOICE</b><br/><font color='#64748b'>#{invoice.invoice_number}</font>", ParagraphStyle('HRight', parent=title_style, alignment=2))
        ]
    ]
    header_table = Table(header_data, colWidths=[300, 240])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 15))

    # 2. Bill To & Invoice Details
    client_name = client.name if client else "Valued Client"
    company = client.company_name or ""
    client_email = client.email or ""
    address = client.billing_address or ""

    bill_to_text = f"<b>BILL TO:</b><br/>{client_name}<br/>"
    if company:
        bill_to_text += f"{company}<br/>"
    if client_email:
        bill_to_text += f"{client_email}<br/>"
    if address:
        bill_to_text += f"{address}<br/>"

    details_text = f"<b>Issue Date:</b> {invoice.issue_date}<br/><b>Due Date:</b> {invoice.due_date}<br/><b>Status:</b> {invoice.status.value}<br/><b>Currency:</b> {invoice.currency}"

    meta_table = Table([
        [Paragraph(bill_to_text, normal_style), Paragraph(details_text, normal_style)]
    ], colWidths=[320, 220])
    meta_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LINEBELOW', (0, 0), (-1, -1), 1, colors.HexColor('#e2e8f0')),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 20))

    # 3. Line Items Table — convert cents to display amounts
    table_data = [
        [
            Paragraph("<b>Description</b>", bold_style),
            Paragraph("<b>Qty</b>", bold_style),
            Paragraph(f"<b>Rate ({invoice.currency})</b>", bold_style),
            Paragraph(f"<b>Amount ({invoice.currency})</b>", bold_style)
        ]
    ]

    for item in invoice.items:
        table_data.append([
            Paragraph(item.description, normal_style),
            Paragraph(f"{item.quantity:.2f}", normal_style),
            Paragraph(f"{from_cents(item.unit_price):.2f}", normal_style),
            Paragraph(f"{from_cents(item.total_amount):.2f}", normal_style),
        ])

    items_table = Table(table_data, colWidths=[290, 60, 90, 100])
    items_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f8fafc')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#0f172a')),
        ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('LINEBELOW', (0, 0), (-1, 0), 1.5, colors.HexColor('#cbd5e1')),
        ('LINEBELOW', (0, 1), (-1, -1), 0.5, colors.HexColor('#f1f5f9')),
    ]))
    story.append(items_table)
    story.append(Spacer(1, 15))

    # 4. Totals Summary Table — convert cents to display amounts
    summary_data = [
        ["Subtotal:", f"{invoice.currency} {from_cents(invoice.subtotal):.2f}"],
        ["Discount:", f"- {invoice.currency} {from_cents(invoice.discount_amount):.2f}"],
        [f"Tax ({invoice.tax_rate:.1f}%):", f"{invoice.currency} {from_cents(invoice.tax_amount):.2f}"],
        ["Total Amount:", f"{invoice.currency} {from_cents(invoice.total_amount):.2f}"],
        ["Amount Paid:", f"{invoice.currency} {from_cents(invoice.amount_paid):.2f}"],
        ["Balance Due:", f"{invoice.currency} {from_cents(invoice.balance_due):.2f}"],
    ]
    summary_table = Table(summary_data, colWidths=[420, 120])
    summary_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
        ('FONTNAME', (0, 3), (-1, 3), 'Helvetica-Bold'),
        ('FONTNAME', (0, 5), (-1, 5), 'Helvetica-Bold'),
        ('TEXTCOLOR', (0, 5), (-1, 5), colors.HexColor('#4f46e5')),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LINEBELOW', (0, 3), (-1, 3), 1, colors.HexColor('#cbd5e1')),
        ('LINEBELOW', (0, 5), (-1, 5), 1.5, colors.HexColor('#4f46e5')),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 20))

    # 5. Payment Instructions & Notes
    if invoice.payment_instructions or invoice.notes:
        note_data = []
        if invoice.payment_instructions:
            note_data.append([Paragraph(f"<b>Payment Instructions:</b><br/>{invoice.payment_instructions}", normal_style)])
        if invoice.notes:
            note_data.append([Paragraph(f"<b>Notes:</b><br/>{invoice.notes}", normal_style)])
        note_table = Table(note_data, colWidths=[540])
        note_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
            ('PADDING', (0, 0), (-1, -1), 10),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#e2e8f0')),
        ]))
        story.append(note_table)

    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()
