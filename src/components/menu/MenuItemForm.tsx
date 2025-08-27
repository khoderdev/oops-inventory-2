// import { MenuItemCategory, MenuItemIngredient } from "@/types/inventory";
// import { useCallback, useEffect, useMemo, useState } from "react";
// import { Button } from "../ui/button";
// import { Input } from "../ui/input";
// import { Switch } from "../ui/switch";
// import { ImageUpload } from "../ui/image-upload";
// import { toast } from "../ui/use-toast";
// import { Ingredients } from "./components/Ingredients";
// import { MenuItemFormProps } from "@/types/menuItems";

// export function MenuItemForm({ menuItem, stockEntries, categories, sauces, onSubmit, onCancel }: MenuItemFormProps) {
//   // Get materials from context
//   const [name, setName] = useState(menuItem?.name || "");
//   const [category, setCategory] = useState<MenuItemCategory | "">("");
//   const [price, setPrice] = useState(menuItem?.price.toString() || "");
//   const [isPOSItem, setIsPOSItem] = useState(menuItem?.isPOSItem ?? true);
//   const [image, setImage] = useState<string | undefined>(menuItem?.image);
//   const [imageFile, setImageFile] = useState<File | undefined>(undefined);
//   const [ingredients, setIngredients] = useState<MenuItemIngredient[]>(menuItem && menuItem.ingredients && Array.isArray(menuItem.ingredients) ? menuItem.ingredients.map(i => ({ materialId: i.materialId, quantity: i.quantity, unit: i.unit, cost: i.cost })) : menuItem && menuItem.menuItemIngredients && Array.isArray(menuItem.menuItemIngredients) ? menuItem.menuItemIngredients.map(i => ({ materialId: i.materialId, quantity: i.quantity, unit: i.unit, cost: i.cost })) : []);
//   const [errors, setErrors] = useState<{
//     name?: string;
//     category?: string;
//     price?: string;
//     ingredients?: string;
//     ingredientQuantity?: string;
//   }>({});

//   useEffect(() => {
//     console.log("Saucesssss", sauces);
//   }, [sauces]);

//   // Initialize category when menuItem or categories change
//   useEffect(() => {
//     if (!Array.isArray(categories) || categories.length === 0) {
//       setCategory("");
//       return;
//     }
//     if (!menuItem?.category) {
//       setCategory("");
//       return;
//     }
//     if (typeof menuItem.category === "number") {
//       const categoryObj = categories.find(cat => cat.id === menuItem.category);
//       setCategory((categoryObj?.value || "") as MenuItemCategory | "");
//     } else if (typeof menuItem.category === "object" && menuItem.category !== null && "id" in menuItem.category) {
//       const categoryId = (menuItem.category as { id: number }).id;
//       const categoryObj = categories.find(cat => cat.id === categoryId);
//       setCategory((categoryObj?.value || "") as MenuItemCategory | "");
//     } else if (typeof menuItem.category === "string") {
//       setCategory(menuItem.category as MenuItemCategory | "");
//     } else {
//       setCategory("");
//     }
//   }, [menuItem?.category, categories]);

//   const validateForm = useCallback(() => {
//     const newErrors: typeof errors = {};
//     if (!name.trim()) newErrors.name = "required";
//     if (!category) newErrors.category = "required";
//     if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) newErrors.price = "required";
//     const noIngredientsCategories = ["alcohol", "cold", "hot", "shisha"];
//     const requiresIngredients = !noIngredientsCategories.includes(category.toLowerCase());
//     if (requiresIngredients && ingredients.length === 0) {
//       newErrors.ingredients = "At least one ingredient is required";
//     }
//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   }, [name, category, price, ingredients]);

//   useEffect(() => {
//     validateForm();
//   }, [name, category, price, ingredients, validateForm]);

//   useEffect(() => {
//     if (menuItem) {
//       setName(menuItem.name || "");
//       let categoryValue: MenuItemCategory | "" = "";
//       if (typeof menuItem.category === "object" && menuItem.category !== null) {
//         // Category is an object with id and name
//         categoryValue = (menuItem.category.name || "") as MenuItemCategory | "";
//       } else if (typeof menuItem.category === "string") {
//         // Category is already a string
//         categoryValue = menuItem.category as MenuItemCategory | "";
//       } else if (typeof menuItem.category === "number") {
//         // Category is a number ID - find matching category from backend
//         const matchingCategory = categories.find(cat => cat.id === menuItem.category);
//         categoryValue = (matchingCategory?.name || "") as MenuItemCategory | "";
//       }
//       setCategory(categoryValue);
//       setPrice(menuItem.price.toString() || "");
//       setIsPOSItem(menuItem.isPOSItem || false);
//       // Check both menuItem.ingredients and menuItem.menuItemIngredients
//       setIngredients(
//         menuItem.ingredients && Array.isArray(menuItem.ingredients)
//           ? menuItem.ingredients.map(i => ({
//               materialId: i.materialId,
//               quantity: i.quantity,
//               unit: i.unit,
//               cost: i.cost
//             }))
//           : menuItem.menuItemIngredients && Array.isArray(menuItem.menuItemIngredients)
//             ? menuItem.menuItemIngredients.map(i => ({
//                 materialId: i.materialId,
//                 quantity: i.quantity,
//                 unit: i.unit,
//                 cost: i.cost
//               }))
//             : []
//       );
//     } else {
//       setName("");
//       setCategory("");
//       setPrice("");
//       setIsPOSItem(true);
//       setIngredients([]);
//     }
//     setErrors({});
//   }, [menuItem]);

//   const handleImageChange = useCallback((imageValue: string | undefined, file?: File) => {
//     setImage(imageValue);
//     setImageFile(file);
//   }, []);

//   const handleSubmit = useCallback(() => {
//     if (!validateForm()) {
//       return;
//     }

//     try {
//       const ingredientsWithCosts = ingredients;
//       const selectedCategory = Array.isArray(categories) ? categories.find(cat => cat.value === category) : undefined;
//       if (!selectedCategory && category) {
//         console.error("Invalid category selected:", category);
//         toast({
//           title: "Error",
//           description: "Selected category is not valid. Please select a valid category.",
//           variant: "destructive",
//           duration: 1000
//         });
//         return;
//       }
//       let categoryToSubmit: number | MenuItemCategory | { id: number; name: string; value: string } | null = null;
//       if (selectedCategory) {
//         categoryToSubmit = {
//           id: selectedCategory.id,
//           name: selectedCategory.name,
//           value: selectedCategory.value
//         };
//       } else if (category) {
//         categoryToSubmit = category as MenuItemCategory;
//       }

//       const submitData = {
//         name: name.trim(),
//         category: categoryToSubmit,
//         price: parseFloat(price),
//         ingredients: ingredientsWithCosts,
//         isPOSItem,
//         image,
//         imageFile,
//         menuItemIngredients: ingredientsWithCosts,
//         unit: "",
//         availableQuantity: 0,
//         costPerUnit: 0
//       };

//       onSubmit(submitData);
//       setName("");
//       setCategory("");
//       setPrice("");
//       setIsPOSItem(true);
//       setImage(undefined);
//       setImageFile(undefined);
//       setIngredients([]);
//       setErrors({});
//       onCancel();
//     } catch (error) {
//       console.error("Error submitting form:", error);
//       onCancel();
//     }
//   }, [name, category, price, isPOSItem, image, ingredients, onSubmit, onCancel, validateForm]);

//   const handleCancel = useCallback(() => {
//     onCancel();
//   }, [onCancel]);

//   const handleKeyDown = (e: React.KeyboardEvent) => {
//     if (e.key === "Enter") {
//       e.preventDefault();
//       const hasName = !!(name && name.trim());
//       const hasCategory = !!category;
//       const hasValidPrice = !!(price && !isNaN(parseFloat(price)) && parseFloat(price) > 0);
//       const noIngredientsCategories = ["alcohol", "cold", "hot", "shisha"];
//       const requiresIngredients = !noIngredientsCategories.includes(category.toLowerCase());
//       const hasIngredients = ingredients.length > 0;
//       const hasNoErrors = Object.keys(errors).length === 0;
//       const isFormValid = hasNoErrors && hasName && hasCategory && hasValidPrice && (hasIngredients || !requiresIngredients);

//       if (isFormValid) {
//         handleSubmit();
//       }
//     }
//   };

//   const normalizedCategory = useMemo(() => {
//     if (!category || !Array.isArray(categories) || !categories.length) return category;
//     const hasExactMatch = categories.some(c => c.value === category);
//     if (hasExactMatch) return category;
//     const matchByName = categories.find(c => c.name.toLowerCase() === category.toLowerCase() || c.value.toLowerCase() === category.toLowerCase());
//     if (matchByName) {
//       setTimeout(() => setCategory(matchByName.value as MenuItemCategory | ""), 0);
//       return matchByName.value;
//     }
//     return category;
//   }, [category, categories]);

//   return (
//     <div className="space-y-6 p-4">
//       <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4">
//         <div className="md:col-span-2 lg:col-span-3">
//           <label htmlFor="name" className="block text-sm font-medium mb-1">
//             Name <span className="text-red-500">*</span>
//           </label>
//           <Input id="name" value={name} onChange={e => setName(e.target.value)} onKeyDown={handleKeyDown} placeholder="e.g., Hamburger" aria-invalid={!!errors.name} aria-describedby={errors.name ? "name-error" : undefined} />
//           {errors.name ? (
//             <p id="name-error" className="text-sm text-red-500 mt-1">
//               {errors.name}
//             </p>
//           ) : (
//             <p className="text-sm text-gray-500 mt-1">Name is required</p>
//           )}
//         </div>

//         <div className="md:col-span-1 lg:col-span-2">
//           <label htmlFor="category" className="block text-sm font-medium mb-1">
//             Category <span className="text-red-500">*</span>
//           </label>
//           <select id="category" value={normalizedCategory} onChange={e => setCategory(e.target.value as MenuItemCategory | "")} onKeyDown={handleKeyDown} className="w-full px-3 py-2 border border-input bg-background rounded-md" aria-invalid={!!errors.category} aria-describedby={errors.category ? "category-error" : undefined}>
//             <option value="">Select a category</option>
//             {Array.isArray(categories) &&
//               categories.map(cat => (
//                 <option key={cat.value} value={cat.value}>
//                   {cat.name}
//                 </option>
//               ))}
//           </select>
//           {errors.category ? (
//             <p id="category-error" className="text-sm text-red-500 mt-1">
//               {errors.category}
//             </p>
//           ) : (
//             <p className="text-sm text-gray-500 mt-1">Category is required</p>
//           )}
//         </div>

//         <div className="md:col-span-1 lg:col-span-1">
//           <label htmlFor="price" className="block text-sm font-medium mb-1">
//             Price <span className="text-red-500">*</span>
//           </label>
//           <Input id="price" type="number" value={price} onChange={e => setPrice(e.target.value)} onKeyDown={handleKeyDown} placeholder="0.00" min="0" step="0.01" aria-invalid={!!errors.price} aria-describedby={errors.price ? "price-error" : undefined} />
//           {errors.price ? (
//             <p id="price-error" className="text-sm text-red-500 mt-1">
//               {errors.price}
//             </p>
//           ) : (
//             <p className="text-sm text-gray-500 mt-1">Price is required</p>
//           )}
//         </div>

//         <div className="md:col-span-1 lg:col-span-2">
//           <label className="block text-sm font-medium mb-1">Show in POS</label>
//           <div className="flex items-center space-x-2 mt-2">
//             <Switch id="isPOSItem" checked={isPOSItem} onCheckedChange={setIsPOSItem} />
//             <p className="text-sm text-gray-500 mt-1">(Make this item available for sale in the POS system)</p>
//           </div>
//         </div>
//       </div>

//       <Ingredients
//         ingredients={ingredients}
//         stockEntries={stockEntries}
//         menuItem={menuItem}
//         category={category}
//         price={price}
//         onIngredientsChange={setIngredients}
//         errors={{
//           ingredients: errors.ingredients,
//           ingredientQuantity: errors.ingredientQuantity
//         }}
//         onErrorsChange={ingredientErrors => {
//           setErrors(prev => ({
//             ...prev,
//             ...ingredientErrors
//           }));
//         }}
//       />

//       {/* Image Upload Section */}
//       <div className="border-t pt-4">
//         <ImageUpload value={image} onChange={handleImageChange} maxSizeInMB={5} acceptedFormats={["image/jpeg", "image/png", "image/webp", "image/gif"]} />
//       </div>

//       <div className="flex justify-end gap-2 pt-4">
//         <Button variant="outline" onClick={handleCancel} aria-label="Cancel form">
//           Cancel
//         </Button>
//         <Button
//           onClick={handleSubmit}
//           disabled={(() => {
//             const noIngredientsCategories = ["alcohol", "cold", "hot", "shisha"];
//             const requiresIngredients = !noIngredientsCategories.includes(category.toLowerCase());

//             return !!Object.keys(errors).length || !name.trim() || !category || !price || parseFloat(price) <= 0 || (requiresIngredients && ingredients.length === 0);
//           })()}
//           aria-label={menuItem ? "Update menu item" : "Create menu item"}
//         >
//           {menuItem ? "Update" : "Create"} Menu Item
//         </Button>
//       </div>
//     </div>
//   );
// }
import { MenuItemCategory, MenuItemIngredient } from "@/types/inventory";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Switch } from "../ui/switch";
import { ImageUpload } from "../ui/image-upload";
import { toast } from "../ui/use-toast";
import { Ingredients } from "./components/Ingredients";
import { MenuItemFormProps, MenuItemSauce } from "@/types/menuItems";

export function MenuItemForm({ menuItem, stockEntries, categories, sauces, onSubmit, onCancel }: MenuItemFormProps) {
  const [name, setName] = useState(menuItem?.name || "");
  const [category, setCategory] = useState<MenuItemCategory | "">("");
  const [price, setPrice] = useState(menuItem?.price.toString() || "");
  const [isPOSItem, setIsPOSItem] = useState(menuItem?.isPOSItem ?? true);
  const [image, setImage] = useState<string | undefined>(menuItem?.image);
  const [imageFile, setImageFile] = useState<File | undefined>(undefined);
  const [ingredients, setIngredients] = useState<MenuItemIngredient[]>(menuItem && menuItem.ingredients && Array.isArray(menuItem.ingredients) ? menuItem.ingredients.map(i => ({ materialId: i.materialId, quantity: i.quantity, unit: i.unit, cost: i.cost })) : menuItem && menuItem.menuItemIngredients && Array.isArray(menuItem.menuItemIngredients) ? menuItem.menuItemIngredients.map(i => ({ materialId: i.materialId, quantity: i.quantity, unit: i.unit, cost: i.cost })) : []);
  const [errors, setErrors] = useState<{
    name?: string;
    category?: string;
    price?: string;
    ingredients?: string;
    ingredientQuantity?: string;
  }>({});

  // Separate ingredients and sauces from the combined ingredients array
  const { materials: separatedIngredients, sauces: separatedSauces } = useMemo(() => {
    const materials: MenuItemIngredient[] = [];
    const sauces: MenuItemSauce[] = [];

    ingredients.forEach(item => {
      if (item.materialId.startsWith("sauce-")) {
        sauces.push({
          sauceId: item.materialId.replace("sauce-", ""),
          quantity: item.quantity,
          unit: item.unit,
          cost: item.cost
        });
      } else {
        materials.push(item);
      }
    });

    return { materials, sauces };
  }, [ingredients]);

  // Initialize category when menuItem or categories change
  useEffect(() => {
    if (!Array.isArray(categories) || categories.length === 0) {
      setCategory("");
      return;
    }
    if (!menuItem?.category) {
      setCategory("");
      return;
    }
    if (typeof menuItem.category === "number") {
      const categoryObj = categories.find(cat => cat.id === menuItem.category);
      setCategory((categoryObj?.value || "") as MenuItemCategory | "");
    } else if (typeof menuItem.category === "object" && menuItem.category !== null && "id" in menuItem.category) {
      const categoryId = (menuItem.category as { id: number }).id;
      const categoryObj = categories.find(cat => cat.id === categoryId);
      setCategory((categoryObj?.value || "") as MenuItemCategory | "");
    } else if (typeof menuItem.category === "string") {
      setCategory(menuItem.category as MenuItemCategory | "");
    } else {
      setCategory("");
    }
  }, [menuItem?.category, categories]);

  const validateForm = useCallback(() => {
    const newErrors: typeof errors = {};
    if (!name.trim()) newErrors.name = "required";
    if (!category) newErrors.category = "required";
    if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) newErrors.price = "required";
    const noIngredientsCategories = ["alcohol", "cold", "hot", "shisha"];
    const requiresIngredients = !noIngredientsCategories.includes(category.toLowerCase());

    // Check if we have either materials or sauces
    const hasMaterials = separatedIngredients.length > 0;
    const hasSauces = separatedSauces.length > 0;

    if (requiresIngredients && !hasMaterials && !hasSauces) {
      newErrors.ingredients = "At least one ingredient or sauce is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [name, category, price, separatedIngredients, separatedSauces]);

  useEffect(() => {
    validateForm();
  }, [name, category, price, separatedIngredients, separatedSauces, validateForm]);

  useEffect(() => {
    if (menuItem) {
      setName(menuItem.name || "");
      let categoryValue: MenuItemCategory | "" = "";
      if (typeof menuItem.category === "object" && menuItem.category !== null) {
        // Category is an object with id and name
        categoryValue = (menuItem.category.name || "") as MenuItemCategory | "";
      } else if (typeof menuItem.category === "string") {
        // Category is already a string
        categoryValue = menuItem.category as MenuItemCategory | "";
      } else if (typeof menuItem.category === "number") {
        // Category is a number ID - find matching category from backend
        const matchingCategory = categories.find(cat => cat.id === menuItem.category);
        categoryValue = (matchingCategory?.name || "") as MenuItemCategory | "";
      }
      setCategory(categoryValue);
      setPrice(menuItem.price.toString() || "");
      setIsPOSItem(menuItem.isPOSItem || false);
      // Check both menuItem.ingredients and menuItem.menuItemIngredients
      setIngredients(
        menuItem.ingredients && Array.isArray(menuItem.ingredients)
          ? menuItem.ingredients.map(i => ({
              materialId: i.materialId,
              quantity: i.quantity,
              unit: i.unit,
              cost: i.cost
            }))
          : menuItem.menuItemIngredients && Array.isArray(menuItem.menuItemIngredients)
            ? menuItem.menuItemIngredients.map(i => ({
                materialId: i.materialId,
                quantity: i.quantity,
                unit: i.unit,
                cost: i.cost
              }))
            : []
      );
    } else {
      setName("");
      setCategory("");
      setPrice("");
      setIsPOSItem(true);
      setIngredients([]);
    }
    setErrors({});
  }, [menuItem]);

  const handleImageChange = useCallback((imageValue: string | undefined, file?: File) => {
    setImage(imageValue);
    setImageFile(file);
  }, []);

  const handleSubmit = useCallback(() => {
    if (!validateForm()) {
      return;
    }

    try {
      const selectedCategory = Array.isArray(categories) ? categories.find(cat => cat.value === category) : undefined;
      if (!selectedCategory && category) {
        console.error("Invalid category selected:", category);
        toast({
          title: "Error",
          description: "Selected category is not valid. Please select a valid category.",
          variant: "destructive",
          duration: 1000
        });
        return;
      }
      let categoryToSubmit: number | MenuItemCategory | { id: number; name: string; value: string } | null = null;
      if (selectedCategory) {
        categoryToSubmit = {
          id: selectedCategory.id,
          name: selectedCategory.name,
          value: selectedCategory.value
        };
      } else if (category) {
        categoryToSubmit = category as MenuItemCategory;
      }

      const submitData = {
        name: name.trim(),
        category: categoryToSubmit,
        price: parseFloat(price),
        ingredients: separatedIngredients, // Regular materials
        sauces: separatedSauces, // Sauces
        isPOSItem,
        image,
        imageFile,
        menuItemIngredients: [...separatedIngredients], // For backward compatibility
        unit: "",
        availableQuantity: 0,
        costPerUnit: 0
      };

      onSubmit(submitData);
      setName("");
      setCategory("");
      setPrice("");
      setIsPOSItem(true);
      setImage(undefined);
      setImageFile(undefined);
      setIngredients([]);
      setErrors({});
      onCancel();
    } catch (error) {
      console.error("Error submitting form:", error);
      onCancel();
    }
  }, [name, category, price, isPOSItem, image, separatedIngredients, separatedSauces, onSubmit, onCancel, validateForm]);

  const handleCancel = useCallback(() => {
    onCancel();
  }, [onCancel]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const hasName = !!(name && name.trim());
      const hasCategory = !!category;
      const hasValidPrice = !!(price && !isNaN(parseFloat(price)) && parseFloat(price) > 0);
      const noIngredientsCategories = ["alcohol", "cold", "hot", "shisha"];
      const requiresIngredients = !noIngredientsCategories.includes(category.toLowerCase());
      const hasMaterials = separatedIngredients.length > 0;
      const hasSauces = separatedSauces.length > 0;
      const hasIngredients = hasMaterials || hasSauces;
      const hasNoErrors = Object.keys(errors).length === 0;
      const isFormValid = hasNoErrors && hasName && hasCategory && hasValidPrice && (hasIngredients || !requiresIngredients);

      if (isFormValid) {
        handleSubmit();
      }
    }
  };

  const normalizedCategory = useMemo(() => {
    if (!category || !Array.isArray(categories) || !categories.length) return category;
    const hasExactMatch = categories.some(c => c.value === category);
    if (hasExactMatch) return category;
    const matchByName = categories.find(c => c.name.toLowerCase() === category.toLowerCase() || c.value.toLowerCase() === category.toLowerCase());
    if (matchByName) {
      setTimeout(() => setCategory(matchByName.value as MenuItemCategory | ""), 0);
      return matchByName.value;
    }
    return category;
  }, [category, categories]);

  return (
    <div className="space-y-6 p-4">
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <div className="md:col-span-2 lg:col-span-3">
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            Name <span className="text-red-500">*</span>
          </label>
          <Input id="name" value={name} onChange={e => setName(e.target.value)} onKeyDown={handleKeyDown} placeholder="e.g., Hamburger" aria-invalid={!!errors.name} aria-describedby={errors.name ? "name-error" : undefined} />
          {errors.name ? (
            <p id="name-error" className="text-sm text-red-500 mt-1">
              {errors.name}
            </p>
          ) : (
            <p className="text-sm text-gray-500 mt-1">Name is required</p>
          )}
        </div>

        <div className="md:col-span-1 lg:col-span-2">
          <label htmlFor="category" className="block text-sm font-medium mb-1">
            Category <span className="text-red-500">*</span>
          </label>
          <select id="category" value={normalizedCategory} onChange={e => setCategory(e.target.value as MenuItemCategory | "")} onKeyDown={handleKeyDown} className="w-full px-3 py-2 border border-input bg-background rounded-md" aria-invalid={!!errors.category} aria-describedby={errors.category ? "category-error" : undefined}>
            <option value="">Select a category</option>
            {Array.isArray(categories) &&
              categories.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.name}
                </option>
              ))}
          </select>
          {errors.category ? (
            <p id="category-error" className="text-sm text-red-500 mt-1">
              {errors.category}
            </p>
          ) : (
            <p className="text-sm text-gray-500 mt-1">Category is required</p>
          )}
        </div>

        <div className="md:col-span-1 lg:col-span-1">
          <label htmlFor="price" className="block text-sm font-medium mb-1">
            Price <span className="text-red-500">*</span>
          </label>
          <Input id="price" type="number" value={price} onChange={e => setPrice(e.target.value)} onKeyDown={handleKeyDown} placeholder="0.00" min="0" step="0.01" aria-invalid={!!errors.price} aria-describedby={errors.price ? "price-error" : undefined} />
          {errors.price ? (
            <p id="price-error" className="text-sm text-red-500 mt-1">
              {errors.price}
            </p>
          ) : (
            <p className="text-sm text-gray-500 mt-1">Price is required</p>
          )}
        </div>

        <div className="md:col-span-1 lg:col-span-2">
          <label className="block text-sm font-medium mb-1">Show in POS</label>
          <div className="flex items-center space-x-2 mt-2">
            <Switch id="isPOSItem" checked={isPOSItem} onCheckedChange={setIsPOSItem} />
            <p className="text-sm text-gray-500 mt-1">(Make this item available for sale in the POS system)</p>
          </div>
        </div>
      </div>

      <Ingredients
        ingredients={ingredients}
        stockEntries={stockEntries}
        menuItem={menuItem}
        category={category}
        price={price}
        onIngredientsChange={setIngredients}
        errors={{
          ingredients: errors.ingredients,
          ingredientQuantity: errors.ingredientQuantity
        }}
        onErrorsChange={ingredientErrors => {
          setErrors(prev => ({
            ...prev,
            ...ingredientErrors
          }));
        }}
        sauces={sauces}
      />

      {/* Image Upload Section */}
      <div className="border-t pt-4">
        <ImageUpload value={image} onChange={handleImageChange} maxSizeInMB={5} acceptedFormats={["image/jpeg", "image/png", "image/webp", "image/gif"]} />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={handleCancel} aria-label="Cancel form">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={(() => {
            const noIngredientsCategories = ["alcohol", "cold", "hot", "shisha"];
            const requiresIngredients = !noIngredientsCategories.includes(category.toLowerCase());
            const hasMaterials = separatedIngredients.length > 0;
            const hasSauces = separatedSauces.length > 0;
            const hasIngredients = hasMaterials || hasSauces;

            return !!Object.keys(errors).length || !name.trim() || !category || !price || parseFloat(price) <= 0 || (requiresIngredients && !hasIngredients);
          })()}
          aria-label={menuItem ? "Update menu item" : "Create menu item"}
        >
          {menuItem ? "Update" : "Create"} Menu Item
        </Button>
      </div>
    </div>
  );
}
