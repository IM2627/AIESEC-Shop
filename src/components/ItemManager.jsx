import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function ItemManager() {
  const [items, setItems] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    image_url: '',
    active: true
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')

  useEffect(() => {
    fetchItems()
  }, [])

  async function fetchItems() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      setItems(data || [])
    } catch (error) {
      alert('Error loading items: ' + error.message)
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  async function handleImageUpload(file) {
    if (!file) return null
    
    setUploading(true)
    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = fileName

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('item-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) throw error

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('item-images')
        .getPublicUrl(filePath)

      return publicUrl
    } catch (error) {
      console.error('Upload error:', error)
      alert('Error uploading image: ' + error.message)
      return null
    } finally {
      setUploading(false)
    }
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB')
      return
    }

    setImageFile(file)
    
    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result)
    }
    reader.readAsDataURL(file)
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    
    try {
      // Upload image if file selected
      let imageUrl = formData.image_url
      if (imageFile) {
        imageUrl = await handleImageUpload(imageFile)
        if (!imageUrl) {
          setSaving(false)
          return
        }
      }

      const itemData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        image_url: imageUrl || null,
        active: formData.active
      }

      if (editingId) {
        // Update existing item
        const { error } = await supabase
          .from('items')
          .update(itemData)
          .eq('id', editingId)
        
        if (error) throw error
        setEditingId(null)
      } else {
        // Insert new item
        const { error } = await supabase
          .from('items')
          .insert([itemData])
        
        if (error) throw error
      }

      // Reset form
      setFormData({ name: '', description: '', price: '', stock: '', image_url: '', active: true })
      setImageFile(null)
      setImagePreview('')
      await fetchItems()
    } catch (error) {
      alert('Error saving item: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
      const { error } = await supabase.from('items').delete().eq('id', id)
      if (!error) {
        await fetchItems()
      } else {
        alert('Error deleting item: ' + error.message)
      }
    }
  }

  function handleEdit(item) {
    setEditingId(item.id)
    setFormData({
      name: item.name,
      description: item.description || '',
      price: item.price,
      stock: item.stock,
      image_url: item.image_url || '',
      active: item.active
    })
    setImageFile(null)
    setImagePreview(item.image_url || '')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleCancel() {
    setEditingId(null)
    setFormData({ name: '', description: '', price: '', stock: '', image_url: '', active: true })
    setImageFile(null)
    setImagePreview('')
  }

  return (
    <div className="space-y-6">
      {/* Form */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4">
          {editingId ? '✏️ Edit Item' : '➕ Add New Item'}
        </h2>
        <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Item Name *</label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-aiesec-blue"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., AIESEC T-Shirt"
              disabled={saving}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Price (TND) *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-aiesec-blue"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="0.00"
              disabled={saving}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-aiesec-blue"
              rows="3"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Item description..."
              disabled={saving}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Item Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-aiesec-blue"
              disabled={saving || uploading}
            />
            <p className="text-xs text-gray-500 mt-1">Max 5MB • Supported: JPG, PNG, WebP, GIF</p>
            
            {(imagePreview || formData.image_url) && (
              <div className="mt-3">
                <p className="text-xs font-medium text-gray-700 mb-2">Preview:</p>
                <div className="relative inline-block">
                  <img 
                    src={imagePreview || formData.image_url} 
                    alt="Preview" 
                    className="w-32 h-32 object-cover rounded border-2 border-gray-300"
                  />
                  {uploading && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded">
                      <div className="animate-spin rounded-full h-8 w-8 border-4 border-white border-t-transparent"></div>
                    </div>
                  )}
                </div>
                {imageFile && (
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null)
                      setImagePreview('')
                    }}
                    className="ml-3 text-sm text-red-600 hover:underline"
                    disabled={saving || uploading}
                  >
                    Remove
                  </button>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Stock Quantity *</label>
            <input
              type="number"
              min="0"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-aiesec-blue"
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
              placeholder="0"
              disabled={saving}
            />
          </div>

          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="w-4 h-4 text-aiesec-blue"
                disabled={saving}
              />
              <span className="text-sm font-medium">Active (visible in shop)</span>
            </label>
          </div>

          <div className="md:col-span-2 flex gap-2">
            <button
              type="submit"
              className="px-6 py-2 bg-aiesec-blue text-white rounded hover:bg-blue-700 font-semibold transition disabled:opacity-50"
              disabled={saving || uploading}
            >
              {uploading ? 'Uploading...' : saving ? 'Saving...' : editingId ? 'Update Item' : 'Add Item'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50 transition"
                disabled={saving}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Items List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <h3 className="text-xl font-bold p-6 border-b bg-gray-50">All Items</h3>
        {loading ? (
          <div className="p-6 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-aiesec-blue border-t-transparent"></div>
            <p className="text-gray-600 mt-2">Loading items...</p>
          </div>
        ) : items.length === 0 ? (
          <p className="p-6 text-gray-600 text-center">No items yet. Add your first item above!</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Image</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Description</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Price</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Stock</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-3">
                      {item.image_url ? (
                        <img 
                          src={item.image_url} 
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded border border-gray-200"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center text-2xl">
                          📦
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-3 font-medium">{item.name}</td>
                    <td className="px-6 py-3 text-sm text-gray-600 max-w-xs truncate">
                      {item.description || '-'}
                    </td>
                    <td className="px-6 py-3">{item.price} TND</td>
                    <td className="px-6 py-3">
                      <span className={item.stock === 0 ? 'text-red-600 font-semibold' : 'text-gray-700'}>
                        {item.stock}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                        item.active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {item.active ? '✓ Active' : '✗ Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-blue-600 hover:underline font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600 hover:underline font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
