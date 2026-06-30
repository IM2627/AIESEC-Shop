import { useEffect, useMemo, useState } from 'react'
import { ITEM_CATEGORIES, isValidItemCategory } from '../lib/catalog'
import { formatCurrency } from '../lib/formatters'
import { isMissingItemSchemaField } from '../lib/itemSchema'
import { supabase } from '../lib/supabase'

const emptyFormData = {
  name: '',
  description: '',
  category: '',
  price: '',
  stock: '',
  image_url: '',
  active: true,
}

function validateItemForm(values, options = {}) {
  const errors = {}
  const price = Number.parseFloat(values.price)
  const stock = Number.parseInt(values.stock, 10)
  const requireCategory = options.requireCategory !== false

  if (!values.name.trim()) {
    errors.name = 'Item name is required.'
  }

  if (requireCategory && !isValidItemCategory(values.category)) {
    errors.category = 'Please choose one of the allowed categories.'
  }

  if (!Number.isFinite(price) || price < 0) {
    errors.price = 'Price must be a valid number that is 0 or higher.'
  }

  if (!Number.isInteger(stock) || stock < 0) {
    errors.stock = 'Stock must be a whole number that is 0 or higher.'
  }

  return errors
}

export default function ItemManager() {
  const [items, setItems] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState(emptyFormData)
  const [formErrors, setFormErrors] = useState({})
  const [formErrorMessage, setFormErrorMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [spotlightSaving, setSpotlightSaving] = useState(false)
  const [legacySchemaMode, setLegacySchemaMode] = useState(false)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')

  const currentSpotlight = useMemo(
    () => items.find((item) => item.is_spotlight) || null,
    [items],
  )

  useEffect(() => {
    fetchItems()
  }, [])

  async function fetchItems() {
    setLoading(true)

    try {
      let data

      try {
        const response = await supabase
          .from('items')
          .select('*')
          .order('is_spotlight', { ascending: false })
          .order('created_at', { ascending: false })

        if (response.error) {
          throw response.error
        }

        data = response.data || []
        setLegacySchemaMode(false)
      } catch (schemaError) {
        if (!isMissingItemSchemaField(schemaError)) {
          throw schemaError
        }

        const fallbackResponse = await supabase
          .from('items')
          .select('*')
          .order('created_at', { ascending: false })

        if (fallbackResponse.error) {
          throw fallbackResponse.error
        }

        data = (fallbackResponse.data || []).map((item) => ({
          ...item,
          category: item.category || '',
          is_spotlight: false,
        }))
        setLegacySchemaMode(true)
      }

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
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

      const { error } = await supabase.storage
        .from('item-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (error) {
        throw error
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from('item-images').getPublicUrl(fileName)

      return publicUrl
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('Upload error:', error)
      }

      alert('Error uploading image: ' + error.message)
      return null
    } finally {
      setUploading(false)
    }
  }

  function resetForm() {
    setEditingId(null)
    setFormData(emptyFormData)
    setFormErrors({})
    setFormErrorMessage('')
    setImageFile(null)
    setImagePreview('')
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB.')
      return
    }

    setImageFile(file)

    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result)
    }
    reader.readAsDataURL(file)
  }

  function updateField(field, value) {
    const nextFormData = { ...formData, [field]: value }
    setFormData(nextFormData)
    setFormErrorMessage('')

    if (formErrors[field]) {
      setFormErrors(validateItemForm(nextFormData))
    }
  }

  async function handleSave(event) {
    event.preventDefault()

    const nextErrors = validateItemForm(formData, { requireCategory: !legacySchemaMode })
    setFormErrors(nextErrors)
    setFormErrorMessage('')

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setSaving(true)

    try {
      let imageUrl = formData.image_url
      if (imageFile) {
        imageUrl = await handleImageUpload(imageFile)
        if (!imageUrl) {
          setSaving(false)
          return
        }
      }

      const itemData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        price: Number.parseFloat(formData.price),
        stock: Number.parseInt(formData.stock, 10),
        image_url: imageUrl || null,
        active: formData.active,
      }

      if (!legacySchemaMode) {
        itemData.category = formData.category
      }

      if (editingId) {
        const { error } = await supabase
          .from('items')
          .update(itemData)
          .eq('id', editingId)

        if (error) {
          throw error
        }
      } else {
        const { error } = await supabase
          .from('items')
          .insert([itemData])

        if (error) {
          throw error
        }
      }

      resetForm()
      await fetchItems()
    } catch (error) {
      setFormErrorMessage(error.message || 'Unable to save this item right now.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
      return
    }

    const { error } = await supabase.from('items').delete().eq('id', id)

    if (error) {
      alert('Error deleting item: ' + error.message)
      return
    }

    if (editingId === id) {
      resetForm()
    }

    await fetchItems()
  }

  function handleEdit(item) {
    setEditingId(item.id)
    setFormData({
      name: item.name,
      description: item.description || '',
      category: item.category || '',
      price: String(item.price ?? ''),
      stock: String(item.stock ?? ''),
      image_url: item.image_url || '',
      active: item.active,
    })
    setFormErrors({})
    setFormErrorMessage('')
    setImageFile(null)
    setImagePreview(item.image_url || '')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function setSpotlightItem(itemId) {
    if (legacySchemaMode) {
      alert('Spotlight selection requires the latest database migration.')
      return
    }

    setSpotlightSaving(true)

    try {
      if (!itemId) {
        if (!currentSpotlight) {
          return
        }

        const { error } = await supabase
          .from('items')
          .update({ is_spotlight: false })
          .eq('id', currentSpotlight.id)

        if (error) {
          throw error
        }
      } else {
        const { error } = await supabase
          .from('items')
          .update({ is_spotlight: true })
          .eq('id', itemId)

        if (error) {
          throw error
        }
      }

      await fetchItems()
    } catch (error) {
      alert('Error updating spotlight item: ' + error.message)
    } finally {
      setSpotlightSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow">
        {legacySchemaMode ? (
          <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-6 text-amber-900">
            The latest database migration has not been applied yet. The admin panel is running in compatibility mode, so category and spotlight management are temporarily unavailable until the SQL update is run in Supabase.
          </div>
        ) : null}

        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold text-gray-900">Spotlight item</h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              Choose one product to appear in the public spotlight section. Selecting a new item will automatically replace the previous spotlight.
            </p>
            <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {currentSpotlight ? (
                <span>
                  Current spotlight: <strong>{currentSpotlight.name}</strong> in <strong>{currentSpotlight.category}</strong>
                  {currentSpotlight.active ? '' : ' (hidden from the catalog)'}
                </span>
              ) : (
                <span>No spotlight item is selected right now.</span>
              )}
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 lg:max-w-xl">
            <label className="block text-sm font-medium text-gray-700">Select spotlight item</label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <select
                value={currentSpotlight?.id || ''}
                onChange={(event) => setSpotlightItem(event.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-aiesec-blue"
                disabled={legacySchemaMode || spotlightSaving || saving || loading || items.length === 0}
              >
                <option value="">No spotlight item</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} - {item.category} {item.active ? '' : '(Hidden)'}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setSpotlightItem('')}
                className="rounded-xl border border-gray-300 px-4 py-3 font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={legacySchemaMode || spotlightSaving || !currentSpotlight}
              >
                {spotlightSaving ? 'Updating...' : 'Clear spotlight'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow">
        <h2 className="mb-4 text-2xl font-bold text-gray-900">
          {editingId ? 'Edit item' : 'Add new item'}
        </h2>

        <form onSubmit={handleSave} className="grid grid-cols-1 gap-4 md:grid-cols-2" noValidate>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Item name *</label>
            <input
              type="text"
              required
              className={`w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-aiesec-blue ${
                formErrors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              value={formData.name}
              onChange={(event) => updateField('name', event.target.value)}
              placeholder="e.g., AIESEC T-Shirt"
              disabled={saving}
            />
            {formErrors.name ? <p className="mt-1 text-sm text-red-600">{formErrors.name}</p> : null}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Category *</label>
            <select
              required={!legacySchemaMode}
              className={`w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-aiesec-blue ${
                formErrors.category ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              value={formData.category}
              onChange={(event) => updateField('category', event.target.value)}
              disabled={saving || legacySchemaMode}
            >
              <option value="">Choose a category</option>
              {ITEM_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            {legacySchemaMode ? (
              <p className="mt-1 text-sm text-amber-700">Category selection will unlock after the Supabase migration is applied.</p>
            ) : formErrors.category ? (
              <p className="mt-1 text-sm text-red-600">{formErrors.category}</p>
            ) : null}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Price (TND) *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              className={`w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-aiesec-blue ${
                formErrors.price ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              value={formData.price}
              onChange={(event) => updateField('price', event.target.value)}
              placeholder="0.00"
              disabled={saving}
            />
            {formErrors.price ? <p className="mt-1 text-sm text-red-600">{formErrors.price}</p> : null}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Stock quantity *</label>
            <input
              type="number"
              min="0"
              required
              className={`w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-aiesec-blue ${
                formErrors.stock ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              value={formData.stock}
              onChange={(event) => updateField('stock', event.target.value)}
              placeholder="0"
              disabled={saving}
            />
            {formErrors.stock ? <p className="mt-1 text-sm text-red-600">{formErrors.stock}</p> : null}
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
            <textarea
              className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-aiesec-blue"
              rows="3"
              value={formData.description}
              onChange={(event) => updateField('description', event.target.value)}
              placeholder="Item description..."
              disabled={saving}
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">Item image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-aiesec-blue"
              disabled={saving || uploading}
            />
            <p className="mt-1 text-xs text-gray-500">Max 5MB - Supported: JPG, PNG, WebP, GIF</p>

            {(imagePreview || formData.image_url) && (
              <div className="mt-3">
                <p className="mb-2 text-xs font-medium text-gray-700">Preview:</p>
                <div className="relative inline-block">
                  <img
                    src={imagePreview || formData.image_url}
                    alt="Preview"
                    className="h-32 w-32 rounded border-2 border-gray-300 object-cover"
                  />
                  {uploading && (
                    <div className="absolute inset-0 flex items-center justify-center rounded bg-black bg-opacity-50">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent" />
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

          <div className="flex items-end">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(event) => updateField('active', event.target.checked)}
                className="h-4 w-4 text-aiesec-blue"
                disabled={saving}
              />
              <span className="text-sm font-medium text-gray-700">Active (visible in the shop catalog)</span>
            </label>
          </div>

          <div className="md:col-span-2">
            {formErrorMessage ? (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {formErrorMessage}
              </div>
            ) : null}

            <div className="flex gap-2">
              <button
                type="submit"
                className="rounded bg-aiesec-blue px-6 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                disabled={saving || uploading}
              >
                {uploading ? 'Uploading...' : saving ? 'Saving...' : editingId ? 'Update item' : 'Add item'}
              </button>
              {editingId ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded border border-gray-300 px-6 py-2 transition hover:bg-gray-50"
                  disabled={saving}
                >
                  Cancel
                </button>
              ) : null}
            </div>
          </div>
        </form>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow">
        <h3 className="border-b bg-gray-50 p-6 text-xl font-bold text-gray-900">All items</h3>
        {loading ? (
          <div className="p-6 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-aiesec-blue border-t-transparent" />
            <p className="mt-2 text-gray-600">Loading items...</p>
          </div>
        ) : items.length === 0 ? (
          <p className="p-6 text-center text-gray-600">No items yet. Add your first item above.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px]">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Image</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Category</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Description</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Price</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Stock</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Visibility</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Spotlight</th>
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
                          className="h-16 w-16 rounded border border-gray-200 object-cover"
                        />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded bg-gray-100 text-2xl">
                          Package
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-3 font-medium text-gray-900">{item.name}</td>
                    <td className="px-6 py-3">
                      <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800">
                        {item.category}
                      </span>
                    </td>
                    <td className="max-w-xs truncate px-6 py-3 text-sm text-gray-600">
                      {item.description || '-'}
                    </td>
                    <td className="px-6 py-3 text-gray-900">{formatCurrency(item.price)}</td>
                    <td className="px-6 py-3">
                      <span className={item.stock === 0 ? 'font-semibold text-red-600' : 'text-gray-700'}>
                        {item.stock}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${
                          item.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {item.active ? 'Active' : 'Hidden'}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      {item.is_spotlight ? (
                        <span className="inline-block rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-900">
                          Spotlight
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleEdit(item)}
                          className="font-medium text-blue-600 hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setSpotlightItem(item.is_spotlight ? '' : item.id)}
                          className="font-medium text-amber-700 hover:underline"
                          disabled={legacySchemaMode || spotlightSaving}
                        >
                          {item.is_spotlight ? 'Clear spotlight' : 'Set spotlight'}
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="font-medium text-red-600 hover:underline"
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
