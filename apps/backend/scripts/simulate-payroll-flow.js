
const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');
const dayjs = require('dayjs');

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Starting Payroll Simulation Data Seeding (JS Mode)...');

    // 1. Get or Create a Driver
    let driver = await prisma.driver.findFirst({
        where: { name: 'Simulation Driver' }
    });

    if (!driver) {
        console.log('Creating Simulation Driver...');
        driver = await prisma.driver.create({
            data: {
                id: uuidv4(),
                name: 'Simulation Driver',
                phone: '1234567890',
                licenseNumber: 'SIM-LIC-001',
                status: 'active',
                payoutRate: 0.30,
            }
        });
    }
    console.log(`✅ Driver Ready: ${driver.name} (${driver.id})`);

    // 2. Get or Create a Vehicle
    let vehicle = await prisma.vehicle.findFirst({
        where: { licensePlate: 'SIM-TRUCK-01' }
    });

    if (!vehicle) {
        console.log('Creating Simulation Vehicle...');
        vehicle = await prisma.vehicle.create({
            data: {
                id: uuidv4(),
                licensePlate: 'SIM-TRUCK-01',
                make: 'Volvo',
                model: 'VNL',
                year: 2023,
                status: 'active',
                type: 'truck'
            }
        });
    }
    console.log(`✅ Vehicle Ready: ${vehicle.licensePlate}`);


    // 3. Create Waybills (Shipments)
    // Clean up old simulation waybills if needed to avoid clutter
    // await prisma.shipment.deleteMany({ where: { shipmentNumber: { startsWith: 'SIM-WB-' } } });

    const s1 = await prisma.shipment.create({
        data: {
            id: uuidv4(),
            shipmentNumber: `SIM-WB-${dayjs().format('HHmmss')}-1`,
            status: 'completed',
            pickupAddress: '123 Origin St',
            deliveryAddress: '456 Dest Ave',
            pickupTime: dayjs().subtract(1, 'day').toDate(),
            deliveryTime: dayjs().toDate(),
            completedAt: dayjs().toDate(),
            driverId: driver.id,
            basePrice: 100.00,
            finalCost: 100.00,
            // Remove customerId if it causes issues, assuming optional or handled
        }
    });
    console.log(`✅ Shipment 1 Created & Completed: ${s1.shipmentNumber} ($100)`);

    const s2 = await prisma.shipment.create({
        data: {
            id: uuidv4(),
            shipmentNumber: `SIM-WB-${dayjs().format('HHmmss')}-2`,
            status: 'completed',
            pickupAddress: '789 Origin Rd',
            deliveryAddress: '101 Dest Blvd',
            pickupTime: dayjs().subtract(1, 'day').toDate(),
            deliveryTime: dayjs().toDate(),
            completedAt: dayjs().toDate(),
            driverId: driver.id,
            basePrice: 200.00,
            finalCost: 200.00,
        }
    });
    console.log(`✅ Shipment 2 Created & Completed: ${s2.shipmentNumber} ($200)`);

    console.log('\n🎉 Simulation Data Ready!');
    console.log('👉 Go to the Driver Salary Page and select "Simulation Driver".');
    console.log('👉 You should see a Total Income of approx $90 (30% commission of $300 total).');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
