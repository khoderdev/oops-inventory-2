import Material from "../models/materials.js";

/**
 * Seed initial materials data
 * @returns {Promise<Object>} Summary of seeding operation
 */
export const seedMaterials = async () => {
  try {
    console.log("🌱 Starting materials seeding...");
    
    // Use the static method from the Material model
    const result = await Material.createInitialMaterials();
    
    console.log("✅ Materials seeding completed successfully");
    return result;
    
  } catch (error) {
    console.error("❌ Error seeding materials:", error);
    throw error;
  }
};

export default seedMaterials;
