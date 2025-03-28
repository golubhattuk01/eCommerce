"use client"
import { useRouter } from "next/navigation";
import { useState } from "react";

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: { id: string; name: string }[];
}

const ProductModal = ({ isOpen, onClose, categories }: ProductModalProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    discount: "",
    categoryIds: [] as string[],
    images: [] as File[],
  });

  const handleNewProductSubmit = async (product: any) => {
    try {
      setIsLoading(true);
  
      const formData = new FormData();
      formData.append("name", product.name);
      formData.append("description", product.description);
      formData.append("price", product.price);
      product.categoryIds.forEach((id) => formData.append("categoryIds", id));
  
      product.images.forEach((file: File, index: number) => {
        formData.append("images", file, `image-${index + 1}`);
      });
  
      const response = await fetch("/admin/addProduct", {
        method: "POST",
        body: formData,
      });
  
      if(!response.ok) {
        console.log("Failed to add product");
        return;
      }
  
      const responseData = await response.json();
  
      if (!response.ok) {
        console.error("❌ Backend Error:", responseData);
        alert(`Failed to add product! Server says: ${responseData.error || "Unknown error"}`);
        return;
      }
      
      alert("🎉 Product added successfully!");
      router.push(`/products/${responseData.product.id}`);
    } catch (error) {
      console.error("🚨 Network or Unexpected Error:", error);
      alert("⚠️ Error adding product. Check console for details.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files as FileList | null;
    if (files && files.length > 0) {
      setNewProduct((prev) => ({
        ...prev,
        images: [...prev.images, ...Array.from(files)],
      }));
    }
  };

  const toggleCategory = (id: string) => {
    setNewProduct((prev) => {
      if (prev.categoryIds.includes(id)) {
        return { ...prev, categoryIds: prev.categoryIds.filter((catId) => catId !== id) };
      } else {
        return { ...prev, categoryIds: [...prev.categoryIds, id] };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newProduct.images.length < 1) {
      alert("Please upload at least one image.");
      return;
    }
    await handleNewProductSubmit(newProduct);
    setNewProduct({
      name: "",
      description: "",
      price: "",
      stock: "",
      discount: "",
      categoryIds: [],
      images: [],
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-30">
      <div className="bg-white rounded-lg p-6 w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 bg-red-500 text-white p-1 rounded-full w-6 h-6 flex items-center justify-center"
        >
          ✕
        </button>
        <h2 className="text-2xl font-semibold mb-4">Add New Product</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Name"
            required
            className="border p-2 w-full rounded"
            value={newProduct.name}
            onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
          />
          <textarea
            placeholder="Description"
            required
            className="border p-2 w-full rounded"
            value={newProduct.description}
            onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
          />
          <input
            placeholder="Price"
            required
            type="number"
            className="border p-2 w-full rounded"
            value={newProduct.price}
            onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
          />
          <div>
            <label className="block font-medium mb-2">Select Categories ({newProduct.categoryIds.length})</label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleCategory(cat.id)}
                  className={`px-3 py-1 rounded-md border ${newProduct.categoryIds.includes(cat.id) ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageChange}
            className="border p-2 w-full rounded"
          />
          <div className="mt-4">
            {newProduct.images.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {newProduct.images.map((file, index) => (
                  <img key={index} src={URL.createObjectURL(file)} alt={`Image-${index}`} className="w-16 h-16 object-cover" />
                ))}
              </div>
            )}
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-green-500 text-white rounded-md"
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Save"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;
