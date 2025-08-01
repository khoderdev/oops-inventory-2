import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Discover Windows printers using PowerShell
export const discoverWindowsPrinters = async (req, res) => {
  try {
    // PowerShell command to get installed printers
    const powershellCommand = `
      Get-Printer | Select-Object Name, DriverName, PortName, PrinterStatus, Default, Shared | ConvertTo-Json
    `;

    const { stdout, stderr } = await execAsync(`powershell -Command "${powershellCommand}"`);

    if (stderr) {
      console.error('PowerShell error:', stderr);
      return res.status(500).json({
        success: false,
        message: 'Failed to execute printer discovery command',
        error: stderr
      });
    }

    let printers = [];
    
    try {
      const rawData = JSON.parse(stdout);
      
      // Handle single printer (not array) or multiple printers
      const printersArray = Array.isArray(rawData) ? rawData : [rawData];
      
      printers = printersArray.map(printer => ({
        name: printer.Name || 'Unknown Printer',
        driverName: printer.DriverName || 'Unknown Driver',
        portName: printer.PortName || 'Unknown Port',
        status: printer.PrinterStatus === 0 ? 'Ready' : 
                printer.PrinterStatus === 1 ? 'Paused' : 
                printer.PrinterStatus === 2 ? 'Error' : 
                printer.PrinterStatus === 3 ? 'Pending Deletion' : 
                printer.PrinterStatus === 4 ? 'Paper Jam' : 
                printer.PrinterStatus === 5 ? 'Paper Out' : 
                printer.PrinterStatus === 6 ? 'Manual Feed' : 
                printer.PrinterStatus === 7 ? 'Paper Problem' : 
                printer.PrinterStatus === 8 ? 'Offline' : 'Unknown',
        isDefault: printer.Default === true,
        isShared: printer.Shared === true
      }));

    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      console.log('Raw stdout:', stdout);
      
      // Fallback: try to parse as simple text output
      if (stdout.trim()) {
        return res.status(500).json({
          success: false,
          message: 'Failed to parse printer data',
          error: 'Invalid JSON response from PowerShell'
        });
      }
    }

    res.json({
      success: true,
      printers,
      count: printers.length,
      message: `Found ${printers.length} printer(s)`
    });

  } catch (error) {
    console.error('Error discovering Windows printers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to discover Windows printers',
      error: error.message
    });
  }
};
