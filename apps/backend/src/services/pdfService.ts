
import PDFDocument = require('pdfkit');
import { Waybill } from '../types';

// Helper to draw a box with title
function drawBox(doc: PDFKit.PDFDocument, x: number, y: number, w: number, h: number, title: string, contentArray: string[]) {
    doc.rect(x, y, w, h).stroke();
    doc.fontSize(8).font('Helvetica-Bold').text(title, x + 5, y + 5);
    doc.font('Helvetica').fontSize(10);
    let currentY = y + 20;
    contentArray.forEach(line => {
        if (line) {
            doc.text(line, x + 5, currentY, { width: w - 10 });
            currentY += 12;
        }
    });
}

export const generateWaybillPDF = (waybill: Waybill, signatureUrl?: string): PDFKit.PDFDocument => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const details = waybill.details || {};

    // Header
    doc.fontSize(24).font('Helvetica-Bold').text('APONY BILL OF LADING', { align: 'center' });
    doc.fontSize(10).font('Helvetica').text('Short Form - Not Negotiable', { align: 'center' });
    doc.moveDown();

    // Meta Info Row
    const yMeta = doc.y;
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text(`Date: ${new Date(waybill.created_at).toLocaleDateString()}`, 40, yMeta);
    doc.text(`Waybill No: ${waybill.waybill_no}`, 200, yMeta);
    doc.text(`Page: 1 of 1`, 450, yMeta); // Placeholder
    doc.moveDown(2);

    const yAddresses = doc.y;
    // Ship From
    const shipFromData = [
        details.shipFrom?.company || 'N/A',
        details.shipFrom?.contact ? `Attn: ${details.shipFrom.contact}` : '',
        details.shipFrom?.address || waybill.origin || '',
        details.shipFrom?.phone ? `Tel: ${details.shipFrom.phone}` : ''
    ];
    drawBox(doc, 40, yAddresses, 250, 100, 'SHIP FROM (Shipper)', shipFromData);

    // Ship To
    const shipToData = [
        details.shipTo?.company || 'N/A',
        details.shipTo?.contact ? `Attn: ${details.shipTo.contact}` : '',
        details.shipTo?.address || waybill.destination || '',
        details.shipTo?.phone ? `Tel: ${details.shipTo.phone}` : ''
    ];
    drawBox(doc, 305, yAddresses, 250, 100, 'SHIP TO (Consignee)', shipToData);

    // Bill To (Third Party) - Using footer "client_name" as Customer
    const yBillTo = yAddresses + 110;
    const billToData = [
        details.footerInfo?.client_name || waybill.customer_id || 'Same as Shipper'
    ];
    drawBox(doc, 40, yBillTo, 515, 60, 'BILL TO (Third Party / Customer)', billToData);

    // Reference Info
    const yRef = yBillTo + 70;
    const refData = [
        `PO #: ${details.baseInfo?.reference_code || ''}`,
        `Delivery Date: ${details.baseInfo?.delivery_date || ''}`,
        `Fulfillment Center: ${details.baseInfo?.fc_alias || ''}`
    ];
    drawBox(doc, 40, yRef, 515, 60, 'REFERENCE INFORMATION', refData);


    // Cargo Table
    const yTable = yRef + 80;
    doc.font('Helvetica-Bold').fontSize(9);

    // Table Header
    doc.rect(40, yTable, 515, 20).fill('#eeeeee').stroke();
    doc.fillColor('black').text('#', 45, yTable + 6);
    doc.text('PALLETS', 70, yTable + 6);
    doc.text('ITEMS', 130, yTable + 6);
    doc.text('DESCRIPTION / PRO#', 190, yTable + 6);
    doc.text('PO LIST / NOTES', 350, yTable + 6);

    let currentY = yTable + 20;

    // Table Content
    doc.font('Helvetica').fontSize(9);
    const lines = details.goodsLines || [];

    // If no details, use basic waybill info as fallback line
    if (lines.length === 0) {
        lines.push({ pallet_count: waybill.pallet_count, item_count: '-', pro: waybill.cargo_desc, po_list: '' });
    }

    lines.forEach((line: any, idx: number) => {
        doc.rect(40, currentY, 515, 20).stroke();
        doc.text((idx + 1).toString(), 45, currentY + 6);
        doc.text(line.pallet_count || '0', 70, currentY + 6);
        doc.text(line.item_count || '0', 130, currentY + 6);
        doc.text(line.pro || '-', 190, currentY + 6);
        doc.text(line.po_list || '-', 350, currentY + 6);
        currentY += 20;
    });

    // Disclaimer
    const yDisclaimer = currentY + 20;
    doc.fontSize(7).text('Received, subject to the classifications and lawfully filed tariffs in effect on the date of the issue of this Bill of Lading. the property described above in apparent good order, except as noted.', 40, yDisclaimer, { width: 515 });

    // Signatures
    const ySig = yDisclaimer + 40;

    // Shipper Sig
    doc.rect(40, ySig, 250, 80).stroke();
    doc.text('SHIPPER SIGNATURE / DATE', 45, ySig + 5);

    // Carrier Sig
    doc.rect(305, ySig, 250, 80).stroke();
    doc.text('CARRIER SIGNATURE / DATE', 310, ySig + 5);
    doc.text('Apony Logistics', 310, ySig + 65);

    // Render Digital Signature if present
    if (signatureUrl && signatureUrl.includes('base64')) {
        try {
            const base64Data = signatureUrl.split(',')[1];
            if (base64Data) {
                const imgBuffer = Buffer.from(base64Data, 'base64');
                doc.image(imgBuffer, 50, ySig + 20, { height: 40 });
            }
        } catch (e) { }
    }


    doc.end();
    return doc;
};

// Re-export generateBOL as alias or similar implementation for now since user wants them unified/improved.
// Actually user asked for generateBOL to be "Professional" or "Copy of 29504". 
// Since 29504 is missing, I will make generateBOL identical to the high-quality WaybillPDF above or similar.
export const generateBOL = generateWaybillPDF;
