from pathlib import Path

from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas


def generate_receipt_pdf(receipt: dict, output_dir: str = "receipts") -> str:
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    receipt_id = receipt["receipt_id"]
    file_path = Path(output_dir) / f"{receipt_id}.pdf"

    c = canvas.Canvas(str(file_path), pagesize=A4)
    width, height = A4
    y = height - 50

    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, y, "Online Pet Shop - Payment Receipt")
    y -= 30

    c.setFont("Helvetica", 11)
    c.drawString(50, y, f"Receipt ID: {receipt.get('receipt_id')}")
    y -= 18
    c.drawString(50, y, f"Generated At: {receipt.get('generated_at')}")
    y -= 18
    c.drawString(50, y, f"Payment ID: {receipt.get('payment_id')} | Order ID: {receipt.get('order_id')}")
    y -= 18
    c.drawString(50, y, f"Customer: {receipt.get('customer_name')} (ID: {receipt.get('customer_id')})")
    y -= 18
    c.drawString(50, y, f"Payment Method: {receipt.get('payment_method')}")
    y -= 18
    c.drawString(50, y, f"Payment Status: {receipt.get('payment_status')}")
    y -= 18
    c.drawString(50, y, f"Order Total: {receipt.get('order_total')}")
    y -= 30

    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, y, "Items")
    y -= 20
    c.setFont("Helvetica", 10)
    c.drawString(50, y, "Product ID")
    c.drawString(140, y, "Qty")
    c.drawString(180, y, "Unit Price")
    c.drawString(260, y, "Subtotal")
    y -= 14

    for item in receipt.get("items", []):
        c.drawString(50, y, str(item.get("product_id")))
        c.drawString(140, y, str(item.get("quantity")))
        c.drawString(180, y, str(item.get("unit_price")))
        c.drawString(260, y, str(item.get("sub_total")))
        y -= 14
        if y < 80:
            c.showPage()
            c.setFont("Helvetica", 10)
            y = height - 50

    y -= 20
    c.setFont("Helvetica-Oblique", 9)
    note = receipt.get("note", "")
    c.drawString(50, y, note[:110])
    if len(note) > 110:
        y -= 12
        c.drawString(50, y, note[110:220])

    c.save()
    return str(file_path)
