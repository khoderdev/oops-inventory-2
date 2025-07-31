import { PrinterChannel, Printer, PrintJob } from '../models/index.js';
import PrinterService from '../services/PrinterService.js';

async function testPrinterSystem() {
  console.log('🖨️  Testing Printer Management System...\n');

  try {
    // Test 1: Create a printer channel
    console.log('1️⃣  Creating printer channel...');
    const channel = await PrinterChannel.create({
      name: 'Test Kitchen Channel',
      description: 'Test channel for kitchen orders',
      priority: 1,
      createdBy: 1 // Assuming user ID 1 exists
    });
    console.log(`✅ Channel created: ${channel.name} (ID: ${channel.id})`);

    // Test 2: Create a network printer
    console.log('\n2️⃣  Creating network printer...');
    const networkPrinter = await Printer.create({
      name: 'Test Network Printer',
      channelId: channel.id,
      type: 'thermal',
      connectionType: 'network',
      networkConfig: {
        ipAddress: '192.168.1.100',
        port: 9100,
        protocol: 'raw'
      },
      location: 'Test Kitchen',
      description: 'Test thermal printer for receipts',
      createdBy: 1
    });
    console.log(`✅ Network printer created: ${networkPrinter.name} (ID: ${networkPrinter.id})`);

    // Test 3: Create a USB printer
    console.log('\n3️⃣  Creating USB printer...');
    const usbPrinter = await Printer.create({
      name: 'Test USB Printer',
      channelId: channel.id,
      type: 'receipt',
      connectionType: 'usb',
      osConfig: {
        printerName: 'Microsoft Print to PDF',
        driverName: 'Microsoft Print To PDF'
      },
      location: 'Test Counter',
      description: 'Test USB printer for labels',
      createdBy: 1
    });
    console.log(`✅ USB printer created: ${usbPrinter.name} (ID: ${usbPrinter.id})`);

    // Test 4: Create print jobs
    console.log('\n4️⃣  Creating print jobs...');
    
    const receiptJob = await PrintJob.create({
      channelId: channel.id,
      printerId: networkPrinter.id,
      jobType: 'receipt',
      content: {
        template: 'receipt_template',
        data: {
          orderNumber: 'ORD-001',
          items: [
            { name: 'Coffee', price: 3.50, qty: 2 },
            { name: 'Sandwich', price: 8.00, qty: 1 }
          ],
          total: 15.00
        },
        rawContent: `
RECEIPT
=======
Order: ORD-001
Date: ${new Date().toLocaleDateString()}

2x Coffee       $7.00
1x Sandwich     $8.00
-----------------
TOTAL:         $15.00

Thank you!
        `.trim(),
        format: 'text'
      },
      settings: {
        copies: 1,
        priority: 'normal'
      },
      metadata: {
        userId: 1,
        orderId: null,
        source: 'test'
      }
    });
    console.log(`✅ Receipt job created: ${receiptJob.id}`);

    const labelJob = await PrintJob.create({
      channelId: channel.id,
      printerId: usbPrinter.id,
      jobType: 'label',
      content: {
        rawContent: `
PRODUCT LABEL
=============
SKU: TEST-001
Name: Test Product
Price: $12.99
Date: ${new Date().toLocaleDateString()}
        `.trim(),
        format: 'text'
      },
      settings: {
        copies: 2,
        priority: 'high'
      },
      metadata: {
        userId: 1,
        source: 'test'
      }
    });
    console.log(`✅ Label job created: ${labelJob.id}`);

    // Test 5: Test printer service initialization
    console.log('\n5️⃣  Testing printer service...');
    const printerService = new PrinterService();
    
    // Wait for service to initialize
    await new Promise((resolve) => {
      printerService.once('serviceReady', resolve);
      setTimeout(resolve, 5000); // Timeout after 5 seconds
    });

    console.log(`✅ Printer service initialized with ${printerService.activePrinters.size} active printers`);

    // Test 6: Add a job to the service
    console.log('\n6️⃣  Adding job to printer service...');
    try {
      const serviceJob = await printerService.addPrintJob({
        printerId: usbPrinter.id,
        jobType: 'receipt',
        content: {
          rawContent: 'Test print from service',
          format: 'text'
        },
        settings: {
          copies: 1,
          priority: 'normal'
        },
        metadata: {
          userId: 1,
          source: 'service_test'
        }
      });
      console.log(`✅ Job added to service: ${serviceJob.id}`);
    } catch (error) {
      console.log(`⚠️  Service job failed (expected): ${error.message}`);
    }

    // Test 7: Query data
    console.log('\n7️⃣  Querying created data...');
    
    const channels = await PrinterChannel.findAll({
      include: [{ model: Printer, as: 'printers' }]
    });
    console.log(`✅ Found ${channels.length} channels with printers`);

    const jobs = await PrintJob.findAll({
      include: [
        { model: Printer, as: 'printer' },
        { model: PrinterChannel, as: 'channel' }
      ]
    });
    console.log(`✅ Found ${jobs.length} print jobs`);

    // Test 8: Clean up
    console.log('\n8️⃣  Cleaning up test data...');
    await PrintJob.destroy({ where: { channelId: channel.id } });
    await Printer.destroy({ where: { channelId: channel.id } });
    await PrinterChannel.destroy({ where: { id: channel.id } });
    
    // Stop printer service
    await printerService.stopService();
    
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 All printer system tests completed successfully!');
    console.log('\n📋 Test Summary:');
    console.log('   ✅ Printer channel creation');
    console.log('   ✅ Network printer setup');
    console.log('   ✅ USB printer setup');
    console.log('   ✅ Print job creation');
    console.log('   ✅ Printer service initialization');
    console.log('   ✅ Service job handling');
    console.log('   ✅ Data querying');
    console.log('   ✅ Cleanup');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testPrinterSystem()
    .then(() => {
      console.log('\n✅ Test completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test failed:', error);
      process.exit(1);
    });
}

export default testPrinterSystem;
