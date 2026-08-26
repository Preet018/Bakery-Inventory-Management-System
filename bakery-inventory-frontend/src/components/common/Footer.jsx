import React from 'react';
import { Cake, Heart } from 'lucide-react';

/**
 * NEW FILE: Footer Component
 */

export const Footer = () => {
  return (
    <footer className="bakery-footer">
      <div className="footer-container">
        <div className="footer-brand">
          <div className="footer-logo">
            <Cake size={24} />
            <span>Artisan Bakery System</span>
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
