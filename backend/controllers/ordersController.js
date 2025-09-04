import { Op } from "sequelize";
import sequelize from "../config/database.js";
import { auditOrderOperation } from "../middleware/auditMiddleware.js";
import { Assignment, Material, StockEntry, MenuItem, MenuItemIngredient, MenuItemSauce, Sauce, OrderItem, Order, User, Printer, Variants, VariantIngredient, Table, PrintJob, PrinterChannel } from "../models/index.js";
import salesController from "./salesController.js";
import { generateSequentialOrderNumber } from "../utils/orderNumberGenerator.js";
import { convertVolumeWithMaterial } from "../utils/volumeConversionUtils.js";

// Helper function to deduct stock for variant ingredients
const deductVariantIngredientStock = async (menuItem, selectedVariant, orderQuantity, fullItemName, transaction) => {
  const deductionId = Math.random().toString(36).substring(2, 8);
  console.log(`🍹 [${deductionId}] Starting variant ingredient stock deduction for: ${menuItem.name}`);

  // Try to detect variant from item name if selectedVariant is null
  let detectedVariant = selectedVariant;
  if (!selectedVariant) {
    const itemNameToCheck = fullItemName || menuItem.name;
    console.log(`🔍 [${deductionId}] Checking for variant in item name: "${itemNameToCheck}"`);
    detectedVariant = await detectVariantFromItemName(menuItem.id, itemNameToCheck, deductionId, transaction);
  }

  if (!detectedVariant) {
    console.log(`⚠️ [${deductionId}] No variant detected for beverage: ${menuItem.name}`);
    return false;
  }

  console.log(`🥃 [${deductionId}] Processing beverage variant: ${detectedVariant.name}`);

  // Get variant ingredients
  const variantIngredients = await VariantIngredient.findAll({
    where: { variantId: detectedVariant.id, isActive: true },
    include: [
      { model: Material, as: "material" },
      { model: Sauce, as: "sauce" }
    ],
    transaction
  });

  if (variantIngredients.length === 0) {
    console.log(`⚠️ [${deductionId}] No ingredients found for variant: ${detectedVariant.name}`);
    return false;
  }

  console.log(`🧪 [${deductionId}] Found ${variantIngredients.length} variant ingredients for ${detectedVariant.name}`);

  // Process each variant ingredient
  for (const variantIngredient of variantIngredients) {
    const ingredient = variantIngredient.material || variantIngredient.sauce;
    const ingredientType = variantIngredient.material ? "material" : "sauce";

    console.log(`🔄 [${deductionId}] Processing variant ingredient: ${ingredient.name}, quantity: ${variantIngredient.quantity} ${variantIngredient.unit}`);

    if (ingredientType === "material") {
      // Calculate total quantity needed
      const totalQuantityNeeded = parseFloat(variantIngredient.quantity) * orderQuantity;
      console.log(`📊 [${deductionId}] Total quantity needed: ${totalQuantityNeeded} ${variantIngredient.unit}`);

      // Convert to material's base unit if needed
      let quantityToDeduct = totalQuantityNeeded;
      console.log(`🔄 [${deductionId}] Original unit: ${variantIngredient.unit}, Material base unit: ${ingredient.baseUnit}`);

      if (variantIngredient.unit !== ingredient.baseUnit) {
        console.log(`🔄 [${deductionId}] Unit conversion needed from ${variantIngredient.unit} to ${ingredient.baseUnit}`);
        try {
          quantityToDeduct = convertVolumeWithMaterial(totalQuantityNeeded, variantIngredient.unit, ingredient.baseUnit, ingredient);
          console.log(`🔄 [${deductionId}] Converted ${totalQuantityNeeded} ${variantIngredient.unit} to ${quantityToDeduct} ${ingredient.baseUnit}`);
        } catch (conversionError) {
          console.warn(`⚠️ [${deductionId}] Volume conversion failed:`, conversionError);
          console.warn(`⚠️ [${deductionId}] Using original quantity: ${quantityToDeduct}`);
        }
      } else {
        console.log(`✅ [${deductionId}] Units match, no conversion needed`);
      }

      console.log(`➡️ [${deductionId}] Final quantity to deduct: ${quantityToDeduct} ${ingredient.baseUnit || variantIngredient.unit}`);

      await deductStockFromMaterial(ingredient.id, quantityToDeduct, `${menuItem.name} (${detectedVariant.name} variant)`, transaction);
      console.log(`✅ [${deductionId}] Deducted ${quantityToDeduct} ${ingredient.baseUnit} of ${ingredient.name} for variant ${detectedVariant.name}`);
    }
    // TODO: Add sauce handling if needed
  }

  console.log(`🎯 [${deductionId}] Completed variant ingredient deduction for: ${menuItem.name} (${detectedVariant.name})`);
  return true;
};

// Function to deduct stock from a material
const deductStockFromMaterial = async (materialId, quantityToDeduct, deductionReason, transaction) => {
  try {
    const deductionId = Math.random().toString(36).substring(2, 8);
    console.log(`🔄 [${deductionId}] Deducting ${quantityToDeduct} units from material ID ${materialId} for: ${deductionReason}`);

    // Find the material
    const material = await Material.findByPk(materialId, { transaction });
    if (!material) {
      console.error(`❌ [${deductionId}] Material ID ${materialId} not found`);
      return false;
    }

    // Find available stock entries for this material, ordered by purchase date (FIFO)
    const stockEntries = await StockEntry.findAll({
      where: { materialId },
      order: [["purchaseDate", "ASC"]],
      transaction
    });

    if (stockEntries.length === 0) {
      console.warn(`⚠️ [${deductionId}] No stock entries found for material: ${material.name} (ID: ${materialId})`);
      return false;
    }

    let remainingQuantityToDeduct = quantityToDeduct;
    let deductedEntries = [];

    // Determine which field to use based on material type
    let fieldToCheck, availableUnit, deductionUnit;
    if (material.unitType === "volume") {
      fieldToCheck = "totalVolume";
      availableUnit = "ml";
      deductionUnit = "ml";
    } else if (material.unitType === "mass") {
      fieldToCheck = "totalMass";
      availableUnit = "g";
      deductionUnit = "g";
    } else if (material.unitType === "package" && material.volumePerUnit) {
      // For package materials with volume data, use totalVolume but convert deduction to ml
      fieldToCheck = "totalVolume";
      availableUnit = "ml";
      deductionUnit = "ml"; // We need to convert the deduction quantity to ml
    } else {
      fieldToCheck = "purchasedIndividualQuantity";
      availableUnit = material.baseUnit;
      deductionUnit = material.baseUnit;
    }

    console.log(`🔍 [${deductionId}] Material info: ${material.name} (ID: ${materialId})`);
    console.log(`🔍 [${deductionId}] Material type: ${material.unitType}, baseUnit: ${material.baseUnit}`);
    console.log(`🔍 [${deductionId}] Volume per unit: ${material.volumePerUnit} ${material.volumeUnit}`);
    console.log(`🔍 [${deductionId}] Using ${fieldToCheck} field for deduction`);
    console.log(`🔍 [${deductionId}] Deduction quantity: ${quantityToDeduct} ${material.baseUnit}, needs conversion to: ${deductionUnit}`);

    // Convert deduction quantity to the correct unit for the field being updated
    let convertedQuantityToDeduct = quantityToDeduct;
    if (material.unitType === "package" && material.volumePerUnit && deductionUnit === "ml" && material.baseUnit === "bottle") {
      // Convert bottles to ml for totalVolume field
      const volumePerUnitInMl = material.volumeUnit === "cl" ? material.volumePerUnit * 10 : material.volumePerUnit;
      convertedQuantityToDeduct = quantityToDeduct * volumePerUnitInMl;
      console.log(`🔄 [${deductionId}] Converting deduction: ${quantityToDeduct} bottles × ${volumePerUnitInMl}ml = ${convertedQuantityToDeduct}ml`);
    }

    remainingQuantityToDeduct = convertedQuantityToDeduct;

    // Deduct from stock entries using FIFO method
    for (const entry of stockEntries) {
      if (remainingQuantityToDeduct <= 0) break;

      // Get available quantity from the appropriate field
      let availableQuantity;
      if (fieldToCheck === "totalVolume") {
        availableQuantity = parseFloat(entry.totalVolume || 0);
      } else if (fieldToCheck === "totalMass") {
        availableQuantity = parseFloat(entry.totalMass || 0);
      } else {
        availableQuantity = parseInt(entry.purchasedIndividualQuantity || 0, 10);
      }

      console.log(`📦 [${deductionId}] Stock entry ID ${entry.id} has ${availableQuantity} ${availableUnit} available`);
      console.log(`📦 [${deductionId}] Entry details: purchasedIndividualQuantity=${entry.purchasedIndividualQuantity}, totalVolume=${entry.totalVolume}, purchasedQuantity=${entry.purchasedQuantity}`);
      if (availableQuantity <= 0) continue;

      // Calculate how much to deduct from this entry
      const quantityToDeductFromEntry = Math.min(availableQuantity, remainingQuantityToDeduct);
      console.log(`📊 [${deductionId}] Deducting ${quantityToDeductFromEntry} ${deductionUnit} from ${availableQuantity} ${availableUnit} available`);
      remainingQuantityToDeduct -= quantityToDeductFromEntry;

      // Update the appropriate fields
      let updates = {};

      if (fieldToCheck === "totalVolume") {
        // The quantityToDeductFromEntry is already in the correct unit (ml) for totalVolume field
        // because we converted it earlier if needed
        const quantityToDeductInMl = quantityToDeductFromEntry;
        console.log(`🧪 [${deductionId}] Volume deduction: ${availableQuantity}ml - ${quantityToDeductInMl}ml = ${availableQuantity - quantityToDeductInMl}ml`);

        const newTotalVolume = Math.max(0, availableQuantity - quantityToDeductInMl);
        updates.totalVolume = newTotalVolume;

        // Also update purchasedIndividualQuantity to maintain consistency
        // We need to calculate how many individual units remain based on the new total volume
        if (material.unitType === "package" && material.volumePerUnit) {
          const volumePerUnitInMl = material.volumeUnit === "cl" ? material.volumePerUnit * 10 : material.volumePerUnit;
          let newIndividualQuantity;

          if (newTotalVolume <= 0) {
            newIndividualQuantity = 0;
          } else {
            // Keep at least 1 unit if there's any volume remaining to prevent the model hook from nullifying totalVolume
            newIndividualQuantity = Math.max(1, Math.ceil(newTotalVolume / volumePerUnitInMl));
          }

          updates.purchasedIndividualQuantity = newIndividualQuantity;
          console.log(`🔢 [${deductionId}] Updating individual quantity: ${newTotalVolume}ml ÷ ${volumePerUnitInMl}ml = ${newIndividualQuantity} (keeping min 1 if volume > 0)`);
        }
      } else if (fieldToCheck === "totalMass") {
        updates.totalMass = Math.max(0, availableQuantity - quantityToDeductFromEntry);
      } else {
        // For purchasedIndividualQuantity, ensure it's an integer
        const newQuantity = Math.max(0, availableQuantity - quantityToDeductFromEntry);
        console.log(`🔢 [${deductionId}] Calculating new quantity: ${availableQuantity} - ${quantityToDeductFromEntry} = ${newQuantity}`);
        updates.purchasedIndividualQuantity = Math.floor(newQuantity);
      }

      // Also update the legacy fields for backward compatibility
      if (material.unitType === "package" && material.packageQuantity > 0) {
        // For packages, we need to convert back to the original purchased units
        let deductionInPurchasedUnits;
        if (fieldToCheck === "totalVolume" && material.baseUnit === "bottle") {
          // Convert ml back to bottles for purchased quantity calculation
          const volumePerUnitInMl = material.volumeUnit === "cl" ? material.volumePerUnit * 10 : material.volumePerUnit;
          const deductionInBottles = quantityToDeductFromEntry / volumePerUnitInMl;
          deductionInPurchasedUnits = deductionInBottles / material.packageQuantity;
          console.log(`💰 [${deductionId}] Package calculation: ${quantityToDeductFromEntry}ml ÷ ${volumePerUnitInMl}ml = ${deductionInBottles} bottles ÷ ${material.packageQuantity} = ${deductionInPurchasedUnits}`);
        } else {
          deductionInPurchasedUnits = quantityToDeductFromEntry / material.packageQuantity;
          console.log(`💰 [${deductionId}] Package calculation: ${quantityToDeductFromEntry} ÷ ${material.packageQuantity} = ${deductionInPurchasedUnits}`);
        }
        const newPurchasedQuantity = Math.max(0, parseFloat(entry.purchasedQuantity || 0) - deductionInPurchasedUnits);
        console.log(`💰 [${deductionId}] Final package calculation: ${entry.purchasedQuantity} - ${deductionInPurchasedUnits} = ${newPurchasedQuantity}`);
        updates.purchasedQuantity = newPurchasedQuantity;
      } else {
        // For other types, update directly
        const newPurchasedQuantity = Math.max(0, parseFloat(entry.purchasedQuantity || 0) - quantityToDeductFromEntry);
        console.log(`💰 [${deductionId}] Direct calculation: ${entry.purchasedQuantity} - ${quantityToDeductFromEntry} = ${newPurchasedQuantity}`);
        updates.purchasedQuantity = newPurchasedQuantity;
      }

      // Ensure all numeric fields have proper types
      if (updates.purchasedIndividualQuantity !== undefined) {
        updates.purchasedIndividualQuantity = Math.floor(updates.purchasedIndividualQuantity);
      }

      // Log the update values for debugging
      console.log(`🔢 [${deductionId}] Update values for stock entry ID ${entry.id}:`, JSON.stringify(updates));

      // Update the stock entry
      await entry.update(updates, { transaction });

      // Verify the update was successful
      await entry.reload({ transaction });
      console.log(`✅ [${deductionId}] After update - Entry ${entry.id}: purchasedIndividualQuantity=${entry.purchasedIndividualQuantity}, totalVolume=${entry.totalVolume}, purchasedQuantity=${entry.purchasedQuantity}`);

      deductedEntries.push({
        entryId: entry.id,
        deducted: quantityToDeductFromEntry,
        remaining: updates[fieldToCheck]
      });

      console.log(`✅ [${deductionId}] Deducted ${quantityToDeductFromEntry} ${availableUnit} from stock entry ID ${entry.id}, remaining: ${updates[fieldToCheck]} ${availableUnit}`);
    }

    if (remainingQuantityToDeduct > 0) {
      console.warn(`⚠️ [${deductionId}] Insufficient stock for complete deduction. Remaining: ${remainingQuantityToDeduct} ${availableUnit}`);
    }

    return deductedEntries.length > 0;
  } catch (error) {
    console.error(`❌ Error deducting stock from material ID ${materialId}:`, error);
    throw error;
  }
};

// Helper function to detect variant from item name when selectedVariant is null
const detectVariantFromItemName = async (menuItemId, itemName, deductionId, transaction) => {
  try {
    // Extract variant name from item name like "Long Island (glass - 200ml)"
    const variantMatch = itemName.match(/\(([^-]+)\s*-\s*([^)]+)\)/);
    if (!variantMatch) {
      console.log(`🔍 [${deductionId}] No variant pattern found in item name: ${itemName}`);
      return null;
    }

    const variantName = variantMatch[1].trim();
    console.log(`🔍 [${deductionId}] Detected variant name from item: ${variantName}`);

    // Find the variant in the database
    const variant = await Variants.findOne({
      where: {
        menuItemId: menuItemId,
        name: { [Op.iLike]: variantName }
      },
      transaction
    });

    if (variant) {
      console.log(`✅ [${deductionId}] Found variant: ${variant.name} (ID: ${variant.id})`);
      return variant;
    } else {
      console.log(`❌ [${deductionId}] Variant not found: ${variantName} for menu item ${menuItemId}`);
      return null;
    }
  } catch (error) {
    console.error(`❌ [${deductionId}] Error detecting variant:`, error);
    return null;
  }
};

export const deductIngredientStock = async (menuItemId, orderQuantity, transaction, selectedVariant = null, fullItemName = null) => {
  const deductionId = Math.random().toString(36).substr(2, 9);
  try {
    console.log(`🔍 [${deductionId}] Deducting stock for menu item ID: ${menuItemId}, quantity: ${orderQuantity}`);

    // Log variant information if provided
    if (selectedVariant) {
      console.log(`🥃 [${deductionId}] Selected variant: ${selectedVariant.name}, volume: ${selectedVariant.volume}${selectedVariant.unit}`);
    }

    // Fetch menu item with both ingredients and sauces
    console.log(`🔍 [${deductionId}] Fetching menu item with ID: ${menuItemId}`);
    // First, get the menu item with basic info
    const menuItem = await MenuItem.findByPk(menuItemId, {
      attributes: ["id", "name", "description", "price", "unit"],
      transaction
    });

    if (!menuItem) {
      console.error(`❌ [${deductionId}] Menu item not found: ${menuItemId}`);
      return;
    }

    console.log(`✅ [${deductionId}] Found menu item: ${menuItem.name} (ID: ${menuItem.id})`);

    // Then get ingredients, sauces, and variants separately to avoid complex joins that might fail
    const [menuItemIngredients, menuItemSauces, variants] = await Promise.all([
      MenuItemIngredient.findAll({
        where: { menuItemId },
        include: [
          {
            model: Material,
            as: "material",
            attributes: ["id", "name"] // Only include existing columns
          }
        ],
        transaction
      }),
      MenuItemSauce.findAll({
        where: { menuItemId },
        include: [
          {
            model: Sauce,
            as: "sauce",
            attributes: ["id", "name"] // Removed availableQuantity as it doesn't exist
          }
        ],
        transaction
      }),
      Variants.findAll({
        where: { menuItemId },
        include: [
          {
            model: VariantIngredient,
            as: "ingredients",
            include: [
              { model: Material, as: "material" },
              { model: Sauce, as: "sauce" }
            ]
          }
        ],
        transaction
      })
    ]);

    // Attach to menuItem for consistency with existing code
    menuItem.menuItemIngredients = menuItemIngredients;
    menuItem.menuItemSauces = menuItemSauces;
    menuItem.variants = variants;

    if (!menuItem) {
      console.error(`❌ [${deductionId}] Menu item not found: ${menuItemId}`);
      return;
    }

    console.log(`✅ [${deductionId}] Found menu item: ${menuItem.name} (ID: ${menuItem.id})`);

    // Log all ingredients and sauces
    console.log(`📋 [${deductionId}] Menu item details:`, {
      name: menuItem.name,
      hasIngredients: menuItem.menuItemIngredients?.length > 0,
      ingredientCount: menuItem.menuItemIngredients?.length || 0,
      hasSauces: menuItem.menuItemSauces?.length > 0,
      sauceCount: menuItem.menuItemSauces?.length || 0
    });

    // Log variants and their ingredients
    if (menuItem.variants?.length > 0) {
      console.log(`🍾 [${deductionId}] Variants for ${menuItem.name}:`);
      menuItem.variants.forEach((variant, idx) => {
        console.log(`   ${idx + 1}. ${variant.name} - ${variant.volume}${variant.unit} ($${variant.price})`);
        if (variant.ingredients?.length > 0) {
          console.log(`      Ingredients:`);
          variant.ingredients.forEach((ing, ingIdx) => {
            console.log(`         ${ingIdx + 1}. ${ing.quantity} ${ing.unit} of ${ing.material?.name || "Unknown"} (Material ID: ${ing.materialId})`);
          });
        } else {
          console.log(`      No ingredients found for variant ${variant.name}`);
        }
      });
    } else {
      console.log(`📋 [${deductionId}] No variants found for menu item "${menuItem.name}"`);
    }

    // Log each ingredient with details
    if (menuItem.menuItemIngredients?.length > 0) {
      console.log(`📦 [${deductionId}] Ingredients for ${menuItem.name}:`);
      menuItem.menuItemIngredients.forEach((ing, idx) => {
        console.log(`   ${idx + 1}. ${ing.quantity} ${ing.unit} of ${ing.material?.name || "Unknown"} (Material ID: ${ing.materialId})`);
        console.log(`      - Material details:`, {
          id: ing.material?.id,
          name: ing.material?.name,
          unit: ing.material?.unit,
          purchaseUnit: ing.material?.purchaseUnit,
          conversionFactor: ing.material?.conversionFactor
        });
      });
    }

    // Log each sauce with details
    if (menuItem.menuItemSauces?.length > 0) {
      console.log(`🥫 [${deductionId}] Sauces for ${menuItem.name}:`);
      menuItem.menuItemSauces.forEach((sauce, idx) => {
        console.log(`   ${idx + 1}. ${sauce.quantity} ${sauce.unit} of ${sauce.sauce?.name || "Unknown"} (Sauce ID: ${sauce.sauceId})`);
        console.log(`      - Sauce details:`, {
          id: sauce.sauce?.id,
          name: sauce.sauce?.name,
          availableQuantity: sauce.sauce?.availableQuantity
        });
      });
    }

    // Combine ingredients + sauces for deduction
    const allIngredients = [...(menuItem.menuItemIngredients || []).map(i => ({ ...i.toJSON(), type: "ingredient" })), ...(menuItem.menuItemSauces || []).map(s => ({ ...s.toJSON(), type: "sauce" }))];

    if (allIngredients.length === 0) {
      console.log(`🍾 [${deductionId}] No ingredients or sauces found for menu item "${menuItem.name}"`);

      // Try variant ingredient deduction first
      const variantDeductionSuccess = await deductVariantIngredientStock(menuItem, selectedVariant, orderQuantity, fullItemName, transaction);

      if (variantDeductionSuccess) {
        console.log(`🎯 [${deductionId}] Successfully processed variant ingredients for: ${menuItem.name}`);
        return; // Exit early since we processed variant ingredients
      }

      // Fallback: Try to find matching material by name for simple deduction
      console.log(`🔍 [${deductionId}] Attempting fallback material matching for: ${menuItem.name}`);
      const matchingMaterial = await Material.findOne({
        where: { name: { [Op.iLike]: `%${menuItem.name}%` } },
        transaction
      });

      if (matchingMaterial) {
        console.log(`🔄 [${deductionId}] Found matching material by name: ${matchingMaterial.name} (ID: ${matchingMaterial.id})`);
        await deductStockFromMaterial(matchingMaterial.id, orderQuantity, menuItem.name, transaction);
      } else {
        console.log(`ℹ️ [${deductionId}] No matching material found for: ${menuItem.name}`);
      }
      return;
    }

    console.log(`📋 [${deductionId}] Processing ${allIngredients.length} ingredients/sauces for "${menuItem.name}"`);

    for (const [index, ingredient] of allIngredients.entries()) {
      console.log(`
🔍 [${deductionId}] Processing ${ingredient.type} ${index + 1}/${allIngredients.length}:`);
      console.log(`   - Type: ${ingredient.type}`);
      console.log(`   - Name: ${ingredient.material?.name || ingredient.sauce?.name || "Unknown"}`);
      console.log(`   - ID: ${ingredient.materialId || ingredient.sauceId}`);
      console.log(`   - Required: ${ingredient.quantity} ${ingredient.unit} × ${orderQuantity} = ${ingredient.quantity * orderQuantity} ${ingredient.unit}`);

      if (ingredient.type === "sauce") {
        // Handle sauce deduction
        if (ingredient.sauce) {
          const requiredQuantity = Number((ingredient.quantity * orderQuantity).toFixed(6));

          // Fetch the current sauce to get the current yield quantity
          const sauce = await Sauce.findByPk(ingredient.sauceId, { transaction });
          if (!sauce) {
            console.warn(`⚠️ [${deductionId}] Sauce with ID ${ingredient.sauceId} not found`);
            continue;
          }

          const currentYield = parseFloat(sauce.yieldQuantity);
          const minYield = 0.001; // Minimum allowed yield quantity
          const newYield = Math.max(minYield, currentYield - requiredQuantity);

          console.log(`🥫 [${deductionId}] Deducting ${requiredQuantity} ${ingredient.unit} from sauce: ${ingredient.sauce.name} (Current yield: ${currentYield} ${sauce.unit})`);

          // Check if there's enough sauce available
          if (currentYield < requiredQuantity) {
            throw new Error(`Not enough ${ingredient.sauce.name} available. Required: ${requiredQuantity} ${ingredient.unit}, Available: ${currentYield} ${sauce.unit}`);
          }

          // Update the sauce's yield quantity
          await Sauce.update(
            {
              yieldQuantity: newYield,
              updatedAt: new Date()
            },
            {
              where: { id: ingredient.sauceId },
              transaction,
              validate: true
            }
          );

          console.log(`✅ [${deductionId}] Deducted ${requiredQuantity} ${sauce.unit} from ${ingredient.sauce.name}. New yield: ${newYield} ${sauce.unit}`);
        }
        continue;
      }

      // Handle regular material/ingredient deduction
      const material = ingredient.material;
      if (!material) {
        console.warn(`⚠️ [${deductionId}] No material found for ${ingredient.type} ID ${ingredient.id}`);
        continue;
      }

      const materialId = material.id;
      const requiredQuantity = ingredient.quantity * orderQuantity;
      // Use the unit from the ingredient if available, otherwise default to 'unit' or 'piece'
      const unit = ingredient.unit || "unit";

      console.log(`📦 [${deductionId}] Looking for stock entries for material: ${material.name} (ID: ${materialId})`);
      console.log(`📋 [${deductionId}] Material details: unitType=${material.unitType}, baseUnit=${material.baseUnit}`);
      console.log(`📏 [${deductionId}] Required: ${requiredQuantity} ${unit}`);

      const stockEntries = await StockEntry.findAll({
        where: {
          materialId,
          [Op.or]: [{ totalVolume: { [Op.gt]: 0 } }, { totalMass: { [Op.gt]: 0 } }, { totalPieces: { [Op.gt]: 0 } }, { purchasedIndividualQuantity: { [Op.gt]: 0 } }, { purchasedIndividualQuantity: null, purchasedQuantity: { [Op.gt]: 0 } }]
        },
        order: [["purchaseDate", "ASC"]],
        transaction
      });

      console.log(`📊 [${deductionId}] Found ${stockEntries.length} stock entries for ${material.name}`);

      // Log each stock entry details
      stockEntries.forEach((entry, idx) => {
        console.log(`   📦 Entry #${idx + 1} (ID: ${entry.id}):`);
        console.log(`      - totalVolume: ${entry.totalVolume}`);
        console.log(`      - totalMass: ${entry.totalMass}`);
        console.log(`      - totalPieces: ${entry.totalPieces}`);
        console.log(`      - purchasedQuantity: ${entry.purchasedQuantity}`);
        console.log(`      - purchasedIndividualQuantity: ${entry.purchasedIndividualQuantity}`);
      });

      if (stockEntries.length === 0) {
        console.warn(`⚠️ [${deductionId}] No available stock entries found for material: ${material.name}`);
        continue;
      }

      let remainingToDeduct = requiredQuantity;
      console.log(`➖ [${deductionId}] Need to deduct ${remainingToDeduct} ${unit} of ${material.name}`);

      for (const [idx, stockEntry] of stockEntries.entries()) {
        if (remainingToDeduct <= 0) break;

        // Determine which calculated field to use based on material type and available data
        let availableQuantity = 0;
        let fieldToUpdate = null;
        let unitType = "unknown";

        // Better detection logic
        if (stockEntry.totalVolume > 0 && (material.unitType === "volume" || material.unitType === "package" || material.name.toLowerCase().includes("sauce"))) {
          availableQuantity = stockEntry.totalVolume;
          fieldToUpdate = "totalVolume";
          unitType = "volume";
        } else if (stockEntry.totalMass > 0 && (material.unitType === "mass" || material.unitType === undefined || material.unitType === null)) {
          // Handle undefined unitType by assuming mass for food items
          availableQuantity = stockEntry.totalMass;
          fieldToUpdate = "totalMass";
          unitType = "mass";
        } else if (stockEntry.totalPieces > 0 && (material.unitType === "piece" || material.unitType === "package")) {
          availableQuantity = stockEntry.totalPieces;
          fieldToUpdate = "totalPieces";
          unitType = "pieces";
        } else {
          // Smart fallback based on material name and available data
          if (material.name.toLowerCase().includes("sauce") && stockEntry.totalVolume !== null) {
            availableQuantity = stockEntry.totalVolume || 0;
            fieldToUpdate = "totalVolume";
            unitType = "volume";
          } else if ((material.name.toLowerCase().includes("chicken") || material.name.toLowerCase().includes("onion") || material.name.toLowerCase().includes("pepper")) && stockEntry.totalMass !== null) {
            availableQuantity = stockEntry.totalMass || 0;
            fieldToUpdate = "totalMass";
            unitType = "mass";
          } else if (stockEntry.purchasedIndividualQuantity !== null) {
            availableQuantity = stockEntry.purchasedIndividualQuantity;
            fieldToUpdate = "purchasedIndividualQuantity";
            unitType = "fallback";
          } else {
            availableQuantity = stockEntry.purchasedQuantity || 0;
            fieldToUpdate = "purchasedQuantity";
            unitType = "fallback";
          }
        }

        const deductAmount = Math.min(remainingToDeduct, availableQuantity);
        const newQuantity = Math.max(0, availableQuantity - deductAmount);

        console.log(`🔍 [${deductionId}] Material analysis: ${material.name}`);
        console.log(`🔍 [${deductionId}] Unit type: ${material.unitType}`);
        console.log(`🔍 [${deductionId}] Available stock fields: volume=${stockEntry.totalVolume}, mass=${stockEntry.totalMass}, pieces=${stockEntry.totalPieces}`);
        console.log(`🔍 [${deductionId}] Selected field: ${fieldToUpdate} with value: ${availableQuantity}`);

        console.log(`   📦 Stock Entry #${idx + 1}:`);
        console.log(`      - Current Quantity: ${availableQuantity} (${unitType})`);
        console.log(`      - Will deduct: ${deductAmount} ${unit}`);
        console.log(`      - New Quantity: ${newQuantity}`);

        // Update the appropriate field
        const updateData = { [fieldToUpdate]: newQuantity };

        // Also update cost per unit if we're updating calculated fields
        if (unitType === "volume" && newQuantity > 0 && stockEntry.totalCost > 0) {
          updateData.costPerVolumeUnit = Math.round((stockEntry.totalCost / newQuantity) * 1000000) / 1000000;
        } else if (unitType === "mass" && newQuantity > 0 && stockEntry.totalCost > 0) {
          updateData.costPerMassUnit = Math.round((stockEntry.totalCost / newQuantity) * 1000000) / 1000000;
        } else if (unitType === "pieces" && newQuantity > 0 && stockEntry.totalCost > 0) {
          updateData.costPerPiece = Math.round((stockEntry.totalCost / newQuantity) * 1000000) / 1000000;
        }

        console.log(`      - Updating ${fieldToUpdate} from ${availableQuantity} to ${newQuantity}`);
        await stockEntry.update(updateData, { transaction });

        remainingToDeduct -= deductAmount;
        console.log(`      ✅ Deducted ${deductAmount} ${unit}. Remaining to deduct: ${remainingToDeduct} ${unit}`);
      }

      if (remainingToDeduct > 0) {
        console.warn(`⚠️ [${deductionId}] Insufficient stock for ${material.name}. Short by: ${remainingToDeduct} ${unit}`);
      } else {
        console.log(`✅ [${deductionId}] Successfully deducted all required stock for ${material.name}`);
      }
    }

    console.log(`🎉 Stock deduction completed for menu item: ${menuItem.name}`);
  } catch (error) {
    console.error(`❌ Error deducting ingredient stock for menu item ID ${menuItemId}:`, error);
    throw error;
  }
};

export const ordersController = {
  createOrder: async (req, res) => {
    console.log(`🔄 Starting order creation with new transaction`);
    const transaction = await sequelize.transaction();
    console.log(`🔄 Transaction created with ID: ${transaction.id}`);
    try {
      const { orderNumber, orderType, tableId, customerName, customerPhone, customerAddress, notes, items = [], discountType, discountValue, discountAmount, discountReason } = req.body;
      const userId = req.user?.id;
      let finalOrderNumber = orderNumber;
      if (!finalOrderNumber) {
        try {
          finalOrderNumber = await generateSequentialOrderNumber();
        } catch (error) {
          console.error("Error generating order number:", error);
          const timestamp = Date.now().toString().slice(-4);
          finalOrderNumber = `ORD-${timestamp}`;
        }
      }
      const tenSecondsAgo = new Date(Date.now() - 10000);
      const duplicateCheckWhere = {
        createdBy: userId,
        orderType: orderType || "takeaway",
        createdAt: {
          [Op.gte]: tenSecondsAgo
        }
      };
      if (tableId !== null && tableId !== undefined) {
        duplicateCheckWhere.tableId = tableId;
      } else {
        duplicateCheckWhere.tableId = null;
      }
      const recentOrder = await Order.findOne({
        where: duplicateCheckWhere,
        include: [
          {
            model: OrderItem,
            as: "items"
          }
        ],
        order: [["createdAt", "DESC"]],
        transaction
      });
      if (recentOrder && items.length > 0 && recentOrder.items.length === items.length) {
        const itemsMatch = items.every(item => recentOrder.items.some(orderItem => orderItem.menuItemId === item.menuItemId && orderItem.materialId === item.materialId && orderItem.name === item.name && orderItem.quantity === item.quantity && Math.abs(parseFloat(orderItem.unitPrice) - parseFloat(item.unitPrice)) < 0.01));
        if (itemsMatch) {
          console.log(`🔄 Duplicate order detected - returning existing order ${recentOrder.orderNumber} (ID: ${recentOrder.id}) instead of creating new one`);
          console.log(`🔄 Duplicate check details: userId=${userId}, orderType=${orderType}, tableId=${tableId}, itemsCount=${items.length}`);
          await transaction.commit();
          return res.status(200).json({
            success: true,
            data: recentOrder,
            message: "Order already exists"
          });
        }
      }
      await new Promise(resolve => setTimeout(resolve, 100));
      const order = await Order.create(
        {
          orderNumber: finalOrderNumber,
          orderType: orderType || "takeaway",
          tableId: tableId || null,
          customerName,
          customerPhone,
          customerAddress,
          notes,
          discountType: discountType || null,
          discountValue: discountValue || null,
          discountAmount: discountAmount || 0,
          discountReason: discountReason || null,
          createdBy: userId,
          updatedBy: userId
        },
        { transaction }
      );
      if (tableId) {
        const table = await Table.findByPk(tableId, { transaction });
        if (table && table.status === "available") {
          await table.update({ status: "opened" }, { transaction });
        }
      }
      if (items.length > 0) {
        const orderItems = await Promise.all(
          items.map(async item => {
            const orderItemData = {
              orderId: order.id,
              materialId: item.materialId || null,
              menuItemId: item.menuItemId || null,
              assignmentId: item.assignmentId || null,
              name: item.name,
              type: item.type,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
              notes: item.notes,
              selectedVariant: item.selectedVariant || null
            };
            const orderItem = await OrderItem.create(orderItemData, { transaction });
            try {
              if (item.type === "menu_item" && item.menuItemId) {
                console.log(`🍽️ Processing menu item for stock deduction: ${item.name} (ID: ${item.menuItemId}), Quantity: ${item.quantity}`);

                // Check if this item has a selected variant
                if (item.selectedVariant) {
                  console.log(`🥃 Found selected variant for ${item.name}: ${item.selectedVariant.name}`);
                  await deductIngredientStock(item.menuItemId, item.quantity, transaction, item.selectedVariant);
                } else {
                  await deductIngredientStock(item.menuItemId, item.quantity, transaction, null, item.name);
                }
              }
            } catch (stockError) {
              console.error(`❌ Stock deduction failed for ${item.type} ${item.name}:`, stockError);
              // Continue with order creation but log the error
            }
            return orderItem;
          })
        );
        const subtotal = orderItems.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0);
        const tax = 0;
        const discountAmountValue = parseFloat(discountAmount) || 0;
        const total = Math.max(0, subtotal - discountAmountValue);
        await order.update({ subtotal, tax, total }, { transaction });
      }
      console.log(`✅ About to commit transaction ID: ${transaction.id}`);
      await transaction.commit();
      console.log(`✅ Transaction committed successfully. ID: ${transaction.id}`);

      // Verify stock entries after commit
      if (items.some(item => item.name.toLowerCase().includes("long island"))) {
        console.log(`🔍 Verifying Long Island stock entries after transaction commit:`);
        const stockEntries = await StockEntry.findAll({
          where: {
            materialId: [228, 231, 160] // Bombay Gin, Jager, Stoli Gold
          }
        });
        stockEntries.forEach(entry => {
          console.log(`📊 Material ID: ${entry.materialId}, totalVolume: ${entry.totalVolume}`);
        });
      }

      const completeOrder = await Order.findByPk(order.id, {
        include: [
          {
            model: OrderItem,
            as: "items",
            include: [
              { model: Material, as: "material" },
              { model: MenuItem, as: "menuItem" },
              { model: Assignment, as: "assignment" }
            ]
          },
          { model: Table, as: "table" },
          { model: User, as: "creator" }
        ]
      });
      if (userId) {
        await auditOrderOperation(userId, "CREATE", completeOrder.toJSON(), null, req);
      }
      res.status(201).json({ message: "Order created successfully", order: completeOrder });
    } catch (error) {
      await transaction.rollback();
      console.error("Create order error:", error);
      res.status(500).json({ message: "Failed to create order", error: error.message });
    }
  },

  getOrders: async (req, res) => {
    try {
      const { status, orderType, tableId, startDate, endDate, limit = 50, offset = 0, orderBy = "createdAt", order = "DESC" } = req.query;
      const whereClause = {};
      if (status) whereClause.status = status;
      const excludedTypes = ["employees", "staff"];
      if (orderType) {
        if (excludedTypes.includes(String(orderType).toLowerCase())) {
          return res.json({ data: [] });
        }
        whereClause.orderType = orderType;
      } else {
        whereClause[Op.and] = [...(whereClause[Op.and] || []), sequelize.where(sequelize.cast(sequelize.col("orderType"), "text"), { [Op.notIn]: excludedTypes })];
      }
      if (tableId) whereClause.tableId = tableId;
      if (startDate || endDate) {
        whereClause.createdAt = {};
        if (startDate) whereClause.createdAt[Op.gte] = new Date(startDate);
        if (endDate) whereClause.createdAt[Op.lte] = new Date(endDate);
      }
      const orders = await Order.findAll({
        where: whereClause,
        include: [
          {
            model: OrderItem,
            as: "items",
            include: [
              { model: Material, as: "material" },
              { model: MenuItem, as: "menuItem" }
            ]
          },
          { model: Table, as: "table" },
          { model: User, as: "creator", attributes: ["id", "username"] }
        ],
        order: [[orderBy, order.toUpperCase()]],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
      const orderSummaries = orders.map(order => ({
        id: order.id,
        orderNumber: order.orderNumber,
        orderType: order.orderType,
        status: order.status,
        tableId: order.tableId,
        tableNumber: order.table?.number,
        customerName: order.customerName,
        itemCount: order.items?.length || 0,
        discountType: order.discountType,
        discountValue: order.discountValue,
        discountAmount: order.discountAmount,
        discountReason: order.discountReason,
        notes: order.notes,
        total: parseFloat(order.total),
        createdAt: order.createdAt,
        updatedAt: order.updatedAt
      }));
      res.json({ data: orderSummaries });
    } catch (error) {
      console.error("Get orders error:", error);
      res.status(500).json({ message: "Failed to fetch orders", error: error.message });
    }
  },

  getOrder: async (req, res) => {
    try {
      const { orderId } = req.params;
      const order = await Order.findByPk(orderId, {
        include: [
          {
            model: OrderItem,
            as: "items",
            include: [
              { model: Material, as: "material" },
              { model: MenuItem, as: "menuItem" },
              { model: Assignment, as: "assignment" }
            ]
          },
          { model: Table, as: "table" },
          { model: User, as: "creator", attributes: ["id", "username"] },
          { model: User, as: "updater", attributes: ["id", "username"] }
        ]
      });
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      if (["employees", "staff"].includes(String(order.orderType).toLowerCase())) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json({ data: order });
    } catch (error) {
      console.error("Get order error:", error);
      res.status(500).json({ message: "Failed to fetch order", error: error.message });
    }
  },

  updateOrder: async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
      const { orderId } = req.params;
      const { orderType, tableId, customerName, customerPhone, customerAddress, notes, items } = req.body;
      const userId = req.user?.id;
      const order = await Order.findByPk(orderId, { transaction });
      if (!order) {
        await transaction.rollback();
        return res.status(404).json({ message: "Order not found" });
      }
      const originalOrder = order.toJSON();
      const oldTableId = order.tableId;
      const newTableId = tableId !== undefined ? tableId : order.tableId;
      await order.update(
        {
          orderType: orderType || order.orderType,
          tableId: newTableId,
          customerName: customerName !== undefined ? customerName : order.customerName,
          customerPhone: customerPhone !== undefined ? customerPhone : order.customerPhone,
          customerAddress: customerAddress !== undefined ? customerAddress : order.customerAddress,
          notes: notes !== undefined ? notes : order.notes,
          updatedBy: userId
        },
        { transaction }
      );
      if (oldTableId !== newTableId) {
        if (oldTableId) {
          const oldTable = await Table.findByPk(oldTableId, { transaction });
          if (oldTable) {
            const otherActiveOrders = await Order.count({
              where: {
                tableId: oldTableId,
                id: { [Op.ne]: order.id },
                status: { [Op.in]: ["draft", "confirmed", "preparing", "ready"] }
              },
              transaction
            });
            if (otherActiveOrders === 0) {
              await oldTable.update({ status: "available" }, { transaction });
            }
          }
        }
        if (newTableId) {
          const newTable = await Table.findByPk(newTableId, { transaction });
          if (newTable && newTable.status === "available") {
            await newTable.update({ status: "opened" }, { transaction });
          }
        }
      }
      if (items) {
        const existingItems = await OrderItem.findAll({
          where: { orderId },
          include: [
            { model: Material, as: "material" },
            { model: MenuItem, as: "menuItem" },
            { model: Assignment, as: "assignment" },
            { model: Sauce, as: "sauce" }
          ],
          transaction
        });
        const removedItems = [];
        existingItems.forEach(existingItem => {
          const stillExists = items.some(newItem => {
            if (existingItem.menuItemId && newItem.menuItemId) {
              const existingMenuItemId = String(existingItem.menuItemId);
              const newMenuItemId = String(newItem.menuItemId);
              return existingMenuItemId === newMenuItemId;
            }
            if (existingItem.materialId && newItem.materialId) {
              const existingMaterialId = String(existingItem.materialId);
              const newMaterialId = String(newItem.materialId);
              return existingMaterialId === newMaterialId;
            }
            if (existingItem.type === newItem.type && existingItem.name === newItem.name) {
              return true;
            }
            return false;
          });
          if (!stillExists) {
            const removedItem = {
              ...existingItem.toJSON(),
              menuItem: existingItem.menuItem ? existingItem.menuItem.toJSON() : null,
              material: existingItem.material ? existingItem.material.toJSON() : null,
              assignment: existingItem.assignment ? existingItem.assignment.toJSON() : null
            };
            removedItems.push(removedItem);
          }
        });
        await OrderItem.destroy({ where: { orderId }, transaction });
        if (items.length > 0) {
          const orderItems = await Promise.all(
            items.map(async item => {
              const orderItem = await OrderItem.create(
                {
                  orderId: order.id,
                  materialId: item.materialId === "undefined" || item.materialId === undefined ? null : item.materialId,
                  menuItemId: item.menuItemId === "undefined" || item.menuItemId === undefined ? null : item.menuItemId,
                  sauceId: item.sauceId === "undefined" || item.sauceId === undefined ? null : item.sauceId,
                  assignmentId: item.assignmentId === "undefined" || item.assignmentId === undefined ? null : item.assignmentId,
                  name: item.name,
                  type: item.type,
                  quantity: item.quantity,
                  unitPrice: item.unitPrice,
                  totalPrice: item.totalPrice,
                  notes: item.notes,
                  selectedVariant: item.selectedVariant || null
                },
                { transaction }
              );

              // Deduct stock for new or updated items
              try {
                if (item.type === "menu_item" && item.menuItemId) {
                  console.log(`🍽️ Processing menu item for stock deduction: ${item.name} (ID: ${item.menuItemId}), Quantity: ${item.quantity}`);

                  // Check if this item has a selected variant
                  if (item.selectedVariant) {
                    console.log(`🥃 Found selected variant for ${item.name}: ${item.selectedVariant.name}`);
                    await deductIngredientStock(item.menuItemId, item.quantity, transaction, item.selectedVariant);
                  } else {
                    await deductIngredientStock(item.menuItemId, item.quantity, transaction, null, item.name);
                  }
                } else if (item.type === "material" && item.materialId) {
                  console.log(`📦 Processing direct material for stock deduction: ${item.name} (ID: ${item.materialId}), Quantity: ${item.quantity}`);
                  await deductStockFromMaterial(item.materialId, item.quantity, item.name, transaction);
                } else if (item.type === "sauce" && item.sauceId) {
                  console.log(`🥫 Processing sauce for stock deduction: ${item.name} (ID: ${item.sauceId}), Quantity: ${item.quantity}`);
                  // Assuming we have a similar function for sauces
                  await deductStockFromSauce(item.sauceId, item.quantity, item.name, transaction);
                }
              } catch (stockError) {
                console.error(`❌ Stock deduction failed for ${item.type} ${item.name}:`, stockError);
                // Continue with order update but log the error
              }

              return orderItem;
            })
          );
          const subtotal = orderItems.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0);
          const tax = 0;
          const discountAmountValue = parseFloat(order.discountAmount) || 0;
          const total = Math.max(0, subtotal - discountAmountValue);
          await order.update({ subtotal, tax, total }, { transaction });
        } else {
          await order.update({ subtotal: 0, tax: 0, total: 0 }, { transaction });
        }
        if (removedItems.length > 0) {
          // Restore stock for removed items
          for (const removedItem of removedItems) {
            try {
              if (removedItem.menuItemId) {
                console.log(`🔄 Restoring stock for removed menu item: ${removedItem.name} (ID: ${removedItem.menuItemId}), Quantity: ${removedItem.quantity}`);
                await restoreIngredientStock(removedItem.menuItemId, removedItem.quantity, transaction);
              } else if (removedItem.materialId) {
                console.log(`🔄 Restoring stock for removed material: ${removedItem.name} (ID: ${removedItem.materialId}), Quantity: ${removedItem.quantity}`);
                await restoreStockFromMaterial(removedItem.materialId, removedItem.quantity, removedItem.name, transaction);
              } else if (removedItem.sauceId) {
                console.log(`🔄 Restoring stock for removed sauce: ${removedItem.name} (ID: ${removedItem.sauceId}), Quantity: ${removedItem.quantity}`);
                await restoreStockFromSauce(removedItem.sauceId, removedItem.quantity, removedItem.name, transaction);
              }
            } catch (restoreError) {
              console.error(`❌ Failed to restore stock for removed item ${removedItem.name}:`, restoreError);
            }
          }
          req.removedItems = removedItems;
          req.orderForVoidPrint = order;
        }
      }
      await transaction.commit();
      const updatedOrder = await Order.findByPk(orderId, {
        include: [
          {
            model: OrderItem,
            as: "items",
            include: [
              { model: Material, as: "material" },
              { model: MenuItem, as: "menuItem" },
              { model: Assignment, as: "assignment" }
            ]
          },
          { model: Table, as: "table" }
        ]
      });
      if (req.removedItems && req.removedItems.length > 0) {
        try {
          await processVoidPrintJobs(req.removedItems, updatedOrder, userId);
        } catch (voidPrintError) {
          console.error("❌ Failed to process void print jobs:", voidPrintError);
        }
      }
      if (userId) {
        await auditOrderOperation(userId, "UPDATE", updatedOrder.toJSON(), originalOrder, req);
      }
      res.json({ message: "Order updated successfully", order: updatedOrder });
    } catch (error) {
      await transaction.rollback();
      console.error("Update order error:", error);
      res.status(500).json({ message: "Failed to update order", error: error.message });
    }
  },

  // Add items to existing order
  addOrderItems: async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
      const { orderId } = req.params;
      const { items } = req.body;
      const userId = req.user?.id;
      const order = await Order.findByPk(orderId, { transaction });
      if (!order) {
        await transaction.rollback();
        return res.status(404).json({ message: "Order not found" });
      }
      if (!items || !Array.isArray(items) || items.length === 0) {
        await transaction.rollback();
        return res.status(400).json({ message: "Items array is required and cannot be empty" });
      }
      console.log(`📋 Adding ${items.length} items to order ${orderId}`);
      const newOrderItems = await Promise.all(
        items.map(async item => {
          const orderItem = await OrderItem.create(
            {
              orderId: order.id,
              materialId: item.materialId === "undefined" || item.materialId === undefined ? null : item.materialId,
              menuItemId: item.menuItemId === "undefined" || item.menuItemId === undefined ? null : item.menuItemId,
              assignmentId: item.assignmentId === "undefined" || item.assignmentId === undefined ? null : item.assignmentId,
              name: item.name,
              type: item.type,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
              notes: item.notes,
              selectedVariant: item.selectedVariant || null
            },
            { transaction }
          );

          return orderItem;
        })
      );
      const allOrderItems = await OrderItem.findAll({
        where: { orderId: order.id },
        transaction
      });
      const subtotal = allOrderItems.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0);
      const tax = 0;
      const discountAmountValue = parseFloat(order.discountAmount) || 0;
      const total = Math.max(0, subtotal - discountAmountValue);
      await order.update(
        {
          subtotal,
          tax,
          total,
          updatedBy: userId
        },
        { transaction }
      );
      await transaction.commit();
      const updatedOrder = await Order.findByPk(orderId, {
        include: [
          {
            model: OrderItem,
            as: "items",
            include: [
              { model: Material, as: "material" },
              { model: MenuItem, as: "menuItem" },
              { model: Assignment, as: "assignment" }
            ]
          },
          { model: Table, as: "table" }
        ]
      });
      console.log(`✅ Successfully added ${newOrderItems.length} items to order ${orderId}`);
      if (userId) {
        await auditOrderOperation(userId, "ADD_ITEMS", updatedOrder.toJSON(), null, req);
      }
      res.json({
        message: `Successfully added ${newOrderItems.length} items to order`,
        order: updatedOrder
      });
    } catch (error) {
      await transaction.rollback();
      console.error("Add order items error:", error);
      res.status(500).json({ message: "Failed to add items to order", error: error.message });
    }
  },

  // Remove/void specific items from an existing order
  removeOrderItems: async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
      const { orderId } = req.params;
      const { itemIds } = req.body || {};
      const userId = req.user?.id;
      if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
        await transaction.rollback();
        return res.status(400).json({ message: "itemIds array is required and cannot be empty" });
      }
      const order = await Order.findByPk(orderId, { transaction });
      if (!order) {
        await transaction.rollback();
        return res.status(404).json({ message: "Order not found" });
      }
      const deletedCount = await OrderItem.destroy({
        where: { orderId, id: itemIds },
        transaction
      });
      const remainingItems = await OrderItem.findAll({ where: { orderId }, transaction });
      const subtotal = remainingItems.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0);
      const tax = 0;
      const discountAmountValue = parseFloat(order.discountAmount) || 0;
      const total = Math.max(0, subtotal - discountAmountValue);
      await order.update({ subtotal, tax, total, updatedBy: userId }, { transaction });
      await transaction.commit();
      const updatedOrder = await Order.findByPk(orderId, {
        include: [
          {
            model: OrderItem,
            as: "items",
            include: [
              { model: Material, as: "material" },
              { model: MenuItem, as: "menuItem" },
              { model: Assignment, as: "assignment" }
            ]
          },
          { model: Table, as: "table" }
        ]
      });
      if (userId) {
        await auditOrderOperation(userId, "REMOVE_ITEMS", updatedOrder.toJSON(), null, req);
      }
      return res.json({
        message: `Successfully removed ${deletedCount} item(s) from order`,
        order: updatedOrder
      });
    } catch (error) {
      await transaction.rollback();
      console.error("Remove order items error:", error);
      return res.status(500).json({ message: "Failed to remove items from order", error: error.message });
    }
  },

  // Update order status
  updateOrderStatus: async (req, res) => {
    try {
      const { orderId } = req.params;
      const { status } = req.body;
      const userId = req.user?.id;
      const order = await Order.findByPk(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      const updateData = { status, updatedBy: userId };
      if (status === "cancelled") {
        updateData.cancelledAt = new Date();
      }
      await order.update(updateData);
      const updatedOrder = await Order.findByPk(orderId, {
        include: [
          { model: OrderItem, as: "items" },
          { model: Table, as: "table" }
        ]
      });
      res.json({ message: "Order status updated successfully", order: updatedOrder });
    } catch (error) {
      console.error("Update order status error:", error);
      res.status(500).json({ message: "Failed to update order status", error: error.message });
    }
  },

  // Complete order (convert to sale)
  completeOrder: async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
      const { orderId } = req.params;
      const { paymentData } = req.body;
      const userId = req.user?.id;
      const order = await Order.findByPk(orderId, {
        include: [{ model: OrderItem, as: "items" }],
        transaction
      });

      if (!order) {
        await transaction.rollback();
        return res.status(404).json({ message: "Order not found" });
      }
      if (order.status === "paid") {
        await transaction.rollback();
        return res.status(400).json({
          message: "Order already completed",
          currentStatus: order.status,
          completedAt: order.completedAt,
          saleId: order.saleId
        });
      }
      const completableStatuses = ["draft", "confirmed", "preparing", "ready", "served"];
      if (!completableStatuses.includes(order.status)) {
        await transaction.rollback();
        return res.status(400).json({
          message: `Order cannot be completed from status: ${order.status}`,
          currentStatus: order.status,
          allowedStatuses: completableStatuses
        });
      }
      const saleData = {
        saleDate: new Date().toISOString(),
        items: order.items
          .filter(item => item.type === "material")
          .map(item => ({
            materialId: item.materialId,
            assignmentId: item.assignmentId,
            quantity: item.quantity,
            unitPrice: parseFloat(item.unitPrice),
            totalPrice: parseFloat(item.totalPrice),
            materialName: item.name
          })),
        menuItems: order.items
          .filter(item => item.type === "menu_item")
          .map(item => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            unitPrice: parseFloat(item.unitPrice),
            totalPrice: parseFloat(item.totalPrice),
            menuItemName: item.name
          })),
        totalAmount: parseFloat(order.total),
        paymentAmount: paymentData.paymentAmount,
        paymentMethod: paymentData.paymentMethod || "cash"
      };
      saleData.fromExistingOrder = true;
      const mockReq = { body: saleData, user: { id: userId } };
      const mockRes = {
        status: code => mockRes,
        json: data => data
      };
      const saleResult = await new Promise((resolve, reject) => {
        mockRes.json = data => {
          if (data.error || data.message?.includes("failed")) {
            reject(new Error(`Sale creation failed: ${data.error || data.message}`));
          } else {
            resolve(data);
          }
        };
        salesController.createSales(mockReq, mockRes).catch(error => {
          reject(error);
        });
      });
      const updateResult = await Order.update(
        {
          status: "paid",
          paymentMethod: paymentData.paymentMethod,
          paymentAmount: paymentData.paymentAmount,
          change: paymentData.change,
          saleId: saleResult.sale?.id,
          completedAt: new Date(),
          updatedBy: userId,
          discountType: order.discountType,
          discountValue: order.discountValue,
          discountAmount: order.discountAmount,
          discountReason: order.discountReason
        },
        {
          where: {
            id: orderId,
            status: { [Op.ne]: "paid" }
          },
          transaction
        }
      );
      if (updateResult[0] === 0) {
        await transaction.rollback();
        return res.status(400).json({
          message: "Order was already completed by another request",
          note: "This can happen if multiple completion requests are made simultaneously"
        });
      }
      if (order.tableId) {
        const table = await Table.findByPk(order.tableId, { transaction });
        if (table) {
          const otherActiveOrders = await Order.count({
            where: {
              tableId: order.tableId,
              id: { [Op.ne]: order.id },
              status: { [Op.in]: ["draft", "confirmed", "preparing", "ready"] }
            },
            transaction
          });

          if (otherActiveOrders === 0) {
            await table.update({ status: "available" }, { transaction });
          }
        }
      }
      await transaction.commit();
      const completedOrder = await Order.findByPk(orderId, {
        include: [{ model: OrderItem, as: "items" }]
      });
      res.json({
        message: "Order completed successfully",
        order: completedOrder,
        saleId: saleResult.sale?.id
      });
    } catch (error) {
      await transaction.rollback();
      console.error("Complete order error:", error);
      res.status(500).json({ message: "Failed to complete order", error: error.message });
    }
  },

  // Cancel order
  cancelOrder: async (req, res) => {
    try {
      const { orderId } = req.params;
      const { reason } = req.body;
      const userId = req.user?.id;
      const order = await Order.findByPk(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      await order.update({
        status: "cancelled",
        cancelReason: reason,
        cancelledAt: new Date(),
        updatedBy: userId
      });
      if (order.tableId) {
        const table = await Table.findByPk(order.tableId);
        if (table) {
          const otherActiveOrders = await Order.count({
            where: {
              tableId: order.tableId,
              id: { [Op.ne]: order.id },
              status: { [Op.in]: ["draft", "confirmed", "preparing", "ready"] }
            }
          });
          if (otherActiveOrders === 0) {
            await table.update({ status: "available" });
          }
        }
      }
      const cancelledOrder = await Order.findByPk(orderId, {
        include: [{ model: OrderItem, as: "items" }]
      });
      res.json({ message: "Order cancelled successfully", order: cancelledOrder });
    } catch (error) {
      console.error("Cancel order error:", error);
      res.status(500).json({ message: "Failed to cancel order", error: error.message });
    }
  },

  // Void order - Enhanced cancellation with stock restoration
  voidOrder: async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
      const { orderId } = req.params;
      const { reason, restoreStock = true } = req.body;
      const userId = req.user?.id;
      // Find the order with all its items
      const order = await Order.findByPk(orderId, {
        include: [{ model: OrderItem, as: "items" }],
        transaction
      });
      if (!order) {
        await transaction.rollback();
        return res.status(404).json({ message: "Order not found" });
      }
      if (order.status === "cancelled") {
        await transaction.rollback();
        return res.status(400).json({ message: "Order is already cancelled/voided" });
      }
      if (order.status === "paid") {
        await transaction.rollback();
        return res.status(400).json({ message: "Cannot void a paid order. Use refund instead." });
      }
      const stockRestorations = [];
      if (restoreStock && order.items && order.items.length > 0) {
        const { MenuItem, MenuItemIngredient, StockEntry, Material } = await import("../models/index.js");
        for (const item of order.items) {
          if (item.materialId && item.type === "material") {
            try {
              const material = await Material.findByPk(item.materialId, { transaction });
              if (!material) {
                console.warn(`Material ${item.materialId} not found during void`);
                continue;
              }
              let restorationQuantity = item.quantity;
              if (material.unitType === "package" && material.packageQuantity && material.packageQuantity > 0) {
                if (item.unit !== material.baseUnit) {
                  restorationQuantity = item.quantity * material.packageQuantity;
                }
              }
              const stockEntries = await StockEntry.findAll({
                where: { materialId: item.materialId },
                order: [["createdAt", "DESC"]],
                transaction
              });
              if (stockEntries.length === 0) {
                const newStockEntry = await StockEntry.create(
                  {
                    materialId: material.id,
                    supplier: "RESTORED - From Order Void",
                    purchasedQuantity: 0,
                    purchasedUnit: material.baseUnit,
                    purchasedIndividualQuantity: restorationQuantity,
                    purchasedIndividualUnit: material.baseUnit,
                    costPerPurchasedUnit: 0,
                    totalCost: 0,
                    purchaseDate: new Date(),
                    expiryDate: null
                  },
                  { transaction }
                );
                stockRestorations.push({
                  type: "material_item",
                  materialId: material.id,
                  materialName: material.name,
                  stockEntryId: newStockEntry.id,
                  quantityRestored: restorationQuantity,
                  unit: material.baseUnit,
                  action: "Created new stock entry",
                  oldStockQuantity: 0,
                  newStockQuantity: restorationQuantity
                });
              } else {
                const stockEntry = stockEntries[0];
                const oldQuantity = stockEntry.purchasedIndividualQuantity || 0;
                const newQuantity = Math.round(oldQuantity + restorationQuantity);
                await stockEntry.update(
                  {
                    purchasedIndividualQuantity: newQuantity
                  },
                  { transaction }
                );
                stockRestorations.push({
                  type: "material_item",
                  materialId: material.id,
                  materialName: material.name,
                  stockEntryId: stockEntry.id,
                  quantityRestored: restorationQuantity,
                  unit: material.baseUnit,
                  oldStockQuantity: oldQuantity,
                  newStockQuantity: newQuantity
                });
              }
            } catch (stockError) {
              console.warn(`⚠️ Could not restore stock for material item ${item.name}:`, stockError.message);
            }
          } else if (item.menuItemId && item.type === "menu_item") {
            try {
              const menuItem = await MenuItem.findByPk(item.menuItemId, {
                include: [
                  {
                    model: MenuItemIngredient,
                    as: "menuItemIngredients",
                    include: [{ model: Material, as: "material" }]
                  }
                ],
                transaction
              });
              if (!menuItem) {
                console.warn(`Menu item ${item.menuItemId} not found during void`);
                continue;
              }
              console.log(`🔄 Restoring stock for menu item "${item.name}" with ${menuItem.menuItemIngredients?.length || 0} ingredients`);
              if (menuItem.menuItemIngredients && menuItem.menuItemIngredients.length > 0) {
                for (const ingredient of menuItem.menuItemIngredients) {
                  const material = ingredient.material;
                  const totalIngredientQuantity = ingredient.quantity * item.quantity;
                  let restorationQuantityInBaseUnits = totalIngredientQuantity;
                  if (ingredient.unit !== material.baseUnit) {
                    if (material.unitType === "mass") {
                      if (ingredient.unit === "kg" && material.baseUnit === "g") {
                        restorationQuantityInBaseUnits = totalIngredientQuantity * 1000;
                      } else if (ingredient.unit === "g" && material.baseUnit === "kg") {
                        restorationQuantityInBaseUnits = totalIngredientQuantity / 1000;
                      }
                    }
                  }
                  const stockEntries = await StockEntry.findAll({
                    where: { materialId: material.id },
                    order: [["createdAt", "DESC"]],
                    transaction
                  });
                  if (stockEntries.length === 0) {
                    const newStockEntry = await StockEntry.create(
                      {
                        materialId: material.id,
                        supplier: "RESTORED - From Order Void",
                        purchasedQuantity: 0,
                        purchasedUnit: material.baseUnit,
                        purchasedIndividualQuantity: restorationQuantityInBaseUnits,
                        purchasedIndividualUnit: material.baseUnit,
                        costPerPurchasedUnit: 0,
                        totalCost: 0,
                        purchaseDate: new Date(),
                        expiryDate: null
                      },
                      { transaction }
                    );
                    stockRestorations.push({
                      type: "menu_item_ingredient",
                      materialId: material.id,
                      materialName: material.name,
                      menuItemId: menuItem.id,
                      menuItemName: menuItem.name,
                      stockEntryId: newStockEntry.id,
                      quantityRestored: restorationQuantityInBaseUnits,
                      unit: material.baseUnit,
                      action: "Created new stock entry",
                      oldStockQuantity: 0,
                      newStockQuantity: restorationQuantityInBaseUnits
                    });
                  } else {
                    const stockEntry = stockEntries[0];
                    const oldQuantity = stockEntry.purchasedIndividualQuantity || 0;
                    const newQuantity = Math.round(oldQuantity + restorationQuantityInBaseUnits);
                    await stockEntry.update(
                      {
                        purchasedIndividualQuantity: newQuantity
                      },
                      { transaction }
                    );
                    stockRestorations.push({
                      type: "menu_item_ingredient",
                      materialId: material.id,
                      materialName: material.name,
                      menuItemId: menuItem.id,
                      menuItemName: menuItem.name,
                      stockEntryId: stockEntry.id,
                      quantityRestored: restorationQuantityInBaseUnits,
                      unit: material.baseUnit,
                      oldStockQuantity: oldQuantity,
                      newStockQuantity: newQuantity
                    });
                  }
                  console.log(`✅ Restored ${restorationQuantityInBaseUnits} units of ${material.name} for ${menuItem.name}`);
                }
              }
            } catch (menuItemError) {
              console.warn(`⚠️ Could not restore stock for menu item ${item.name}:`, menuItemError.message);
            }
          }
        }
      }
      await order.update(
        {
          status: "cancelled",
          cancelReason: reason || "Order voided",
          cancelledAt: new Date(),
          updatedBy: userId
        },
        { transaction }
      );
      if (order.tableId) {
        const table = await Table.findByPk(order.tableId, { transaction });
        if (table) {
          const otherActiveOrders = await Order.count({
            where: {
              tableId: order.tableId,
              id: { [Op.ne]: order.id },
              status: { [Op.in]: ["draft", "confirmed", "preparing", "ready"] }
            },
            transaction
          });
          if (otherActiveOrders === 0) {
            await table.update({ status: "available" }, { transaction });
          }
        }
      }
      await transaction.commit();
      const voidedOrder = await Order.findByPk(orderId, {
        include: [{ model: OrderItem, as: "items" }]
      });
      res.json({
        message: "Order voided successfully",
        order: voidedOrder,
        stockRestorations: stockRestorations.length > 0 ? stockRestorations : null
      });
    } catch (error) {
      await transaction.rollback();
      console.error("Void order error:", error);
      res.status(500).json({ message: "Failed to void order", error: error.message });
    }
  },

  // Get table orders
  getTableOrders: async (req, res) => {
    try {
      const { tableId } = req.params;

      const orders = await Order.findAll({
        where: {
          tableId,
          status: { [Op.in]: ["draft", "confirmed", "preparing", "ready"] },
          [Op.and]: [sequelize.where(sequelize.cast(sequelize.col("orderType"), "text"), { [Op.notIn]: ["employees", "staff"] })]
        },
        include: [
          { model: OrderItem, as: "items" },
          { model: Table, as: "table" }
        ],
        order: [["createdAt", "DESC"]]
      });

      res.json({ data: orders });
    } catch (error) {
      console.error("Get table orders error:", error);
      res.status(500).json({ message: "Failed to fetch table orders", error: error.message });
    }
  },

  // Get draft orders
  getDraftOrders: async (req, res) => {
    try {
      const orders = await Order.findAll({
        where: {
          status: "draft",
          [Op.and]: [sequelize.where(sequelize.cast(sequelize.col("orderType"), "text"), { [Op.notIn]: ["employees", "staff"] })]
        },
        include: [
          { model: OrderItem, as: "items" },
          { model: Table, as: "table" }
        ],
        order: [["updatedAt", "DESC"]]
      });
      res.json({ data: orders });
    } catch (error) {
      console.error("Get draft orders error:", error);
      res.status(500).json({ message: "Failed to fetch draft orders", error: error.message });
    }
  },

  // Get staff/employee orders only
  getStaffOrders: async (req, res) => {
    try {
      const { status, tableId, startDate, endDate, limit = 50, offset = 0, orderBy = "createdAt", order = "DESC" } = req.query;
      const whereClause = {};
      if (status) whereClause.status = status;
      if (tableId) whereClause.tableId = tableId;
      if (startDate || endDate) {
        whereClause.createdAt = {};
        if (startDate) whereClause.createdAt[Op.gte] = new Date(startDate);
        if (endDate) whereClause.createdAt[Op.lte] = new Date(endDate);
      }
      whereClause[Op.and] = [...(whereClause[Op.and] || []), sequelize.where(sequelize.cast(sequelize.col("orderType"), "text"), { [Op.in]: ["employees", "staff"] })];
      const orders = await Order.findAll({
        where: whereClause,
        include: [
          {
            model: OrderItem,
            as: "items",
            include: [
              { model: Material, as: "material" },
              { model: MenuItem, as: "menuItem" }
            ]
          },
          { model: Table, as: "table" },
          { model: User, as: "creator", attributes: ["id", "username"] }
        ],
        order: [[orderBy, order.toUpperCase()]],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
      res.json({ data: orders });
    } catch (error) {
      console.error("Get staff orders error:", error);
      res.status(500).json({ message: "Failed to fetch staff orders", error: error.message });
    }
  },

  // Auto-save order
  autoSaveOrder: async (req, res) => {
    try {
      const { orderId } = req.params;
      const updateData = req.body;
      const userId = req.user?.id;
      const order = await Order.findByPk(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      if (order.status !== "draft") {
        return res.status(400).json({ message: "Can only auto-save draft orders" });
      }
      const { discountType, discountValue, discountAmount, discountReason, ...otherData } = updateData;
      const updateFields = {
        ...otherData,
        updatedBy: userId
      };
      if (discountType !== undefined) updateFields.discountType = discountType;
      if (discountValue !== undefined) updateFields.discountValue = discountValue;
      if (discountAmount !== undefined) updateFields.discountAmount = discountAmount;
      if (discountReason !== undefined) updateFields.discountReason = discountReason;
      await order.update(updateFields);
      if (discountAmount !== undefined) {
        const orderItems = await OrderItem.findAll({ where: { orderId } });
        const subtotal = orderItems.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0);
        const tax = 0;
        const discountAmountValue = parseFloat(discountAmount) || 0;
        const total = Math.max(0, subtotal - discountAmountValue);
        await order.update({ subtotal, tax, total });
      }
      res.json({ message: "Order auto-saved successfully" });
    } catch (error) {
      console.error("Auto-save order error:", error);
      res.status(500).json({ message: "Failed to auto-save order", error: error.message });
    }
  }
};

/**
 * Process void print jobs for removed items during order updates
 * Fully dynamic printer assignment based on database configuration
 */
async function processVoidPrintJobs(removedItems, order, userId) {
  try {
    console.log(`🔄 Processing void print jobs for ${removedItems.length} removed items`);
    const itemsByPrinter = new Map();
    const printerAssignmentCache = new Map();
    for (const item of removedItems) {
      let printerId = null;
      printerId = await determinePrinterAssignment(item, printerAssignmentCache);
      if (printerId) {
        if (!itemsByPrinter.has(printerId)) {
          itemsByPrinter.set(printerId, []);
        }
        itemsByPrinter.get(printerId).push(item);
        console.log(`📍 Item "${getItemDisplayName(item)}" assigned to printer ID: ${printerId}`);
      } else {
        console.warn(`⚠️ No printer assignment found for item: ${getItemDisplayName(item)}`);
      }
    }
    const printJobs = [];
    console.log(`📄 Creating void print jobs for ${itemsByPrinter.size} printer(s)`);
    for (const [printerId, printerItems] of itemsByPrinter) {
      try {
        const printer = await Printer.findByPk(printerId, {
          include: [{ model: PrinterChannel, as: "channel" }]
        });
        if (!printer) {
          console.error(`❌ Printer not found: ID ${printerId}`);
          continue;
        }
        if (!printer.isActive) {
          console.warn(`⚠️ Printer inactive: ${printer.name} (ID: ${printerId})`);
          continue;
        }
        console.log(`🖨️ Processing void print job for printer: ${printer.name} (${printerItems.length} items)`);
        const voidContent = await formatVoidItemsForThermalPrinter(printerItems, order, printer);
        const printJob = await PrintJob.create({
          printerId: printer.id,
          channelId: printer.channelId,
          jobType: "void",
          content: {
            format: "text",
            encoding: "utf8",
            rawContent: voidContent,
            data: {},
            template: null
          },
          settings: {
            copies: 1,
            priority: "high"
          },
          maxAttempts: 3,
          attempts: 0,
          status: "pending",
          timestamps: {
            created: new Date(),
            queued: null,
            started: null,
            completed: null,
            failed: null,
            cancelled: null
          },
          metrics: {
            dataSize: voidContent.length,
            printTime: null,
            queueTime: null,
            totalTime: null
          },
          metadata: {
            source: "api",
            userId: userId,
            orderId: order.id,
            orderNumber: order.orderNumber,
            printerName: printer.name,
            printerLocation: printer.location,
            stationName: extractStationName(printer),
            voidedItems: printerItems.map(item => ({
              id: item.id,
              name: getItemDisplayName(item),
              quantity: item.quantity,
              type: item.type,
              category: getItemCategory(item)
            }))
          }
        });
        printJobs.push(printJob);
        console.log(`✅ Void print job created for printer: ${printer.name}`);
      } catch (printerError) {
        console.error(`❌ Failed to create void print job for printer ${printerId}:`, printerError);
      }
    }
    console.log(`📋 Total void print jobs created: ${printJobs.length}`);
    return printJobs;
  } catch (error) {
    console.error("❌ Error processing void print jobs:", error);
    throw error;
  }
}

/**
 * Dynamically determine printer assignment for an item
 * Uses database-driven logic with intelligent fallbacks
 */
async function determinePrinterAssignment(item, cache = new Map()) {
  try {
    let printerId = null;

    // 1. Check direct printer assignment on item
    if (item.menuItemId && item.menuItem && item.menuItem.printerId) {
      printerId = item.menuItem.printerId;
      console.log(`🎯 Direct assignment - Menu item "${item.menuItem.name}" → Printer ID: ${printerId}`);
      return printerId;
    }

    if (item.materialId && item.material && item.material.printerId) {
      printerId = item.material.printerId;
      console.log(`🎯 Direct assignment - Material "${item.material.name}" → Printer ID: ${printerId}`);
      return printerId;
    }

    if (item.assignmentId && item.assignment && item.assignment.printerId) {
      printerId = item.assignment.printerId;
      console.log(`🎯 Direct assignment - Assignment "${item.assignment.name}" → Printer ID: ${printerId}`);
      return printerId;
    }

    // 2. Category-based assignment with database lookup
    const category = getItemCategory(item);
    const cacheKey = `category_${category}`;

    if (cache.has(cacheKey)) {
      printerId = cache.get(cacheKey);
      console.log(`📦 Cached category assignment - "${category}" → Printer ID: ${printerId}`);
      return printerId;
    }

    // 3. Query database for category-based printer assignments
    printerId = await getCategoryPrinterAssignment(category, item.type);

    if (printerId) {
      cache.set(cacheKey, printerId);
      console.log(`🏷️ Category assignment - "${category}" → Printer ID: ${printerId}`);
      return printerId;
    }

    // 4. Fallback to default printer by type
    printerId = await getDefaultPrinterByType(item.type);

    if (printerId) {
      console.log(`🔄 Fallback assignment - Type "${item.type}" → Printer ID: ${printerId}`);
      return printerId;
    }

    // 5. Ultimate fallback - get any active printer
    printerId = await getAnyActivePrinter();

    if (printerId) {
      console.log(`⚡ Ultimate fallback - Any active printer → Printer ID: ${printerId}`);
      return printerId;
    }

    console.warn(`⚠️ No printer assignment possible for item: ${getItemDisplayName(item)}`);
    return null;
  } catch (error) {
    console.error(`❌ Error determining printer assignment for item:`, error);
    return null;
  }
}

/**
 * Get category-based printer assignment from database
 */
async function getCategoryPrinterAssignment(category, itemType) {
  try {
    // Define category to printer type mapping
    const categoryPrinterMap = {
      // Food categories → Kitchen printers
      appetizers: "kitchen",
      main_course: "kitchen",
      burgers: "kitchen",
      sandwiches: "kitchen",
      pasta: "kitchen",
      pizza: "kitchen",
      breakfast: "kitchen",
      salads: "kitchen",
      sushi: "kitchen",

      // Beverage categories → Bar printers
      beverages: "bar",
      drinks: "bar",
      cocktails: "bar",
      smoothies: "bar",
      coffee: "bar",

      // Hookah/Shisha → Arguile printers
      hookah: "arguile",
      shisha: "arguile",
      arguile: "arguile"
    };

    const printerType = categoryPrinterMap[category?.toLowerCase()];
    if (printerType) {
      const printer = await Printer.findOne({
        where: {
          isActive: true,
          [Op.or]: [{ location: { [Op.iLike]: `%${printerType}%` } }, { name: { [Op.iLike]: `%${printerType}%` } }, { description: { [Op.iLike]: `%${printerType}%` } }]
        },
        order: [["lastPing", "DESC"]]
      });
      return printer?.id || null;
    }
    return null;
  } catch (error) {
    console.error(`❌ Error getting category printer assignment:`, error);
    return null;
  }
}

// Get default printer by item type
async function getDefaultPrinterByType(itemType) {
  try {
    let searchTerms = [];
    if (itemType === "menu_item") {
      searchTerms = ["kitchen", "food", "main"];
    } else if (itemType === "material") {
      searchTerms = ["bar", "beverage", "drink"];
    } else {
      searchTerms = ["kitchen", "main"];
    }
    for (const term of searchTerms) {
      const printer = await Printer.findOne({
        where: {
          isActive: true,
          [Op.or]: [{ location: { [Op.iLike]: `%${term}%` } }, { name: { [Op.iLike]: `%${term}%` } }, { description: { [Op.iLike]: `%${term}%` } }]
        },
        order: [["lastPing", "DESC"]]
      });
      if (printer) {
        return printer.id;
      }
    }
    return null;
  } catch (error) {
    console.error(`❌ Error getting default printer by type:`, error);
    return null;
  }
}

// Get any active printer as ultimate fallback
async function getAnyActivePrinter() {
  try {
    const printer = await Printer.findOne({
      where: { isActive: true },
      order: [
        ["lastPing", "DESC"],
        ["totalJobs", "ASC"]
      ]
    });
    return printer?.id || null;
  } catch (error) {
    console.error(`❌ Error getting any active printer:`, error);
    return null;
  }
}

// Get display name for an item
function getItemDisplayName(item) {
  if (item.name && item.name !== "Unknown Item") {
    return item.name;
  }
  if (item.menuItem && item.menuItem.name) {
    return item.menuItem.name;
  }
  if (item.material && item.material.name) {
    return item.material.name;
  }
  if (item.assignment && item.assignment.name) {
    return item.assignment.name;
  }
  return `Unknown Item (ID: ${item.id || "N/A"})`;
}

/**
 * Get category for an item
 */
function getItemCategory(item) {
  if (item.menuItem && item.menuItem.category) {
    return item.menuItem.category;
  }
  if (item.material && item.material.category) {
    return item.material.category;
  }
  if (item.assignment && item.assignment.category) {
    return item.assignment.category;
  }
  if (item.type === "material") {
    return "beverages";
  }
  return "main_course";
}

/**
 * Extract station name from printer configuration
 */
function extractStationName(printer) {
  if (!printer) return "UNKNOWN";

  // Try to extract from location first
  if (printer.location) {
    const location = printer.location.toUpperCase();
    if (location.includes("KITCHEN")) return "KITCHEN";
    if (location.includes("BAR")) return "BAR";
    if (location.includes("ARGUILE") || location.includes("SHISHA")) return "ARGUILE";
  }

  // Try to extract from name
  if (printer.name) {
    const name = printer.name.toUpperCase();
    if (name.includes("KITCHEN")) return "KITCHEN";
    if (name.includes("BAR")) return "BAR";
    if (name.includes("ARGUILE") || name.includes("SHISHA")) return "ARGUILE";

    // Clean up printer name for display
    const cleanName = name
      .replace(/PRINTER\s*\d*/i, "")
      .replace(/THERMAL/i, "")
      .replace(/RECEIPT/i, "")
      .trim();

    if (cleanName) return cleanName;
  }

  // Try to extract from description
  if (printer.description) {
    const desc = printer.description.toUpperCase();
    if (desc.includes("KITCHEN")) return "KITCHEN";
    if (desc.includes("BAR")) return "BAR";
    if (desc.includes("ARGUILE") || desc.includes("SHISHA")) return "ARGUILE";
  }

  return "STATION";
}

/**
 * Format void items for thermal printer output
 * Enhanced with dynamic station detection and better formatting
 */
async function formatVoidItemsForThermalPrinter(items, order, printer) {
  const now = new Date();
  const date = now.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
  const time = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });

  // Get station name using dynamic extraction (no hardcoded IDs)
  const stationName = extractStationName(printer);

  // 80mm thermal receipt formatting (48 characters wide)
  let content = "";

  // Center text helper function
  const centerText = (text, width = 48) => {
    const padding = Math.max(0, Math.floor((width - text.length) / 2));
    return " ".repeat(padding) + text;
  };

  try {
    // Header with station name
    content += centerText(`${stationName} STATION`) + "\n";

    // **VOID** indicator - make it prominent
    content += centerText("*** VOID ITEMS ***") + "\n";
    content += centerText("================") + "\n";

    // Order details
    content += `Order #: ${order.orderNumber}\n`;
    content += `Date: ${date}\n`;
    content += `Time: ${time}\n`;
    content += `Type: ${order.orderType.toUpperCase()}\n`;

    if (order.table) {
      content += `Table: ${order.table.number}\n`;
    }

    content += centerText("VOIDED ITEMS") + "\n";

    // Group items by name and sum quantities
    const groupedItems = items.reduce((acc, item) => {
      const key = item.name;
      if (acc[key]) {
        acc[key].quantity += item.quantity;
      } else {
        acc[key] = { ...item };
      }
      return acc;
    }, {});

    // List voided items with emphasis and better formatting
    Object.values(groupedItems).forEach(item => {
      const itemName = getItemDisplayName(item);
      const quantity = item.quantity || 1;
      const category = getItemCategory(item);

      // Bold text for emphasis (ESC/POS command)
      content += "\x1B\x45"; // ESC E - Bold on
      content += `            ${quantity}x ${itemName}\n`;

      // Add category info if available and different from default
      if (category && category !== "main_course") {
        content += `                [${category.toUpperCase()}]\n`;
      }

      content += "\x1B\x46"; // ESC F - Bold off
    });
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    content += "\n";
    content += centerText("================") + "\n";
    content += centerText(`Total Voided: ${itemCount}`) + "\n";
    content += centerText("*** DO NOT PREPARE ***") + "\n";
    content += "\n";
    content += "\n";
    content += "\n";
    content += "\n";
    content += "\n";
    content += "\x1B\x69";
    return content;
  } catch (error) {
    console.error("Error formatting void items for printer:", error);
    // Fallback to simple text format
    let fallbackContent = "";
    fallbackContent += centerText(`${stationName} STATION`) + "\n";
    fallbackContent += centerText("*** VOID ITEMS ***") + "\n";
    fallbackContent += `Order #: ${order.orderNumber}\n`;
    fallbackContent += `Date: ${date}\n`;
    fallbackContent += `Time: ${time}\n`;
    fallbackContent += `Type: ${order.orderType.toUpperCase()}\n`;
    fallbackContent += centerText("VOIDED ITEMS") + "\n";

    items.forEach(item => {
      const itemName = getItemDisplayName(item);
      const category = getItemCategory(item);

      fallbackContent += centerText(`${item.quantity}x ${itemName}`) + "\n";

      // Add category info in fallback format too
      if (category && category !== "main_course") {
        fallbackContent += centerText(`[${category.toUpperCase()}]`) + "\n";
      }
    });

    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    fallbackContent += centerText(`Total Voided: ${itemCount}`) + "\n";
    fallbackContent += centerText("*** DO NOT PREPARE ***") + "\n";
    fallbackContent += "\n\n\n\n\n";

    return fallbackContent;
  }
}
