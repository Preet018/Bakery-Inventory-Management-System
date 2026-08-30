import React from 'react';
import artisanBakeryLogoImg from '../../assets/artisan-baecurry.png';

/**
 * Footer Component
 * Standardized across all customer, backoffice, and public pages
 */
export const Footer = () => {
  return (
    <footer className="bakery-footer">
      <div className="footer-container">
        <div className="footer-brand">
          <div className="footer-logo">
            <img
              src={artisanBakeryLogoImg}
              alt="Artisan BaeCurry Logo"
              className="footer-brand-logo-img"
            />
            <div className="footer-brand-text">
              <span className="footer-brand-title">ARTISAN BAECURRY</span>
              <span className="footer-brand-subtitle">Inventory & Store</span>
            </div>
          </div>
          <p className="footer-tagline">
            Freshly baked goods managed with real-time stock control and order processing.
          </p>
        </div>

        <div className="footer-links-column">
          <h4>Navigation</h4>
          <ul>
            <li><a href="/#bakery-selection">Bakery Selection</a></li>
            <li><a href="/login">User Portal</a></li>
            <li><a href="/register">Customer Signup</a></li>
          </ul>
        </div>

        <div className="footer-links-column">
          <h4>System Roles</h4>
          <ul>
            <li><span>Customer Online Store</span></li>
            <li><span>Inventory Manager Portal</span></li>
            <li><span>Administrator Dashboard</span></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© 2026 Bakery Inventory Management System. Built with Spring Boot & React.</p>
      </div>
    </footer>
  );
};
