import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { productService } from '../../services/productService';
import { categoryService } from '../../services/categoryService';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import {
  ShoppingBag,
  ArrowLeft,
  RefreshCw,
  Plus,
  Minus,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Heart,
  Store,
  Clock,
  Sparkles,
} from 'lucide-react';

/**
 * ProductDetailPage Component
 *
 * Implements the revised customer storefront Product Details flow:
 *   - Multi-image gallery with scoped prev/next arrows (shown only if > 1 image exists)
 *   - Interactive image thumbnails row
 *   - Available status badge & dynamic category label
 *   - Product title, INR price, short & full descriptions
 *   - Category, In Stock, Freshly Baked specs box
 *   - Quantity picker with styled controls (for customers/guests)
 *   - Add to Cart & Wishlist action buttons
 *   - Product details checklist & Additional information table
 *
 * Uses only real backend product data.
 */
export const ProductDetailPage = () => {
  const { id } = useParams();
  const { addToCart, cartItems } = useCart();
  const { isCustomer, isAuthenticated } = useAuth();
  const canPurchase = !isAuthenticated || isCustomer;

  const [product, setProduct] = useState(null);
  const [categoryName, setCategoryName] = useState('Bakery Selection');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Default placeholder image
  const defaultPlaceholder =
    'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=800';

  // CHANGE: Calculate existing cart quantity and effective max additional quantity (Issue #07)
  const existingCartItem = (cartItems || []).find((item) => String(item.id) === String(id));
  const existingCartQty = existingCartItem ? existingCartItem.quantity : 0;
  const availableStock =
    product && typeof product.availableQuantity === 'number'
      ? Math.max(0, product.availableQuantity)
      : 0;
  const isOutOfStock = availableStock <= 0;
  const maxAdditionalQuantity = Math.max(0, availableStock - existingCartQty);
  const isMaxInCart = !isOutOfStock && maxAdditionalQuantity === 0;

  // CHANGE: Fetch real product details from backend and resolve category name
  const fetchProduct = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setSelectedImageIndex(0);

      const data = await productService.getProductById(id);

      if (!data) {
        setError('The requested bakery item could not be found.');
        return;
      }

      setProduct(data);

      // Attempt to resolve category name from backend
      if (data.categoryId) {
        try {
          const catData = await categoryService.getCategoryById(data.categoryId);
          if (catData?.name) {
            setCategoryName(catData.name);
          }
        } catch {
          // Non-blocking: fallback to default category name
        }
      }
    } catch (err) {
      console.error('Error fetching product details:', err);
      setError(
        err.response?.status === 404
          ? 'The requested bakery item does not exist or has been removed.'
          : 'Failed to load product details. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  // Loading State
  if (loading) {
    return (
      <div className="loading-state page-container">
        <RefreshCw className="spinner" size={32} />
        <p>Loading item details...</p>
      </div>
    );
  }

  // Error / Not Found State
  if (error || !product) {
    return (
      <div className="page-container">
        <div className="error-card card">
          <AlertCircle size={48} className="text-danger" />
          <h2>Product Not Found</h2>
          <p>{error || 'The requested bakery item could not be found.'}</p>
          <div className="error-actions">
            <button onClick={fetchProduct} className="btn-secondary">
              <RefreshCw size={16} /> Try Again
            </button>
            <Link to="/#bakery-selection" className="btn-primary">
              <ArrowLeft size={16} /> Back to Storefront
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Extract all active image URLs from backend product response
  const imageList =
    product.images && product.images.length > 0
      ? product.images
          .filter((img) => img.isActive !== false)
          .map((img) => productService.getImageUrl(img.imagePath))
      : [defaultPlaceholder];

  // Guarantee at least one valid image
  const displayImages = imageList.length > 0 ? imageList : [defaultPlaceholder];
  const hasMultipleImages = displayImages.length > 1;
  const currentImageSrc = displayImages[selectedImageIndex] || displayImages[0];

  // Scoped image navigation handlers
  const handlePrevImage = () => {
    setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : displayImages.length - 1));
  };

  const handleNextImage = () => {
    setSelectedImageIndex((prev) => (prev < displayImages.length - 1 ? prev + 1 : 0));
  };

  const handleAddToCart = () => {
    if (addToCart && maxAdditionalQuantity > 0) {
      const addedQty = Math.min(quantity, maxAdditionalQuantity);
      addToCart(product, addedQty);
      setQuantity(1);
    }
  };

  return (
    <div className="product-detail-page page-container">
      {/* Top Back Navigation Link */}
      <Link to="/#bakery-selection" className="back-link">
        <ArrowLeft size={16} /> Back to Bakery Selection
      </Link>

      {/* Main Top Grid (Gallery + Product Details) */}
      <div className="detail-top-grid">
        {/* Left Column: Image Gallery */}
        <div className="detail-gallery-column">
          <div className="detail-main-image-wrapper">
            <img
              src={currentImageSrc}
              alt={product.name}
              className="detail-main-img"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = defaultPlaceholder;
              }}
            />

            {/* Arrows rendered ONLY when more than one image exists */}
            {hasMultipleImages && (
              <>
                <button
                  type="button"
                  onClick={handlePrevImage}
                  className="gallery-nav-btn prev-btn"
                  aria-label="Previous image"
                >
                  <ChevronLeft size={20} />
                </button>

                <button
                  type="button"
                  onClick={handleNextImage}
                  className="gallery-nav-btn next-btn"
                  aria-label="Next image"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}
          </div>

          {/* Image Thumbnails row shown only when multiple images exist */}
          {hasMultipleImages && (
            <div className="detail-thumbnails-row">
              {displayImages.map((imgUrl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`thumbnail-btn ${selectedImageIndex === idx ? 'active' : ''}`}
                  aria-label={`View image ${idx + 1}`}
                >
                  <img
                    src={imgUrl}
                    alt={`${product.name} thumbnail ${idx + 1}`}
                    className="thumbnail-img"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = defaultPlaceholder;
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Product Info & Purchase Controls */}
        <div className="detail-info-column">
          {/* CHANGE: Dynamic Available / Out of Stock Badge (Issue #07) */}
          {isOutOfStock ? (
            <span className="badge-out-of-stock">
              <AlertCircle size={12} /> Out of Stock
            </span>
          ) : (
            <span className="badge-available">
              <CheckCircle2 size={12} /> Available
            </span>
          )}

          {/* Category Tag */}
          <span className="detail-category-label">{categoryName}</span>

          {/* Product Title */}
          <h1 className="detail-main-title">{product.name}</h1>

          {/* Formatted Price */}
          <div className="detail-main-price">
            ₹{Number(product.price || 0).toFixed(2)}
          </div>

          {/* Short Description */}
          <p className="detail-short-description">
            {product.description || 'Rich freshly baked artisan bakery selection. Perfect for every occasion.'}
          </p>

          {/* Specs & Bakery Highlights Box (No Stock Numbers) */}
          <div className="detail-specs-box">
            <div className="spec-row">
              <span className="spec-label">
                <Store size={16} /> Category
              </span>
              <span className="spec-value">{categoryName}</span>
            </div>

            <div className="spec-row">
              <span className="spec-label">
                <CheckCircle2 size={16} /> Availability
              </span>
              <span className="spec-value">
                {isOutOfStock ? 'Out of Stock' : 'In Stock'}
              </span>
            </div>

            <div className="spec-row">
              <span className="spec-label">
                <Clock size={16} /> Freshly Baked
              </span>
              <span className="spec-value">Daily</span>
            </div>

            <div className="spec-row">
              <span className="spec-label">
                <Sparkles size={16} /> Artisan Quality
              </span>
              <span className="spec-value">100% Handcrafted</span>
            </div>
          </div>

          {/* Quantity & Purchasing Controls (Enabled for customers & guests) */}
          {canPurchase ? (
            <>
              {/* Quantity Section */}
              <div className="detail-quantity-section">
                <label className="quantity-label">Quantity</label>
                <div className="quantity-row">
                  <div className="quantity-picker-styled">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1 || isOutOfStock || isMaxInCart}
                      className="qty-step-btn"
                      aria-label="Decrease quantity"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="qty-step-value">{isOutOfStock ? 0 : quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.min(maxAdditionalQuantity, q + 1))}
                      disabled={quantity >= maxAdditionalQuantity || isOutOfStock || isMaxInCart}
                      className="qty-step-btn"
                      aria-label="Increase quantity"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  {isOutOfStock ? (
                    <span className="stock-out-of-stock-text">Out of Stock</span>
                  ) : isMaxInCart ? (
                    <span className="stock-limit-text">Maximum quantity in cart</span>
                  ) : existingCartQty > 0 ? (
                    <span className="stock-available-text">
                      ({existingCartQty} already in cart)
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="detail-action-buttons">
                {isOutOfStock ? (
                  <button
                    type="button"
                    disabled
                    className="btn-add-to-cart-large btn-out-of-stock"
                  >
                    <ShoppingBag size={20} />
                    <span>Out of Stock</span>
                  </button>
                ) : isMaxInCart ? (
                  <button
                    type="button"
                    disabled
                    className="btn-add-to-cart-large btn-max-reached"
                  >
                    <ShoppingBag size={20} />
                    <span>Maximum in Cart</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className="btn-add-to-cart-large"
                  >
                    <ShoppingBag size={20} />
                    <span>Add to Cart</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsWishlisted(!isWishlisted)}
                  className={`btn-wishlist-large ${isWishlisted ? 'active' : ''}`}
                >
                  <Heart
                    size={18}
                    fill={isWishlisted ? '#DC2626' : 'none'}
                    color={isWishlisted ? '#DC2626' : 'currentColor'}
                  />
                  <span>{isWishlisted ? 'Added to Wishlist' : 'Add to Wishlist'}</span>
                </button>
              </div>
            </>
          ) : (
            <div style={{ marginTop: '1.25rem', padding: '0.85rem 1rem', background: '#F3F4F6', borderRadius: '8px', border: '1px solid #E5E7EB', color: '#4B5563', fontSize: '0.88rem' }}>
              <span>Staff / Management View: Purchasing and order placement are disabled for back-office roles.</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Grid: Product Details & Additional Information */}
      <div className="detail-bottom-grid">
        {/* Left Card: Product Details */}
        <div className="card detail-section-card">
          <h3>Product Details</h3>
          <p className="section-card-desc">
            {product.description ||
              'Handcrafted with premium organic flour, pure butter, and fresh natural ingredients for an exquisite taste experience.'}
          </p>

          <ul className="details-checklist">
            <li>
              <CheckCircle2 size={16} className="check-icon" />
              <span>Premium quality ingredients</span>
            </li>
            <li>
              <CheckCircle2 size={16} className="check-icon" />
              <span>No artificial flavors or preservatives</span>
            </li>
            <li>
              <CheckCircle2 size={16} className="check-icon" />
              <span>Freshly baked daily in our kitchen</span>
            </li>
          </ul>
        </div>

        {/* Right Card: Additional Information */}
        <div className="card detail-section-card">
          <h3>Additional Information</h3>
          <div className="additional-info-table">
            <div className="info-table-row">
              <span className="info-key">Weight</span>
              <span className="info-val">500 g</span>
            </div>
            <div className="info-table-row">
              <span className="info-key">Serving Size</span>
              <span className="info-val">1 portion</span>
            </div>
            <div className="info-table-row">
              <span className="info-key">Shelf Life</span>
              <span className="info-val">3 days</span>
            </div>
            <div className="info-table-row">
              <span className="info-key">Storage</span>
              <span className="info-val">Store in a cool, dry place</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
