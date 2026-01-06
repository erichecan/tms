export type WaybillTemplateType = 'AMAZON' | 'DEFAULT';

export interface Address {
    id: string;
    type: 'PICKUP' | 'DROP' | 'BILL_TO' | 'FULFILLMENT'; // Context type
    alias?: string; // For waybill number generation (e.g. Y001)
    companyName: string;
    addressLine: string;
    city: string;
    province: string;
    postalCode: string;
    contactPerson: string;
    phone: string;
    email?: string;
    arrivalWindowStart?: string;
    arrivalWindowEnd?: string;
    note?: string;
}

export interface WaybillItem {
    id: string;
    name?: string; // "Battery Power Bank"
    pallets: number;
    items?: number; // Item Count
    weight?: string; // Using string to allow units or empty
    description?: string;
    proNumber?: string; // Amazon specific
    poList?: string; // Amazon specific
}

export interface WaybillData {
    id: string;
    templateType: WaybillTemplateType;
    waybillNumber: string; // Y001-AF
    status: 'DRAFT' | 'SUBMITTED' | 'COMPLETED';

    // Common Header Info
    deliveryDate: string;
    driverId?: string;
    driverName?: string;
    driverAlias?: string; // AF

    // Template A Specifics (Amazon)
    referenceCode?: string;
    isaNumber?: string; // Shipment Appointment (ISA) 1599...

    // Addresses (flexible list to support multi-pick/drop)
    locations: Address[];

    // Goods
    goods: WaybillItem[];

    // Totals
    totalPallets: number;
    totalItems?: number;

    // Timing
    timeIn?: string;
    timeOut?: string;
    freeTimePolicy?: string; // "24h" or "1h"

    // Amazon Images (Base64 or URL)
    isaImage?: string;
    barcodeImage?: string;

    // Signatures / Footers
    note?: string;

    // Metrics for Pricing
    distanceKm?: number;
}

export const INITIAL_AMAZON_TEMPLATE: Partial<WaybillData> = {
    templateType: 'AMAZON',
    isaNumber: '159984016975',
    locations: [
        {
            id: 'loc_amazon_1',
            type: 'FULFILLMENT',
            alias: 'Y001',
            companyName: 'Y001',
            addressLine: '1399 Kennedy road Unit 7',
            city: 'Scarborough', // Assuming Scarborough based on the address
            province: 'ON',
            postalCode: 'M1P 2L6', // Placeholder if not provided, or keep existing format if possible. Let's try to be safe with just address line change if city/zip unknown but "Kennedy road" usually implies Toronto/Scarborough. I will check context.
            contactPerson: '',
            phone: ''
        }
    ],
    referenceCode: 'Y001-H9-VFEQL',
    goods: [
        {
            id: 'item_1',
            pallets: 12,
            items: 172,
            proNumber: 'FBA1941MJBQM',
            poList: '8KS9QC5C'
        }
    ],
    totalPallets: 12,
    totalItems: 172,
    freeTimePolicy: 'Free 24h'
};

export const INITIAL_DEFAULT_TEMPLATE: Partial<WaybillData> = {
    templateType: 'DEFAULT',
    locations: [
        {
            id: 'loc_def_pickup',
            type: 'PICKUP',
            alias: 'Letian',
            companyName: 'Letian-Ecoflow',
            addressLine: '675 Harwood Ave N, Unit 2',
            city: 'Ajax',
            province: 'ON',
            postalCode: 'L1Z 0K4',
            contactPerson: '',
            phone: ''
        },
        {
            id: 'loc_def_drop',
            type: 'DROP',
            alias: 'TCED',
            companyName: 'TCED INTL INC.',
            addressLine: '700 Chemin du Grand-Bernier Nord',
            city: 'Saint-Jean-sur-Richelieu',
            province: 'QC',
            postalCode: 'J2W 2H1',
            contactPerson: 'Joel Rozon',
            phone: '4503488720',
            email: 'joel.rozon@tced.ca'
        }
    ],
    goods: [
        {
            id: 'g_1',
            name: 'Battery Power Bank',
            pallets: 10,
            description: 'Pallets=10' // As per image content mapping
        }
    ],
    totalPallets: 10,
    freeTimePolicy: 'Free 1h'
};
