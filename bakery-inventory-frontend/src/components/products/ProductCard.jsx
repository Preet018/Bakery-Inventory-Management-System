import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { productService } from '../../services/productService';
import { ShoppingBag, Eye } from 'lucide-react';

/**
 * ProductCard Component
 *
 * Displays individual product in the bakery storefront catalog with:
 *   - Product name & description
 *   - Price formatted in INR (₹)
 *   - Category tag
 *   - Primary image with fallback
 *   - View Details overlay
 *   - Add to Cart action (restricted to customers/guests only)
 */
export const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const { isCustomer, isAuthenticated } = useAuth();
  const canPurchase = !isAuthenticated || isCustomer;

  // Default placeholder for bakery items without an uploaded image
  const defaultPlaceholder =
    'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=600';

  // Extract first active image if available
  const activeImage =
    product.images && product.images.length > 0
      ? product.images.find((img) => img.isActive !== false) || product.images[0]
      : null;

  const imageSrc = activeImage
    ? productService.getImageUrl(activeImage.imagePath)
    : defaultPlaceholder;

  return (
    <div className="product-card card">
      <div className="product-image-wrapper">
        <img
          src={imageSrc}
          alt={product.name}
          className="product-image"
          loading="lazy"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = defaultPlaceholder;
          }}
        />

        {/* CHANGE: Green "Available" badge removed per storefront requirement */}

        <div className="product-overlay">
          <Link to={`/products/${product.id}`} className="view-details-btn">
            <Eye size={18} /> View Details
          </Link>
        </div>
      </div>

      <div className="product-info">
        <span className="product-category">
          {product.categoryName || 'Artisan Bakery'}
        </span>
        <h3 className="product-title">{product.name}</h3>
        <p className="product-description">{product.description || 'Fresh artisan bakery product.'}</p>

        <div className="product-footer">
          <div className="product-price">
            ₹{Number(product.price || 0).toFixed(2)}
          </div>
          {canPurchase && (
            <button
              onClick={() => addToCart && addToCart(product, 1)}
              className="btn-add-cart"
              title="Add to Cart"
            >
              <ShoppingBag size={18} />
              <span>Add</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
