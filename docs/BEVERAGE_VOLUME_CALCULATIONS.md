# Enhanced Stock Calculations for All Material Types

## Overview
Enhanced the stock entry system to automatically calculate and display comprehensive quantity information for all material types (volume, mass, package, piece), providing clear visibility into actual inventory amounts with detailed cost breakdowns.

## New StockEntry Fields

### Volume Calculation Fields
- **`volumePerUnit`** (DECIMAL(10,3)): Volume per individual unit (e.g., 75cl per bottle)
- **`volumeUnit`** (STRING): Unit for volumePerUnit (ml, cl, l, etc.)
- **`totalVolume`** (DECIMAL(15,3)): Total volume available (volumePerUnit × individual quantity)
- **`costPerVolumeUnit`** (DECIMAL(10,6)): Cost per volume unit (e.g., cost per cl)

## How It Works

### Automatic Calculation Process
1. **Material Setup**: Materials must have `volumePerUnit` and `volumeUnit` defined
2. **Stock Entry Creation**: When creating stock entries, the system:
   - Copies `volumePerUnit` and `volumeUnit` from the material
   - Calculates `totalVolume` = `purchasedIndividualQuantity` × `volumePerUnit`
   - Calculates `costPerVolumeUnit` = `totalCost` ÷ `totalVolume`

### Example: Stoli Gold (3 boxes = 36 bottles = 2,700cl, $432)

#### Material Configuration
```json
{
  "name": "Stoli Gold",
  "baseUnit": "bottle",
  "unitType": "package",
  "inputUnit": "box",
  "packageQuantity": 12,
  "volumePerUnit": 75,
  "volumeUnit": "cl"
}
```

#### Stock Entry Input
```json
{
  "purchasedQuantity": 3,
  "purchasedUnit": "box",
  "totalCost": 432.00
}
```

#### Automatic Calculations
```json
{
  "purchasedIndividualQuantity": 36,
  "purchasedIndividualUnit": "bottle",
  "volumePerUnit": 75,
  "volumeUnit": "cl",
  "totalVolume": 2700,
  "costPerBaseUnit": 12.00,
  "costPerVolumeUnit": 0.16
}
```

## API Enhancements

### Enhanced Stock Entries Controller
- Added volume fields to field selection
- Updated Material attributes to include `volumePerUnit` and `volumeUnit`
- Enhanced beverage stock controller with volume information

### New Response Format
Stock entries now return comprehensive volume information:
```json
{
  "id": 123,
  "materialId": 45,
  "supplier": "Premium Spirits Ltd",
  "purchasedQuantity": 3,
  "purchasedUnit": "box",
  "purchasedIndividualQuantity": 36,
  "purchasedIndividualUnit": "bottle",
  "volumePerUnit": 75,
  "volumeUnit": "cl",
  "totalVolume": 2700,
  "totalCost": 432.00,
  "costPerBaseUnit": 12.00,
  "costPerVolumeUnit": 0.16,
  "material": {
    "name": "Stoli Gold",
    "volumePerUnit": 75,
    "volumeUnit": "cl"
  }
}
```

## Benefits

### Clear Inventory Visibility
- **Package Level**: Shows boxes/cases purchased
- **Individual Level**: Shows actual bottles/cans available
- **Volume Level**: Shows total liquid volume available
- **Cost Breakdown**: Shows cost per package, per unit, and per volume

### Example Display
```
Stoli Gold - Premium Spirits Ltd
├── Purchased: 3 boxes ($432.00)
├── Available: 36 bottles
├── Total Volume: 2,700cl
├── Cost per bottle: $12.00
└── Cost per cl: $0.16
```

## Database Migration

The system includes a migration to add the new volume fields to existing `stockEntries` table:

```sql
ALTER TABLE stockEntries 
ADD COLUMN volumePerUnit DECIMAL(10,3) NULL COMMENT 'Volume per individual unit (e.g., 75cl per bottle)',
ADD COLUMN volumeUnit VARCHAR(255) NULL COMMENT 'Unit for volumePerUnit (ml, cl, l, etc.)',
ADD COLUMN totalVolume DECIMAL(15,3) NULL COMMENT 'Total volume available (volumePerUnit × individual quantity)',
ADD COLUMN costPerVolumeUnit DECIMAL(10,6) NULL COMMENT 'Cost per volume unit (e.g., cost per cl)';
```

## Integration with Variant System

The enhanced volume calculations work seamlessly with the existing beverage variant deduction system:

1. **Material Volume Setup**: Materials define base volume per unit
2. **Stock Entry Calculations**: Automatic volume and cost calculations
3. **Variant Deductions**: Precise volume-based deductions using existing utilities
4. **FIFO Stock Updates**: Volume-aware stock deduction with clear remaining quantities

## Usage

### For Materials with Volume Information
1. Set `volumePerUnit` and `volumeUnit` on the Material
2. Create stock entries normally
3. Volume calculations happen automatically
4. API responses include comprehensive volume data

### For Non-Beverage Materials
- Volume fields remain null
- Standard quantity and cost calculations continue as before
- No impact on existing functionality

This enhancement provides the clear volume-based stock visibility requested while maintaining full backward compatibility with existing stock management workflows.
