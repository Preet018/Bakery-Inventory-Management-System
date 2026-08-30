import React, { useEffect, useState, useCallback } from 'react';
import { productService } from '../../services/productService';
import { categoryService } from '../../services/categoryService';
import { ProductCard } from '../../components/products/ProductCard';
import { Search, RefreshCw, Filter, AlertCircle, ShoppingBag } from 'lucide-react';

/**
 * ProductsPage (Bakery Catalog)
 *
 * Full customer-facing bakery catalog page.
 * Loads real products and categories from backend REST APIs.
 * Supports:
 *   - Live search by product name & description
 *   - Category filtering
 *   - Loading, loaded, empty, and API error/retry states
 *   - Filters for active/available products only
 */
export const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Encapsulated fetch function with error handling & retry capability
  const loadCatalog = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch products and categories concurrently
      const [prodList, catList] = await Promise.all([
        productService.getAllProducts(),
        categoryService.getAllCategories(),
      ]);

      const categoriesData = catList || [];
      const categoryMap = {};
      categoriesData.forEach((c) => {
        categoryMap[c.id] = c.name;
      });

      // Filter out inactive products and enrich each product with its categoryName
      const activeProducts = (prodList || [])
        .filter((p) => p.isActive !== false)
        .map((p) => ({
          ...p,
          categoryName: categoryMap[p.categoryId] || 'Artisan BaeCurry',
        }));

      setProducts(activeProducts);
      setCategories(categoriesData);
    } catch (err) {
      console.error('Error fetching catalog:', err);
      setError(
        err.response?.data?.message ||
        err.response?.data ||
        'Unable to load the bakery catalog. Please check your connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  // Filter products by selected category and search term
  const filteredProducts = products.filter((p) => {
    const matchesCategory =
      selectedCategory === 'ALL' || String(p.categoryId) === String(selectedCategory);
    if (!matchesCategory) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const rawId = q.replace(/^#\s*/, '');
      const idMatch =
        String(p.id || '') === rawId ||
        `#${p.id}`.toLowerCase().includes(q) ||
        (rawId && String(p.id || '').includes(rawId));
      const nameMatch = (p.name || '').toLowerCase().includes(q);
      const descMatch = (p.description || '').toLowerCase().includes(q);
      return idMatch || nameMatch || descMatch;
    }

    return true;
  });

  return (
    <div className="products-page page-container">
      <div className="page-header">
        <h1>Bakery Catalog</h1>
        <p>Explore our freshly baked artisan breads, cakes, cookies, and pastries</p>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="catalog-toolbar card">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search sourdough, chocolate cake, croissants..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-field"
            id="public-catalog-search-input"
            aria-label="Search bakery items"
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
          />
        </div>

        <div className="category-select-wrapper">
          <Filter size={18} className="filter-icon" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="category-dropdown"
            aria-label="Filter by category"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ========================================================
          CATALOG CONTENT STATES (Loading / Error / Empty / Grid)
          ======================================================== */}

      {/* 1. Loading State */}
      {loading && (
        <div className="loading-state">
          <RefreshCw className="spinner" size={32} />
          <p>Loading fresh bakery catalog...</p>
        </div>
      )}

      {/* 2. Error State with Retry Button */}
      {!loading && error && (
        <div className="empty-state card">
          <AlertCircle size={48} className="text-danger" />
          <h3>Failed to Load Catalog</h3>
          <p>{error}</p>
          <button onClick={loadCatalog} className="btn-primary">
            <RefreshCw size={16} /> Try Again
          </button>
        </div>
      )}

      {/* 3. Empty Catalog from Backend */}
      {!loading && !error && products.length === 0 && (
        <div className="empty-state card">
          <ShoppingBag size={48} />
          <h3>No Bakery Items Available</h3>
          <p>We are currently restocking our bakery. Please check back shortly!</p>
          <button onClick={loadCatalog} className="btn-secondary">
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      )}

      {/* 4. Empty Filter Results */}
      {!loading && !error && products.length > 0 && filteredProducts.length === 0 && (
        <div className="empty-state card">
          <h3>No matching bakery items found</h3>
          <p>Try searching for a different item or clear your search filters.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('ALL');
            }}
            className="btn-secondary"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* 5. Products Loaded Grid */}
      {!loading && !error && filteredProducts.length > 0 && (
        <div className="product-grid">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};
