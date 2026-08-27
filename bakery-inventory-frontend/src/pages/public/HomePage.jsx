import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { productService } from '../../services/productService';
import { categoryService } from '../../services/categoryService';
import { ProductCard } from '../../components/products/ProductCard';
import { Cake, Sparkles, ArrowRight, ShieldCheck, Truck, RefreshCw } from 'lucide-react';

/**
 * HomePage
 * Landing page with hero banner, category filters, and featured bakery products.
 *
 * CHANGE:
 * - "Browse Bakery Items" smoothly scrolls to the #bakery-selection section on the same page.
 * - Shows only active products from backend.
 * - Directs authenticated customers to /account (My Account).
 */
export const HomePage = () => {
  const { isAuthenticated } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [prodRes, catRes] = await Promise.all([
          productService.getAllProducts(),
          categoryService.getAllCategories(),
        ]);

        const catList = catRes || [];
        const categoryMap = {};
        catList.forEach((c) => {
          categoryMap[c.id] = c.name;
        });

        // CHANGE: Filter out inactive products and enrich with categoryName
        const activeProducts = (prodRes || [])
          .filter((p) => p.isActive !== false)
          .map((p) => ({
            ...p,
            categoryName: categoryMap[p.categoryId] || 'Artisan Bakery',
          }));

        setProducts(activeProducts);
        setCategories(catList);
      } catch (err) {
        console.error('Failed to load homepage data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // CHANGE: Helper to smoothly scroll to #bakery-selection with fixed navbar offset compensation
  const scrollToBakerySelection = () => {
    const selectionElement = document.getElementById('bakery-selection');
    if (selectionElement) {
      const navbar = document.querySelector('.bakery-navbar');
      const navbarHeight = navbar ? navbar.offsetHeight : 75;
      const elementTop = selectionElement.getBoundingClientRect().top;
      const targetY = elementTop + window.pageYOffset - navbarHeight - 20;

      window.scrollTo({
        top: Math.max(0, targetY),
        behavior: 'smooth',
      });
    }
  };

  // CHANGE: Automatically scroll to #bakery-selection if navigated with that hash from CartPage or other views
  useEffect(() => {
    if (window.location.hash === '#bakery-selection') {
      const timer = setTimeout(() => {
        scrollToBakerySelection();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [products]);

  // CHANGE: Smooth scroll to bakery selection section on the same page
  const handleScrollToSelection = (e) => {
    e.preventDefault();
    scrollToBakerySelection();
  };

  const filteredProducts =
    selectedCategory === 'ALL'
      ? products
      : products.filter((p) => String(p.categoryId) === String(selectedCategory));

  return (
    <div className="home-page">
      {/* Hero Banner */}
      <section className="hero-banner">
        <div className="hero-content">
          <div className="hero-badge">
            <Sparkles size={16} /> Freshly Baked Every Morning
          </div>
          <h1 className="hero-title">
            Artisan Bakery & Real-Time Inventory
          </h1>
          <p className="hero-subtitle">
            Experience hand-crafted pastries, sourdough breads, and gourmet cakes made from organic ingredients, with integrated inventory and order tracking.
          </p>
          <div className="hero-buttons">
            {/* CHANGE: Smooth scroll link to #bakery-selection instead of navigating away */}
            <a
              href="#bakery-selection"
              onClick={handleScrollToSelection}
              className="btn-hero-primary"
            >
              Browse Bakery Items <ArrowRight size={18} />
            </a>

            {isAuthenticated ? (
              <Link to="/account" className="btn-hero-secondary">
                My Account
              </Link>
            ) : (
              <Link to="/login" className="btn-hero-secondary">
                Sign In
              </Link>
            )}
          </div>
        </div>
        <div className="hero-visual">
          <img
            src="https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=800"
            alt="Freshly baked artisan bread"
            className="hero-img"
          />
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="features-strip">
        <div className="feature-item">
          <Cake size={24} className="feature-icon" />
          <div>
            <h4>Fresh & Handcrafted</h4>
            <p>Made daily using premium flour and natural yeast</p>
          </div>
        </div>
        <div className="feature-item">
          <Truck size={24} className="feature-icon" />
          <div>
            {/* CHANGE: System uses online payment (UPI, Credit/Debit card); removed COD reference */}
            <h4>Fast & Reliable Delivery</h4>
            <p>Quick doorstep delivery with secure digital payments</p>
          </div>
        </div>
        <div className="feature-item">
          <ShieldCheck size={24} className="feature-icon" />
          <div>
            <h4>Real-time Inventory</h4>
            <p>Live stock checking prevents over-selling</p>
          </div>
        </div>
      </section>

      {/* Categories & Products Section */}
      {/* CHANGE: Added id="bakery-selection" for in-page smooth scrolling */}
      <section id="bakery-selection" className="catalog-section">
        <div className="section-header">
          <h2>Our Bakery Selection</h2>
          <p>Filter by category or explore all delicious treats</p>
        </div>

        {/* Category Pills */}
        <div className="category-pills">
          <button
            className={`pill-btn ${selectedCategory === 'ALL' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('ALL')}
          >
            All Items
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`pill-btn ${String(selectedCategory) === String(cat.id) ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="loading-state">
            <RefreshCw className="spinner" size={32} />
            <p>Loading fresh bakery items...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="empty-state">
            <Cake size={48} />
            <h3>No products found in this category</h3>
            <p>Try selecting a different category or view all products.</p>
          </div>
        ) : (
          <div className="product-grid">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
