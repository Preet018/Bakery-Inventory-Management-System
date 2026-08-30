import React, { useEffect, useState, useMemo } from 'react';
import { productService } from '../../services/productService';
import { categoryService } from '../../services/categoryService';
import { supplierService } from '../../services/supplierService';
import { BackOfficeHeaderBadge } from '../../components/common/BackOfficeHeaderBadge';
import { CustomSelect } from '../../components/common/CustomSelect';
import {
  Package,
  Plus,
  RefreshCw,
  Search,
  X,
  Edit2,
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  AlertTriangle,
  Upload,
  Trash2,
  Layers,
  Truck,
  Tag,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

/**
 * ProductManagementPage Component
 * Issue #19: Admin Product Management
 *
 * Dedicated back-office catalog management page for ADMIN users.
 * Provides:
 * 1. Product listing (Active and Inactive products)
 * 2. 3 KPI cards (Total Products, Active Products, Inactive Products)
 * 3. Search (by ID, Name, Category, Supplier) and filtering (Status, Category)
 * 4. Create product with multipart image upload
 * 5. Edit product metadata (Name, Description, Price, Category, Supplier)
 * 6. Product lifecycle activation / deactivation with confirmation
 * 7. Product gallery image management (add images, remove image with validation)
 */
const AdminProductCard = ({
  product,
  categoriesMap,
  suppliersMap,
  handleOpenEditModal,
  handleOpenImagesModal,
  setStatusActionProduct,
}) => {
  const images = product.images || [];
  const imageCount = images.length;
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Safe current image
  const currentImage = images[activeImageIndex] || images[0];

  const handlePrevImage = (e) => {
    e.stopPropagation();
    setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : imageCount - 1));
  };

  const handleNextImage = (e) => {
    e.stopPropagation();
    setActiveImageIndex((prev) => (prev < imageCount - 1 ? prev + 1 : 0));
  };

  const categoryName = categoriesMap[product.categoryId] || '—';
  const supplierName = suppliersMap[product.supplierId] || '—';

  return (
    <div
      className={`product-directory-card card ${!product.isActive ? 'product-card-inactive' : ''}`}
    >
      {/* Left Section: Product Image Area */}
      <div className="product-card-media">
        {currentImage ? (
          <img
            key={currentImage.id || currentImage.imagePath || activeImageIndex}
            src={productService.getImageUrl(currentImage.imagePath)}
            alt={product.name}
            className="product-card-img"
            onError={(e) => {
              e.target.style.display = 'none';
              if (e.target.nextSibling) {
                e.target.nextSibling.style.display = 'flex';
              }
            }}
          />
        ) : null}
        <div
          className="product-card-img-fallback"
          style={{ display: currentImage ? 'none' : 'flex' }}
        >
          <Package size={36} />
          <span>No Image</span>
        </div>

        {/* Previous & Next Navigation Arrows (only if multiple images exist) */}
        {imageCount > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrevImage}
              className="gallery-nav-btn prev-btn"
              style={{ width: '28px', height: '28px', left: '6px' }}
              aria-label="Previous image"
              title="Previous image"
            >
              <ChevronLeft size={16} />
            </button>

            <button
              type="button"
              onClick={handleNextImage}
              className="gallery-nav-btn next-btn"
              style={{ width: '28px', height: '28px', right: '6px' }}
              aria-label="Next image"
              title="Next image"
            >
              <ChevronRight size={16} />
            </button>
          </>
        )}

        {/* Image Edit/Manage Button in top-right corner of image */}
        <button
          type="button"
          onClick={() => handleOpenImagesModal(product)}
          className="product-img-manage-btn"
          title={`Manage Images (${imageCount})`}
          aria-label="Manage product images"
        >
          <ImageIcon size={13} />
          <span>{imageCount > 1 ? `${activeImageIndex + 1}/${imageCount}` : imageCount}</span>
        </button>
      </div>

      {/* Right Section: Product Details */}
      <div className="product-card-content">
        {/* Header Row: Title, ID, and Status Badge */}
        <div className="product-card-header">
          <div className="product-title-group">
            <span className="product-card-id">#{product.id}</span>
            <h3 className="product-card-title">{product.name}</h3>
          </div>

          {product.isActive ? (
            <span className="status-badge badge-delivered">
              <CheckCircle2 size={12} /> Active
            </span>
          ) : (
            <span className="status-badge badge-cancelled">
              <Clock size={12} /> Inactive
            </span>
          )}
        </div>

        {/* Metadata Badges: Category, Supplier, Price */}
        <div className="product-meta-row">
          <div className="product-meta-item">
            <Layers size={14} className="meta-icon" />
            <span className="meta-label">Category:</span>
            <span className="meta-value">{categoryName}</span>
          </div>

          <div className="product-meta-item">
            <Truck size={14} className="meta-icon" />
            <span className="meta-label">Supplier:</span>
            <span className="meta-value">{supplierName}</span>
          </div>

          <div className="product-meta-item product-meta-price">
            <span className="meta-label">Price:</span>
            <span className="price-tag">${Number(product.price || 0).toFixed(2)}</span>
          </div>
        </div>

        {/* Description */}
        <div className="product-card-description">
          {product.description ? (
            <p>{product.description}</p>
          ) : (
            <p className="no-description-text">No description provided for this product.</p>
          )}
        </div>

        {/* Bottom Action Buttons */}
        <div className="product-card-actions">
          <button
            onClick={() => handleOpenEditModal(product)}
            className="btn-secondary btn-sm edit-action-btn"
            title="Edit Product Details"
          >
            <Edit2 size={14} />
            <span>Edit Details</span>
          </button>

          <button
            onClick={() => setStatusActionProduct(product)}
            className={`btn-sm ${
              product.isActive ? 'btn-status-deactivate' : 'btn-status-reactivate'
            }`}
            title={
              product.isActive
                ? 'Deactivate product'
                : 'Reactivate product'
            }
          >
            {product.isActive ? (
              <>
                <XCircle size={14} />
                <span>Deactivate</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={14} />
                <span>Reactivate</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export const ProductManagementPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [pageError, setPageError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'INACTIVE'
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImagesModal, setShowImagesModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Status toggle confirmation modal
  const [statusActionProduct, setStatusActionProduct] = useState(null);
  const [statusToggling, setStatusToggling] = useState(false);

  // Create / Edit form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    categoryId: '',
    supplierId: '',
  });
  const [createImages, setCreateImages] = useState([]);
  const [createImagePreviews, setCreateImagePreviews] = useState([]);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);

  // Image upload in Image Management modal
  const [newImages, setNewImages] = useState([]);
  const [newImagePreviews, setNewImagePreviews] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [imageActionError, setImageActionError] = useState(null);
  const [imageToDelete, setImageToDelete] = useState(null);
  const [deletingImage, setDeletingImage] = useState(false);

  // Maps for fast category/supplier name lookup
  const categoriesMap = useMemo(() => {
    const map = {};
    categories.forEach((c) => {
      map[c.id] = c.name;
    });
    return map;
  }, [categories]);

  const suppliersMap = useMemo(() => {
    const map = {};
    suppliers.forEach((s) => {
      map[s.id] = s.name;
    });
    return map;
  }, [suppliers]);

  // Fetch all initial data
  const fetchData = async (isManual = false) => {
    try {
      if (isManual) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setPageError(null);

      const [productsData, categoriesData, suppliersData] = await Promise.all([
        productService.getAllProducts(),
        categoryService.getAllCategories().catch(() => []),
        supplierService.getAllSuppliers().catch(() => []),
      ]);

      setProducts(Array.isArray(productsData) ? productsData : []);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      setSuppliers(Array.isArray(suppliersData) ? suppliersData : []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to load product management data:', err);
      setPageError(
        err.response?.data?.message ||
          err.response?.data ||
          'Failed to load products. Please check server connection.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Auto-dismiss success message
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  // Client-side filtering
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // 1. Status Filter
      if (statusFilter === 'ACTIVE' && !product.isActive) return false;
      if (statusFilter === 'INACTIVE' && product.isActive) return false;

      // 2. Category Filter
      if (categoryFilter !== 'ALL' && String(product.categoryId) !== String(categoryFilter)) {
        return false;
      }

      // 3. Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const idMatch =
          String(product.id) === q.replace(/^#\s*/, '') ||
          `#${product.id}`.toLowerCase().includes(q);
        const nameMatch = product.name?.toLowerCase().includes(q);
        const categoryName = categoriesMap[product.categoryId] || '';
        const categoryMatch = categoryName.toLowerCase().includes(q);
        const supplierName = suppliersMap[product.supplierId] || '';
        const supplierMatch = supplierName.toLowerCase().includes(q);

        return idMatch || nameMatch || categoryMatch || supplierMatch;
      }

      return true;
    });
  }, [products, statusFilter, categoryFilter, searchQuery, categoriesMap, suppliersMap]);

  // KPI Calculations
  const totalCount = products.length;
  const activeCount = products.filter((p) => p.isActive).length;
  const inactiveCount = products.filter((p) => !p.isActive).length;

  const hasActiveFilters =
    searchQuery.trim() !== '' || statusFilter !== 'ALL' || categoryFilter !== 'ALL';

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setCategoryFilter('ALL');
  };

  // ==========================================
  // CREATE PRODUCT HANDLERS
  // ==========================================
  const handleOpenCreateModal = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      categoryId: categories.length > 0 ? String(categories[0].id) : '',
      supplierId: suppliers.length > 0 ? String(suppliers[0].id) : '',
    });
    setCreateImages([]);
    setCreateImagePreviews([]);
    setFormErrors({});
    setModalError(null);
    setShowCreateModal(true);
  };

  const handleCreateImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setCreateImages((prev) => [...prev, ...files]);

    // Create object URLs for preview
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setCreateImagePreviews((prev) => [...prev, ...newPreviews]);
  };

  const handleRemoveCreateImage = (index) => {
    setCreateImages((prev) => prev.filter((_, i) => i !== index));
    setCreateImagePreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const validateForm = (isCreate = true) => {
    const errors = {};
    if (!formData.name?.trim()) {
      errors.name = 'Product name is required';
    } else if (formData.name.trim().length > 150) {
      errors.name = 'Product name must not exceed 150 characters';
    }

    if (formData.description && formData.description.length > 2000) {
      errors.description = 'Description must not exceed 2000 characters';
    }

    if (!formData.price || isNaN(formData.price) || Number(formData.price) <= 0) {
      errors.price = 'Price must be greater than zero';
    }

    if (!formData.categoryId) {
      errors.categoryId = 'Please select a category';
    }

    if (!formData.supplierId) {
      errors.supplierId = 'Please select a supplier';
    }

    if (isCreate && createImages.length === 0) {
      errors.images = 'At least one product image is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm(true)) return;

    setSubmitting(true);
    setModalError(null);

    try {
      const productPayload = {
        name: formData.name.trim(),
        description: formData.description?.trim() || null,
        price: parseFloat(formData.price),
        categoryId: parseInt(formData.categoryId, 10),
        supplierId: parseInt(formData.supplierId, 10),
      };

      const created = await productService.createProduct(productPayload, createImages);
      setProducts((prev) => [created, ...prev]);
      setSuccessMsg(`Product "${created.name}" created successfully.`);
      setLastUpdated(new Date());
      setShowCreateModal(false);
    } catch (err) {
      console.error('Create product failed:', err);
      setModalError(
        err.response?.data?.message ||
          err.response?.data ||
          'Failed to create product. Please verify inputs.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // EDIT PRODUCT HANDLERS
  // ==========================================
  const handleOpenEditModal = (product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name || '',
      description: product.description || '',
      price: product.price ? String(product.price) : '',
      categoryId: product.categoryId ? String(product.categoryId) : '',
      supplierId: product.supplierId ? String(product.supplierId) : '',
    });
    setFormErrors({});
    setModalError(null);
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm(false)) return;

    setSubmitting(true);
    setModalError(null);

    try {
      const productPayload = {
        name: formData.name.trim(),
        description: formData.description?.trim() || null,
        price: parseFloat(formData.price),
        categoryId: parseInt(formData.categoryId, 10),
        supplierId: parseInt(formData.supplierId, 10),
      };

      const updated = await productService.updateProduct(selectedProduct.id, productPayload);
      setProducts((prev) =>
        prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p))
      );
      setSuccessMsg(`Product "${updated.name}" updated successfully.`);
      setLastUpdated(new Date());
      setShowEditModal(false);
    } catch (err) {
      console.error('Update product failed:', err);
      setModalError(
        err.response?.data?.message ||
          err.response?.data ||
          'Failed to update product. Please check form values.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // ACTIVATION / DEACTIVATION HANDLERS
  // ==========================================
  const handleConfirmStatusToggle = async () => {
    if (!statusActionProduct) return;

    setStatusToggling(true);
    try {
      let updated;
      if (statusActionProduct.isActive) {
        updated = await productService.deactivateProduct(statusActionProduct.id);
        setSuccessMsg(`Product "${statusActionProduct.name}" deactivated.`);
      } else {
        updated = await productService.activateProduct(statusActionProduct.id);
        setSuccessMsg(`Product "${statusActionProduct.name}" activated.`);
      }

      setProducts((prev) =>
        prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p))
      );
      setLastUpdated(new Date());
      setStatusActionProduct(null);
    } catch (err) {
      console.error('Failed to change product status:', err);
      alert(
        err.response?.data?.message ||
          err.response?.data ||
          'Failed to update product status.'
      );
    } finally {
      setStatusToggling(false);
    }
  };

  // ==========================================
  // IMAGE MANAGEMENT HANDLERS
  // ==========================================
  const handleOpenImagesModal = (product) => {
    setSelectedProduct(product);
    setNewImages([]);
    setNewImagePreviews([]);
    setImageActionError(null);
    setShowImagesModal(true);
  };

  const handleNewImagesSelected = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setNewImages((prev) => [...prev, ...files]);
    const previews = files.map((file) => URL.createObjectURL(file));
    setNewImagePreviews((prev) => [...prev, ...previews]);
  };

  const handleRemoveNewImagePreview = (index) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
    setNewImagePreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleUploadAdditionalImages = async () => {
    if (newImages.length === 0 || !selectedProduct) return;

    setUploadingImages(true);
    setImageActionError(null);

    try {
      const uploadedImageResponses = await productService.addProductImages(
        selectedProduct.id,
        newImages
      );

      // Update product in list and selected state
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id === selectedProduct.id) {
            const currentImages = p.images || [];
            return { ...p, images: [...currentImages, ...uploadedImageResponses] };
          }
          return p;
        })
      );

      setSelectedProduct((prev) => ({
        ...prev,
        images: [...(prev.images || []), ...uploadedImageResponses],
      }));

      setNewImages([]);
      setNewImagePreviews([]);
      setSuccessMsg('Product images added successfully.');
    } catch (err) {
      console.error('Failed to upload images:', err);
      setImageActionError(
        err.response?.data?.message ||
          err.response?.data ||
          'Failed to upload images. Note: images can only be uploaded for active products.'
      );
    } finally {
      setUploadingImages(false);
    }
  };

  const handleConfirmDeleteImage = async () => {
    if (!imageToDelete || !selectedProduct) return;

    setDeletingImage(true);
    setImageActionError(null);

    try {
      await productService.removeProductImage(selectedProduct.id, imageToDelete.id);

      // Update product in list and selected state
      const updatedImages = (selectedProduct.images || []).filter(
        (img) => img.id !== imageToDelete.id
      );

      setProducts((prev) =>
        prev.map((p) => (p.id === selectedProduct.id ? { ...p, images: updatedImages } : p))
      );

      setSelectedProduct((prev) => ({
        ...prev,
        images: updatedImages,
      }));

      setImageToDelete(null);
      setSuccessMsg('Product image removed.');
    } catch (err) {
      console.error('Failed to remove image:', err);
      setImageActionError(
        err.response?.data?.message ||
          err.response?.data ||
          'Failed to remove image. A product must retain at least one image.'
      );
      setImageToDelete(null);
    } finally {
      setDeletingImage(false);
    }
  };

  return (
    <div className="product-management-page page-container">
      {/* Page Header */}
      <div className="dashboard-header-container">
        <div className="dashboard-title-area">
          <BackOfficeHeaderBadge lastUpdated={lastUpdated} />
          <h1>Product Management</h1>
          <p className="dashboard-subtitle">
            Manage bakery catalog products, pricing, categories, suppliers, availability status, and gallery images
          </p>
        </div>

        <div className="dashboard-header-actions">
          <button
            onClick={() => fetchData(true)}
            className="btn-secondary refresh-btn"
            disabled={refreshing || loading}
            title="Refresh Products"
          >
            <RefreshCw size={16} className={refreshing ? 'spinner' : ''} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="btn-primary create-product-btn"
            id="create-product-btn"
          >
            <Plus size={18} />
            <span>Create Product</span>
          </button>
        </div>
      </div>

      {/* Global Success / Error Banners */}
      {successMsg && (
        <div className="alert alert-success mt-2 mb-3">
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
          <button className="alert-close-btn" onClick={() => setSuccessMsg(null)}>
            <X size={16} />
          </button>
        </div>
      )}

      {pageError && (
        <div className="alert alert-danger mt-2 mb-3">
          <AlertCircle size={18} />
          <span>{pageError}</span>
          <button className="alert-close-btn" onClick={() => setPageError(null)}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* 3 KPI Summary Cards */}
      <div className="metrics-grid admin-staff-metrics-grid mb-6">
        {/* Total Products */}
        <div
          className={`metric-card card ${statusFilter === 'ALL' ? 'active-metric metric-card-all' : ''}`}
          onClick={() => setStatusFilter('ALL')}
          role="button"
          tabIndex={0}
        >
          <div className="metric-icon-wrapper icon-blue">
            <Package size={24} />
          </div>
          <div className="metric-info">
            <div className="metric-value">{loading ? '...' : totalCount}</div>
            <div className="metric-label">Total Products</div>
            <div className="metric-subtext">All registered catalog items</div>
          </div>
        </div>

        {/* Active Products */}
        <div
          className={`metric-card card ${statusFilter === 'ACTIVE' ? 'active-metric metric-card-optimal' : ''}`}
          onClick={() => setStatusFilter(statusFilter === 'ACTIVE' ? 'ALL' : 'ACTIVE')}
          role="button"
          tabIndex={0}
        >
          <div className="metric-icon-wrapper icon-green">
            <CheckCircle2 size={24} />
          </div>
          <div className="metric-info">
            <div className="metric-value">{loading ? '...' : activeCount}</div>
            <div className="metric-label">Active Products</div>
            <div className="metric-subtext">Live on public storefront</div>
          </div>
        </div>

        {/* Inactive Products */}
        <div
          className={`metric-card card ${statusFilter === 'INACTIVE' ? 'active-metric metric-card-out' : ''}`}
          onClick={() => setStatusFilter(statusFilter === 'INACTIVE' ? 'ALL' : 'INACTIVE')}
          role="button"
          tabIndex={0}
        >
          <div className="metric-icon-wrapper icon-red">
            <XCircle size={24} />
          </div>
          <div className="metric-info">
            <div className="metric-value">{loading ? '...' : inactiveCount}</div>
            <div className="metric-label">Inactive Products</div>
            <div className="metric-subtext">Hidden from customer catalog</div>
          </div>
        </div>
      </div>

      {/* Search and Filters Toolbar */}
      <div className="inventory-toolbar card mb-6">
        <div className="toolbar-search-wrapper" style={{ flex: 1 }}>
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search by Product ID (#1), name, category, or supplier..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-field"
            id="product-search-input"
            aria-label="Search products"
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="clear-search-btn"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Product Results Count Strip */}
      {!loading && products.length > 0 && (
        <div className="table-header-strip mb-4" style={{ borderRadius: 'var(--radius-sm, 8px)', border: '1px solid var(--color-border, #E5E7EB)' }}>
          <span className="table-count-label">
            Showing&nbsp;<strong>{filteredProducts.length}</strong>&nbsp;of&nbsp;<strong>{products.length}</strong>&nbsp;products
          </span>
        </div>
      )}

      {/* Product Cards Listing (Directory Layout) */}
      <div className="product-cards-container">
        {loading ? (
          <div className="card table-loading-state">
            <RefreshCw size={28} className="spinner text-primary" />
            <p>Loading bakery products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="card empty-table-state">
            <div className="empty-icon-circle">
              <Package size={36} />
            </div>
            <h3>No Products Found</h3>
            <p>Your bakery product catalog is currently empty. Add your first product to get started.</p>
            <button onClick={handleOpenCreateModal} className="btn-primary mt-3">
              <Plus size={16} />
              <span>Create First Product</span>
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="card empty-table-state">
            <div className="empty-icon-circle">
              <Search size={36} />
            </div>
            <h3>No Matching Products</h3>
            <p>No products match your search query or filter selection.</p>
            <button onClick={handleClearFilters} className="btn-secondary mt-3">
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="product-cards-list">
            {filteredProducts.map((product) => (
              <AdminProductCard
                key={product.id}
                product={product}
                categoriesMap={categoriesMap}
                suppliersMap={suppliersMap}
                handleOpenEditModal={handleOpenEditModal}
                handleOpenImagesModal={handleOpenImagesModal}
                setStatusActionProduct={setStatusActionProduct}
              />
            ))}
          </div>
        )}
      </div>

      {/* ==========================================
          CREATE PRODUCT MODAL
          ========================================== */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => !submitting && setShowCreateModal(false)}>
          <div
            className="modal-container card backoffice-modal product-form-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-header-icon-title">
                <div className="header-icon-box icon-amber">
                  <Tag size={20} className="text-primary" />
                </div>
                <div>
                  <h3>Create New Product</h3>
                  <div className="modal-subtitle">
                    Add a new product to the bakery catalog with pricing, category, and images
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowCreateModal(false)}
                disabled={submitting}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="modal-form">
              <div className="modal-body-content">
                {modalError && (
                  <div className="error-alert mb-3">
                    <AlertCircle size={16} />
                    <span>{modalError}</span>
                  </div>
                )}

                {/* Product Name */}
                <div className="form-group mb-3">
                  <label className="form-label" htmlFor="create-product-name">
                    Product Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    id="create-product-name"
                    className={`form-input ${formErrors.name ? 'input-error' : ''}`}
                    placeholder="e.g. Sourdough Loaf"
                    maxLength={150}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                  {formErrors.name && (
                    <span className="field-error-text">{formErrors.name}</span>
                  )}
                </div>

                {/* 2-Column Grid: Price, Category */}
                <div className="modal-form-grid-2">
                  {/* Price */}
                  <div className="form-group mb-3">
                    <label className="form-label" htmlFor="create-product-price">
                      Price ($) <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      id="create-product-price"
                      step="0.01"
                      min="0.01"
                      className={`form-input ${formErrors.price ? 'input-error' : ''}`}
                      placeholder="0.00"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    />
                    {formErrors.price && (
                      <span className="field-error-text">{formErrors.price}</span>
                    )}
                  </div>

                  {/* Category */}
                  <div className="form-group mb-3">
                    <label className="form-label" htmlFor="create-product-category">
                      Category <span className="text-danger">*</span>
                    </label>
                    <select
                      id="create-product-category"
                      className={`form-input ${formErrors.categoryId ? 'input-error' : ''}`}
                      value={formData.categoryId}
                      onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    >
                      <option value="">Select Category</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    {formErrors.categoryId && (
                      <span className="field-error-text">{formErrors.categoryId}</span>
                    )}
                  </div>
                </div>

                {/* Supplier */}
                <div className="form-group mb-3">
                  <label className="form-label" htmlFor="create-product-supplier">
                    Supplier <span className="text-danger">*</span>
                  </label>
                  <select
                    id="create-product-supplier"
                    className={`form-input ${formErrors.supplierId ? 'input-error' : ''}`}
                    value={formData.supplierId}
                    onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} {!s.isActive ? '(Inactive)' : ''}
                      </option>
                    ))}
                  </select>
                  {formErrors.supplierId && (
                    <span className="field-error-text">{formErrors.supplierId}</span>
                  )}
                </div>

                {/* Description */}
                <div className="form-group mb-3">
                  <label className="form-label" htmlFor="create-product-desc">
                    Description <span className="text-muted">(Optional, max 2000 chars)</span>
                  </label>
                  <textarea
                    id="create-product-desc"
                    rows={3}
                    className={`form-input ${formErrors.description ? 'input-error' : ''}`}
                    placeholder="Artisan loaf made with 24-hour slow fermentation..."
                    maxLength={2000}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                  {formErrors.description && (
                    <span className="field-error-text">{formErrors.description}</span>
                  )}
                </div>

                {/* Product Images Upload */}
                <div className="form-group mb-2">
                  <label className="form-label">
                    Product Images <span className="text-danger">* (At least 1 required)</span>
                  </label>
                  <div className="image-upload-dropzone">
                    <input
                      type="file"
                      id="create-images-input"
                      multiple
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      onChange={handleCreateImageChange}
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="create-images-input" className="upload-dropzone-label">
                      <Upload size={24} className="text-primary mb-1" />
                      <span>Click to upload product image(s)</span>
                      <small className="text-muted">PNG, JPG, WEBP formats supported</small>
                    </label>
                  </div>
                  {formErrors.images && (
                    <span className="field-error-text">{formErrors.images}</span>
                  )}

                  {/* Previews */}
                  {createImagePreviews.length > 0 && (
                    <div className="image-previews-grid mt-2">
                      {createImagePreviews.map((previewUrl, idx) => (
                        <div key={idx} className="image-preview-thumb">
                          <img src={previewUrl} alt={`Preview ${idx + 1}`} />
                          <button
                            type="button"
                            onClick={() => handleRemoveCreateImage(idx)}
                            className="preview-remove-btn"
                            title="Remove image"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-actions flex-end gap-2 mt-4 pt-3 border-top">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <RefreshCw size={16} className="spinner" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      <span>Create Product</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          EDIT PRODUCT MODAL
          ========================================== */}
      {showEditModal && selectedProduct && (
        <div className="modal-overlay" onClick={() => !submitting && setShowEditModal(false)}>
          <div
            className="modal-container card backoffice-modal product-form-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-header-icon-title">
                <div className="header-icon-box icon-amber">
                  <Edit2 size={20} className="text-primary" />
                </div>
                <div>
                  <h3>Edit Product #{selectedProduct.id}</h3>
                  <div className="modal-subtitle">
                    Update catalog details, pricing, category, and supplier
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowEditModal(false)}
                disabled={submitting}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="modal-form">
              <div className="modal-body-content">
                {modalError && (
                  <div className="error-alert mb-3">
                    <AlertCircle size={16} />
                    <span>{modalError}</span>
                  </div>
                )}

                {/* Product Name */}
                <div className="form-group mb-3">
                  <label className="form-label" htmlFor="edit-product-name">
                    Product Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    id="edit-product-name"
                    className={`form-input ${formErrors.name ? 'input-error' : ''}`}
                    maxLength={150}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                  {formErrors.name && (
                    <span className="field-error-text">{formErrors.name}</span>
                  )}
                </div>

                {/* 2-Column Grid: Price, Category */}
                <div className="modal-form-grid-2">
                  {/* Price */}
                  <div className="form-group mb-3">
                    <label className="form-label" htmlFor="edit-product-price">
                      Price ($) <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      id="edit-product-price"
                      step="0.01"
                      min="0.01"
                      className={`form-input ${formErrors.price ? 'input-error' : ''}`}
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    />
                    {formErrors.price && (
                      <span className="field-error-text">{formErrors.price}</span>
                    )}
                  </div>

                  {/* Category */}
                  <div className="form-group mb-3">
                    <label className="form-label" htmlFor="edit-product-category">
                      Category <span className="text-danger">*</span>
                    </label>
                    <select
                      id="edit-product-category"
                      className={`form-input ${formErrors.categoryId ? 'input-error' : ''}`}
                      value={formData.categoryId}
                      onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    >
                      <option value="">Select Category</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    {formErrors.categoryId && (
                      <span className="field-error-text">{formErrors.categoryId}</span>
                    )}
                  </div>
                </div>

                {/* Supplier */}
                <div className="form-group mb-3">
                  <label className="form-label" htmlFor="edit-product-supplier">
                    Supplier <span className="text-danger">*</span>
                  </label>
                  <select
                    id="edit-product-supplier"
                    className={`form-input ${formErrors.supplierId ? 'input-error' : ''}`}
                    value={formData.supplierId}
                    onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} {!s.isActive ? '(Inactive)' : ''}
                      </option>
                    ))}
                  </select>
                  {formErrors.supplierId && (
                    <span className="field-error-text">{formErrors.supplierId}</span>
                  )}
                </div>

                {/* Description */}
                <div className="form-group mb-3">
                  <label className="form-label" htmlFor="edit-product-desc">
                    Description <span className="text-muted">(Optional, max 2000 chars)</span>
                  </label>
                  <textarea
                    id="edit-product-desc"
                    rows={3}
                    className={`form-input ${formErrors.description ? 'input-error' : ''}`}
                    maxLength={2000}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                  {formErrors.description && (
                    <span className="field-error-text">{formErrors.description}</span>
                  )}
                </div>
              </div>

              <div className="modal-actions flex-end gap-2 mt-4 pt-3 border-top">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowEditModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <RefreshCw size={16} className="spinner" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          IMAGE GALLERY / MANAGE IMAGES MODAL
          ========================================== */}
      {showImagesModal && selectedProduct && (
        <div className="modal-overlay" onClick={() => setShowImagesModal(false)}>
          <div
            className="modal-container card backoffice-modal gallery-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-header-icon-title">
                <div className="header-icon-box icon-purple">
                  <ImageIcon size={20} className="text-purple" />
                </div>
                <div>
                  <h3>Manage Images — {selectedProduct.name}</h3>
                  <div className="modal-subtitle">
                    View, upload additional images, or remove existing gallery images
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowImagesModal(false)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body-content">
              {imageActionError && (
                <div className="error-alert mb-3">
                  <AlertCircle size={16} />
                  <span>{imageActionError}</span>
                </div>
              )}

              {/* Status Warning if product is inactive */}
              {!selectedProduct.isActive && (
                <div className="warning-alert mb-3">
                  <AlertTriangle size={16} />
                  <span>
                    This product is currently inactive. New images can only be uploaded to active products.
                  </span>
                </div>
              )}

              {/* Current Active Gallery Images */}
              <div className="gallery-section">
                <h4 className="gallery-section-title">
                  Current Gallery Images ({selectedProduct.images?.length || 0})
                </h4>

                {(!selectedProduct.images || selectedProduct.images.length === 0) ? (
                  <p className="text-muted">No images uploaded for this product.</p>
                ) : (
                  <div className="gallery-grid">
                    {selectedProduct.images.map((img) => (
                      <div key={img.id} className="gallery-card">
                        <img
                          src={productService.getImageUrl(img.imagePath)}
                          alt="Product"
                          className="gallery-card-img"
                        />
                        <div className="gallery-card-overlay">
                          <button
                            type="button"
                            className="btn-delete-img"
                            title={
                              selectedProduct.images.length === 1
                                ? 'Cannot delete the only image of a product'
                                : 'Delete image'
                            }
                            onClick={() => {
                              if (selectedProduct.images.length === 1) {
                                setImageActionError('Cannot delete the only remaining image of a product.');
                              } else {
                                setImageToDelete(img);
                              }
                            }}
                          >
                            <Trash2 size={14} />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Upload Additional Images Section */}
              <div className="upload-additional-section mt-4 pt-3 border-top">
                <h4 className="gallery-section-title">Add Additional Images</h4>
                <div className="image-upload-dropzone mt-2">
                  <input
                    type="file"
                    id="add-images-input"
                    multiple
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    disabled={!selectedProduct.isActive || uploadingImages}
                    onChange={handleNewImagesSelected}
                    style={{ display: 'none' }}
                  />
                  <label
                    htmlFor="add-images-input"
                    className={`upload-dropzone-label ${
                      !selectedProduct.isActive ? 'disabled-dropzone' : ''
                    }`}
                  >
                    <Upload size={22} className="text-primary mb-1" />
                    <span>Select new image(s) to add to gallery</span>
                    <small className="text-muted">PNG, JPG, WEBP supported</small>
                  </label>
                </div>

                {/* Previews for new upload queue */}
                {newImagePreviews.length > 0 && (
                  <div className="mt-3">
                    <div className="image-previews-grid mb-3">
                      {newImagePreviews.map((previewUrl, idx) => (
                        <div key={idx} className="image-preview-thumb">
                          <img src={previewUrl} alt={`New Preview ${idx + 1}`} />
                          <button
                            type="button"
                            onClick={() => handleRemoveNewImagePreview(idx)}
                            className="preview-remove-btn"
                            title="Remove preview"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={handleUploadAdditionalImages}
                      className="btn-primary"
                      disabled={uploadingImages || !selectedProduct.isActive}
                    >
                      {uploadingImages ? (
                        <>
                          <RefreshCw size={15} className="spinner" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload size={15} />
                          <span>Upload {newImages.length} Image(s)</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-actions flex-end mt-4 pt-3 border-top">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowImagesModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          DELETE IMAGE CONFIRMATION MODAL
          ========================================== */}
      {imageToDelete && (
        <div className="modal-overlay" onClick={() => !deletingImage && setImageToDelete(null)}>
          <div
            className="modal-container card confirmation-modal backoffice-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-header-icon-title">
                <div className="header-icon-box icon-red">
                  <AlertTriangle size={20} className="text-danger" />
                </div>
                <div>
                  <h3>Delete Product Image</h3>
                  <div className="modal-subtitle">
                    Permanent removal of image #{imageToDelete.id}
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setImageToDelete(null)}
                disabled={deletingImage}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>
            <div className="confirmation-modal-body py-2">
              <p>
                Are you sure you want to permanently delete image <strong>#{imageToDelete.id}</strong> from{' '}
                <strong>"{selectedProduct?.name}"</strong>?
              </p>
              <p className="text-muted text-sm mt-1">This operation cannot be undone.</p>
            </div>
            <div className="modal-actions flex-end gap-2 mt-4 pt-3 border-top">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setImageToDelete(null)}
                disabled={deletingImage}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={handleConfirmDeleteImage}
                disabled={deletingImage}
              >
                {deletingImage ? (
                  <>
                    <RefreshCw size={15} className="spinner" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={15} />
                    <span>Confirm Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          STATUS TOGGLE CONFIRMATION MODAL
          ========================================== */}
      {statusActionProduct && (
        <div
          className="modal-overlay"
          onClick={() => !statusToggling && setStatusActionProduct(null)}
        >
          <div
            className="modal-container card confirmation-modal backoffice-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-header-icon-title">
                <div
                  className={`header-icon-box ${
                    statusActionProduct.isActive ? 'icon-amber' : 'icon-green'
                  }`}
                >
                  <AlertTriangle
                    size={20}
                    className={statusActionProduct.isActive ? 'text-amber' : 'text-success'}
                  />
                </div>
                <div>
                  <h3>
                    {statusActionProduct.isActive ? 'Deactivate Product' : 'Reactivate Product'}
                  </h3>
                  <div className="modal-subtitle">
                    {statusActionProduct.isActive
                      ? 'Hide product from customer storefront'
                      : 'Restore product visibility to storefront'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setStatusActionProduct(null)}
                disabled={statusToggling}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>
            <div className="confirmation-modal-body py-2">
              {statusActionProduct.isActive ? (
                <p>
                  Are you sure you want to deactivate <strong>"{statusActionProduct.name}"</strong>?
                  Deactivated products and their gallery images will be hidden from the customer storefront catalog.
                </p>
              ) : (
                <p>
                  Are you sure you want to reactivate <strong>"{statusActionProduct.name}"</strong>?
                  This product and its active gallery images will immediately become visible to customers.
                </p>
              )}
            </div>
            <div className="modal-actions flex-end gap-2 mt-4 pt-3 border-top">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setStatusActionProduct(null)}
                disabled={statusToggling}
              >
                Cancel
              </button>
              <button
                type="button"
                className={statusActionProduct.isActive ? 'btn-danger' : 'btn-success'}
                onClick={handleConfirmStatusToggle}
                disabled={statusToggling}
              >
                {statusToggling ? (
                  <>
                    <RefreshCw size={15} className="spinner" />
                    <span>Processing...</span>
                  </>
                ) : statusActionProduct.isActive ? (
                  'Confirm Deactivation'
                ) : (
                  'Confirm Reactivation'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
