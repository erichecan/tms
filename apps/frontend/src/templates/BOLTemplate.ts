// Bill of Lading (BOL) HTML Template - 2025-10-02 16:30:00
// 说明：基于 billoflading.org 的样式重建，完全复制其边框和布局

export interface BOLTemplateOptions {
  includeSignatures?: boolean;
  shipperSignature?: string | null; // dataURL
  driverSignature?: string | null; // dataURL
  receiverSignature?: string | null; // dataURL
}

export function generateBOLHtml(shipment: unknown, opts: BOLTemplateOptions = {}): string {
  // 2025-11-30 02:15:00 修复：优先使用保存的字段，确保BOL数据与创建运单时的数据一致
  const sx = (v?: string) => v || '';
  const anyShipment = shipment as any;
  const pickup = anyShipment.pickupAddress || {};
  const delivery = anyShipment.deliveryAddress || {};

  // 优先使用保存的字段（shipperName, shipperPhone等），如果没有则从shipper对象或地址中提取
  const shipper = anyShipment.shipper || {
    name: anyShipment.shipperName || anyShipment.customerName || anyShipment.customer?.name || '',
    phone: anyShipment.shipperPhone || anyShipment.shipper?.phone || '',
    companyId: anyShipment.customer?.id || '',
    address: {
      addressLine1: anyShipment.shipperAddress?.addressLine1 || pickup.addressLine1 || pickup.street || '',
      city: anyShipment.shipperAddress?.city || pickup.city || '',
      province: anyShipment.shipperAddress?.province || pickup.province || pickup.state || '',
      postalCode: anyShipment.shipperAddress?.postalCode || pickup.postalCode || '',
      country: anyShipment.shipperAddress?.country || pickup.country || ''
    }
  };

  // 优先使用保存的字段（receiverName, receiverPhone等）
  const receiver = anyShipment.receiver || {
    name: anyShipment.receiverName || '',
    phone: anyShipment.receiverPhone || anyShipment.receiver?.phone || '',
    companyId: anyShipment.receiver?.id || '',
    address: {
      addressLine1: anyShipment.receiverAddress?.addressLine1 || delivery.addressLine1 || delivery.street || '',
      city: anyShipment.receiverAddress?.city || delivery.city || '',
      province: anyShipment.receiverAddress?.province || delivery.province || delivery.state || '',
      postalCode: anyShipment.receiverAddress?.postalCode || delivery.postalCode || '',
      country: anyShipment.receiverAddress?.country || delivery.country || ''
    }
  };

  // 优先使用保存的shipperAddress和receiverAddress，如果没有则从shipper/receiver对象中提取
  const shipperAddr = anyShipment.shipperAddress || shipper.address || {
    addressLine1: pickup.addressLine1 || pickup.street || '',
    city: pickup.city || '',
    province: pickup.province || pickup.state || '',
    postalCode: pickup.postalCode || '',
    country: pickup.country || ''
  };

  const receiverAddr = anyShipment.receiverAddress || receiver.address || {
    addressLine1: delivery.addressLine1 || delivery.street || '',
    city: delivery.city || '',
    province: delivery.province || delivery.state || '',
    postalCode: delivery.postalCode || '',
    country: delivery.country || ''
  };

  const css = `
    <style>
      /* 基于 billoflading.org 的完整样式 */
      body { 
        background-color: #FFF; 
        font-size: 100%; 
        color: #000; 
        font-family: Arial, Helvetica, sans-serif; 
        margin: 0; 
        padding: 32px; 
        line-height: 1; 
      }
      
      #main { 
        margin: 0 auto; 
        padding: 32px; 
        width: 800px; 
        background: #FFF; 
      }
      
      #invHeader { margin-bottom: 16px; }
      
      #headLeft { 
        float: left; 
        width: 400px; 
        border-bottom: 1px solid #CCC; 
      }
      
      #headLeft h1 { 
        font-size: 2em; 
        font-weight: bold; 
        padding-bottom: 16px; 
        color: #000; 
        margin: 0; 
      }
      
      #headLeft p, #headRight p, #headRight span, #inst p { 
        font-weight: bold; 
        font-size: .85em; 
        padding: 0; 
        margin: 2px 0; 
      }
      
      #headLeft div { 
        padding: 4px; 
        border-top: 1px solid #CCC; 
        border-left: 1px solid #CCC; 
      }
      
      #headRight { 
        margin-top: 21px; 
        float: left; 
        width: 400px; 
        border-top: 1px solid #CCC; 
      }
      
      #headRight .border { 
        border-bottom: 1px solid #CCC; 
        border-left: 1px solid #CCC; 
        border-right: 1px solid #CCC; 
        padding: 4px; 
      }
      
      .inlineSpan span { 
        display: table-cell; 
        white-space: nowrap; 
      }
      
      .barcode { 
        padding: 10px 0px; 
        color: #CCC; 
        font-size: 1.5em; 
        font-weight: bold; 
        text-align: center; 
      }
      
      #headRight .fullWidth, #headRight .fullWidth input, .fullWidth input { 
        width: 100%; 
      }
      
      input { 
        margin: 0; 
        padding: 0; 
        border: none; 
        outline: none; 
        background: transparent; 
        font-family: Arial, Helvetica, sans-serif; 
        height: 12px; 
        line-height: 12px; 
      }
      
      textarea { 
        display: block; 
        margin: 0; 
        padding: 0; 
        border: none; 
        outline: none; 
        background: transparent; 
        font-family: Arial, Helvetica, sans-serif; 
        resize: none; 
        text-align: left; 
      }
      
      #inst { 
        padding: 4px; 
        border-left: 1px solid #CCC; 
        border-right: 1px solid #CCC; 
      }
      
      #inst textarea { 
        width: 100%; 
        height: 25px; 
        font-size: .85em; 
      }
      
      #invTable table { 
        width: 800px; 
        font-size: .9em; 
        border-collapse: collapse; 
        border-left: 1px solid #CCC; 
        border-right: 1px solid #CCC; 
      }
      
      table td, table th { 
        padding: 1px; 
        border: 1px solid #CCC; 
      }
      
      table th { 
        text-align: center; 
        font-weight: bold; 
        font-size: .75em; 
      }
      
      table .tableBanner { 
        color: white !important; 
        background: black !important; 
      }
      
      table tr td input { 
        width: 100%; 
      }
      
      .totals { 
        font-weight: bold; 
      }
      
      .blocked { 
        background: #CCC; 
      }
      
      #ftrBox { 
        border-right: 1px solid #CCC; 
        border-top: 2px solid black; 
        margin-top: 16px; 
        padding: 0; 
      }
      
      #ftrBox input[type=checkbox] { 
        margin: 4px; 
      }
      
      #ftrBox input[type=text] { 
        border-bottom: 1px solid black; 
        background: transparent; 
      }
      
      .ftr { 
        font-size: .7em; 
        padding: 4px; 
        border-bottom: 1px solid #CCC; 
        border-left: 1px solid #CCC; 
        overflow: hidden; 
        break-after: avoid; 
      }
      
      .two-col { 
        width: 390px; 
        float: left; 
      }
      
      .left { 
        float: left; 
      }
      
      .clear { 
        clear: both; 
      }
      
      @media print {
        body { padding: 0; }
        #main { width: 100%; padding: 0; margin: 0; max-width: unset; }
        /* 页面分割避免割裂 */
        #invHeader, #invTable, #ftrBox { break-inside: avoid; page-break-inside: avoid; }
        /* 页头避免孤立 */
        .tableBanner { break-after: avoid; }
        /* 行内元素避免被割裂 */
        .ftr.left { box-sizing: border-box; overflow-wrap: anywhere; }
        table { max-width: 100%; overflow-wrap: break-word; }
        /* 修复打印布局 */
        .ftr { height: auto !important; min-height: 20px; padding: 8px 4px; }
        .two-col { width: 48%; padding-right: 8px; }
      }
      
      select, checkbox { display: none; }
      
      /* 隐藏复选框显示文本，打印下禁用 */
      @media screen {
        input[type="checkbox"]:after { content: "☐"; margin-left: 4px; }
      }
      @media print {
        input[type="checkbox"]:after { content: none; }
        input[type="checkbox"] { appearance: none; width: 8px; height: 8px; border: 1px solid #000; background-color: #fff; display: inline-block; vertical-align: middle; }
        input[type="checkbox"]:checked { background-color: #000; }
        input[type="checkbox"]:checked:after { content: none; }
      }
    </style>
  `;

  return `
  ${css}
  <div id="main">
    <!-- Header Section -->
    <div id="invHeader">
      <div id="headLeft">
        <h1>Bill of Lading</h1>
        <div style="margin-top: 16px;">
          <p>Ship From:</p>
          <p><textarea rows="2" class="fullWidth">${sx(shipper.name)}${shipper.name ? '\n' : ''}${sx(shipperAddr.addressLine1)}${shipperAddr.addressLine2 ? ' ' + sx(shipperAddr.addressLine2) : ''}${shipperAddr.city ? '\n' + sx(shipperAddr.city) : ''}${shipperAddr.province ? ', ' + sx(shipperAddr.province) : ''}${shipperAddr.postalCode ? ' ' + sx(shipperAddr.postalCode) : ''}${shipperAddr.country ? '\n' + sx(shipperAddr.country) : ''}</textarea></p>
          <div style="border:none;float:left;width:300px">
            <span>SID#: </span><input type="text" value="${sx(shipper.companyId)}">
          </div>
          ${shipper.phone ? `<div style="border:none;float:left;">
            <span>Phone: </span><input type="text" value="${sx(shipper.phone)}">
          </div>` : ''}
          <div style="border:none;float:left;">
            <input type="checkbox" ${shipper.isFOB ? 'checked' : ''}><span> FOB</span>
          </div>
          <div style="border:none;padding:0;margin:0" class="clear"></div>
        </div>
        
        <div>
          <div style="border:none;float:left;width:185px">
            <p>Ship To:</p>
          </div>
          <div style="border:none;float:left">
            <span>Location No:</span><input type="text" size="6" value="${sx(receiver.locationNo)}">
          </div>
          <div style="border:none" class="clear"></div>
          <p><textarea rows="2" class="fullWidth">${sx(receiver.name)}${receiver.name ? '\n' : ''}${sx(receiverAddr.addressLine1)}${receiverAddr.addressLine2 ? ' ' + sx(receiverAddr.addressLine2) : ''}${receiverAddr.city ? '\n' + sx(receiverAddr.city) : ''}${receiverAddr.province ? ', ' + sx(receiverAddr.province) : ''}${receiverAddr.postalCode ? ' ' + sx(receiverAddr.postalCode) : ''}${receiverAddr.country ? '\n' + sx(receiverAddr.country) : ''}</textarea></p>
          <div style="border:none;float:left;width:300px">
            <span>CID#: </span><input type="text" value="${sx(receiver.companyId)}">
          </div>
          ${receiver.phone ? `<div style="border:none;float:left;">
            <span>Phone: </span><input type="text" value="${sx(receiver.phone)}">
          </div>` : ''}
          <div style="border:none;float:left;">
            <input type="checkbox" ${receiver.isFOB ? 'checked' : ''}><span> FOB</span>
          </div>
          <div style="border:none;padding:0;margin:0" class="clear"></div>
        </div>
        
        <div>
          <p>Third Party Freight Charges - Bill To:</p>
          <p><textarea rows="1" class="fullWidth"><!-- ${sx(shipment.billTo)} --></textarea></p>
        </div>
      </div>
      
      <div id="headRight">
        <div class="inlineSpan border">
          <span>Date:</span>
          <span class="fullWidth"><input type="text" value="${new Date(shipment.createdAt || Date.now()).toLocaleDateString()}"></span>
        </div>
        
        <div class="inlineSpan border">
          <span>Bill of Lading No:</span>
          <span class="fullWidth"><input type="text" value="${sx(shipment.shipmentNumber || shipment.shipmentNo || shipment.id)}"></span>
          <div class="barcode">
            <span>BARCODE SPACE</span>
          </div>
        </div>
        
        <div class="inlineSpan border">
          <div>
            <span>Carrier Name:</span>
            <span class="fullWidth"><input type="text" value="${sx(shipment.carrierName)}"></span>
          </div>
          <div>
            <span>Trailer No:</span>
            <span class="fullWidth"><input type="text" value="${sx(shipment.trailerNo)}"></span>
          </div>
          <div>
            <span>Seal Number(s):</span>
            <span class="fullWidth"><input type="text" value="${sx(shipment.sealNumbers)}"></span>
          </div>
        </div>
        
        <div class="inlineSpan border">
          <div>
            <span>SCAC:</span>
            <span class="fullWidth"><input type="text" value="${sx(shipment.scac)}"></span>
          </div>
          <div>
            <span>Pro No:</span>
            <span class="fullWidth"><input type="text" value="${sx(shipment.proNo)}"></span>
          </div>
          <div class="barcode">
            <span>BARCODE SPACE</span>
          </div>
        </div>
        
        <div class="border">
          <p style="padding-bottom:6px;">Freight Charge Terms (prepaid unless marked otherwise)</p>
          <input type="checkbox" ${shipment.freightChargeTerms === 'prepaid' ? 'checked' : ''}><span> Prepaid</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          <input type="checkbox" ${shipment.freightChargeTerms === 'collect' ? 'checked' : ''}><span> Collect</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          <input type="checkbox" ${shipment.freightChargeTerms === '3rdparty' ? 'checked' : ''}><span> 3rd Party</span>
        </div>
        
        <div class="border">
          <input type="checkbox" ${shipment.masterBOL ? 'checked' : ''}><span> Master BOL: w/attached underlying BOLs</span>
        </div>
      </div>
      
      <div class="clear"></div>
      
      <div id="inst">
        <p>Special Instructions:</p>
        <textarea><!-- ${sx(shipment.specialInstructions)} --></textarea>
      </div>
    </div>
    
    <!-- Tables Section -->
    <div id="invTable">
      <!-- Customer Order Information Table -->
      <table>
        <thead>
          <tr>
            <th class="tableBanner" colspan="5">Customer Order Information</th>
          </tr>
          <tr>
            <th>Customer Order No.</th>
            <th># Pkgs.</th>
            <th>Weight</th>
            <th>Pallet/Slip (Y/N)</th>
            <th>Additional Shipper Info</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="width:135px;"><input type="text" value="${sx(shipment.customerOrderNo)}"></td>
            <td style="width:45px;"><input type="text" value="${sx(String(shipment.cargoQuantity || ''))}"></td>
            <td style="width:45px;"><input type="text" value="${sx(String(shipment.cargoWeight || ''))}"></td>
            <td style="width:55px;"><input type="text" value="${sx(shipment.palletSlip)}"></td>
            <td><input type="text" value="${sx(shipment.additionalShipperInfo)}"></td>
          </tr>
          <tr><td><input type="text"></td><td><input type="text"></td><td><input type="text"></td><td><input type="text"></td><td><input type="text"></td></tr>
          <tr><td><input type="text"></td><td><input type="text"></td><td><input type="text"></td><td><input type="text"></td><td><input type="text"></td></tr>
          <tr><td><input type="text"></td><td><input type="text"></td><td><input type="text"></td><td><input type="text"></td><td><input type="text"></td></tr>
          <tr><td><input type="text"></td><td><input type="text"></td><td><input type="text"></td><td><input type="text"></td><td><input type="text"></td></tr>
          <tr><td><input type="text"></td><td><input type="text"></td><td><input type="text"></td><td><input type="text"></td><td><input type="text"></td></tr>
          <tr><td><input type="text"></td><td><input type="text"></td><td><input type="text"></td><td><input type="text"></td><td><input type="text"></td></tr>
        </tbody>
        <tfoot>
          <tr class="totals">
            <td>Totals</td>
            <td><div>${sx(String(shipment.cargoQuantity || ''))}</div></td>
            <td><div>${sx(String(shipment.cargoWeight || ''))}</div></td>
            <td class="blocked" colspan="2"></td>
          </tr>
        </tfoot>
      </table>
      
      <!-- Carrier Information Table -->
      <table>
        <thead>
          <tr>
            <th class="tableBanner" colspan="9">Carrier Information</th>
          </tr>
          <tr>
            <th colspan="2">Handling Unit</th>
            <th colspan="2">Package</th>
            <th colspan="2"></th>
            <th>Commodity Description</th>
            <th colspan="2">LTL Only</th>
          </tr>
          <tr>
            <th>QTY</th>
            <th>TYPE</th>
            <th>QTY</th>
            <th>TYPE</th>
            <th>Weight</th>
            <th>H.M. (X)</th>
            <th style="font-size:.65em;font-weight:normal;">Commodities requiring special or additional care or attention in handling or stowing must be so marked and packaged as to ensure safe transportation with ordinary care.<br><strong>See Section 2(e) of MNMFC Item 360</strong></th>
            <th>NMFC No.</th>
            <th>Class No.</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="width:45px;"><input type="text" value="${sx(String(shipment.cargoQuantity || ''))}"></td>
            <td style="width:45px;"><input type="text" value="${sx(shipment.packageType || '')}"></td>
            <td style="width:45px;"><input type="text" value="${sx(String(shipment.cargoQuantity || ''))}"></td>
            <td style="width:45px;"><input type="text" value="${sx(shipment.packageType || '')}"></td>
            <td style="width:45px;"><input type="text" value="${sx(String(shipment.cargoWeight || ''))}"></td>
            <td style="width:45px;"><input type="text" value="${shipment.hazardousMaterial ? 'X' : ''}"></td>
            <td><input type="text" value="${sx(shipment.cargoDescription || '')}"></td>
            <td style="width:45px;"><input type="text" value="${sx(shipment.nmfcNo)}"></td>
            <td style="width:45px;"><input type="text" value="${sx(shipment.freightClass)}"></td>
          </tr>
          <tr><td><input type="text"></td><td><input type="text"></td><td><input type="text"></td><td><input type="text"></td><td><input type="text"></td><td><input type="text"></td><td><input type="text"></td><td><input type="text"></td><td><input type="text"></td></tr>
          <tr><td><input type="text"></td><td><input type="text"></td><td><input type="text"></td><td><input type="text"></td><td><input type="text"></td><td><input type="text"></td><td><input type="text"></td><td><input type="text"></td><td><input type="text"></td></tr>
          <tr><td><input type="text"></td><td><input type="text"></td><td><input type="text"></td><td><input type="text"></td><td><input type="text"></td><td><input type="text"></td><td><input type="text"></td><td><input type="text"></td><td><input type="text"></td></tr>
          <tr><td><input type="text"></td><td><input type="text"></td><td><input type="text"></td><td><input type="text"></td><td><input type="text"></td><td><input type="text"></td><td><input type="text"></td><td><input type="text"></td><td><input type="text"></td></tr>
        </tbody>
        <tfoot>
          <tr class="totals">
            <td><div>${sx(String(shipment.cargoQuantity || ''))}</div></td>
            <td class="blocked"></td>
            <td><div>${sx(String(shipment.cargoQuantity || ''))}</div></td>
            <td class="blocked"></td>
            <td><div>${sx(String(shipment.cargoWeight || ''))}</div></td>
            <td class="blocked"></td>
            <td>Totals</td>
            <td class="blocked"></td>
            <td class="blocked"></td>
          </tr>
        </tfoot>
      </table>
    </div>
    
    <!-- Footer Section -->
    <div id="ftrBox">
      <div class="ftr left two-col" style="height:65px">
        <p style="margin-bottom: 6px;">Where the rate is dependent on value, shippers are required to state specifically in writing the agreed or declared value of the property as follows:</p>
        <p style="margin-bottom: 6px;">"The agreed or declared value of the property is specifically stated by the shipper to be not exceeding</p>
        <input type="text" value="${shipment.declaredValue || ''}" style="width:80px"><span>FOB</span><input type="text" value="" style="width:80px">."
      </div>
      
      <div class="ftr left two-col" style="height:65px;font-size:1em;">
        <p style="padding:6px 0;"><strong>COD Amt. $</strong><input type="text" value="${shipment.codAmount || ''}" style="width:80px"></p>
        <p><strong>Fee Terms:</strong><input type="checkbox" ${shipment.feeTerms === 'collect' ? 'checked' : ''}><span>Collect</span><input type="checkbox" ${shipment.feeTerms === 'prepaid' ? 'checked' : ''}><span>Prepaid</span></p>
        <p><input type="checkbox" ${shipment.customerCheckAcceptable ? 'checked' : ''}><span>Customer Check Acceptable</span></p>
      </div>
      
      <div class="clear"></div>
      
      <div class="ftr" style="height:20px;">
        <p><strong>NOTE: Liability Limitation for loss or damage in this shipment may be applicable. See 49 U.S.C. - 14706(c)(1)(A) and (B).</strong></p>
      </div>
      
      <div class="ftr left two-col" style="height:55px">
        <p>RECEIVED, subject to individually determined rates or contracts that have been agreed upon in writing between the carrier and shipper, if applicable, otherwise to the rates, classifications and rules that have been established by the carrier and are available to the shipper, on request, and to all applicable state and federal regulations.</p>
      </div>
      
      <div class="ftr left two-col" style="height:65px">
        <p>The carrier shall not make delivery of this shipment without payment of freight and all other lawful charges.</p>
        <div class="left" style="margin-top:16px;">Shipper Signature</div>
        <div class="left" style="width:200px;height:24px;border-bottom:1px solid black;margin-top:16px;">
          ${opts.includeSignatures && opts.shipperSignature ? `<img src="${opts.shipperSignature}" style="height:24px;object-fit:contain" />` : ''}
        </div>
        <div class="clear"></div>
      </div>
      
      <div class="clear"></div>
      
      <div class="ftr left" style="height:85px;width:237px;font-size:.65em">
        <p>This is to certify that the above named materials are properly classified, packaged, marked and labeled, and are in proper condition for transportation according to the applicable regulations of the DOT.</p>
        <div class="left" style="width:150px;margin-right:10px">
          <div style="width:150px;height:36px;border-bottom:1px solid black">
            ${opts.includeSignatures && opts.shipperSignature ? `<img src="${opts.shipperSignature}" style="height:36px;object-fit:contain" />` : ''}
          </div>
          <p>Shipper Signature</p>
        </div>
        <div class="left">
          <div style="width:75px;height:36px;border-bottom:1px solid black"></div>
          <p>Date</p>
        </div>
      </div>
      
      <div class="ftr left" style="height:85px;width:257px">
        <div class="left" style="width:85px;">
          <p><strong>Trailer Loaded</strong></p>
          <p><input type="checkbox" ${shipment.trailerLoadedByShipper ? 'checked' : ''}>By Shipper</p>
          <p><input type="checkbox" ${shipment.trailerLoadedByDriver ? 'checked' : ''}>By Driver</p>
        </div>
        <div class="left">
          <p><strong>Freight Counted</strong></p>
          <p><input type="checkbox" ${shipment.freightCountedByShipper ? 'checked' : ''}>By Shipper</p>
          <p><input type="checkbox" ${shipment.freightCountedByDriver ? 'checked' : ''}>By Driver/pallets said to contain</p>
          <p><input type="checkbox" ${shipment.freightCountedByDriverPieces ? 'checked' : ''}>By Driver/Pieces</p>
        </div>
        <div class="clear"></div>
      </div>
      
      <div class="ftr left" style="height:85px;width:276px;font-size:.65em;">
        <p>Carrier acknowledges receipt of packages and required placards. Carrier certifies emergency response information was made available and/or carrier has the DOT emergency response guidebook or equivalent documentation in the vehicle. Property described above is received in good order, except as noted.</p>
        <div class="left" style="width:150px;margin-right:10px">
          <div style="width:150px;height:30px;border-bottom:1px solid black">
            ${opts.includeSignatures && opts.driverSignature ? `<img src="${opts.driverSignature}" style="height:30px;object-fit:contain" />` : ''}
          </div>
          <p>Carrier Signature</p>
        </div>
        <div class="left">
          <div style="width:75px;height:30px;border-bottom:1px solid black"></div>
          <p>Pickup Date</p>
        </div>
      </div>
      
      <div class="clear"></div>
    </div>
  </div>
  `;
}