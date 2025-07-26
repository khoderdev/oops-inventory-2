import { Material } from "../models/index.js";

/**
 * Update specific materials to be POS items
 * This script marks common POS items (Egg, Fries) as isPOSItem: true
 */
async function updatePOSItems() {
  try {
    console.log("🔄 Updating POS items...");

    // List of materials that should be POS items
    const posItemNames = ["Egg", "Fries", "Pepsi"];

    for (const itemName of posItemNames) {
      const material = await Material.findOne({
        where: { name: itemName }
      });

      if (material) {
        await material.update({ isPOSItem: true });
        console.log(`✅ Updated ${itemName} to be a POS item`);
      } else {
        console.log(`⚠️  Material "${itemName}" not found`);
      }
    }

    console.log("✅ POS items update completed");
  } catch (error) {
    console.error("❌ Error updating POS items:", error);
  }
}

export default updatePOSItems;
