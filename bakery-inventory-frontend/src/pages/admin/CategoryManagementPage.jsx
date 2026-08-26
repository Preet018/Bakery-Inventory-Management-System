import React, { useEffect, useState } from 'react';
import { categoryService } from '../../services/categoryService';
import { Layers, Plus, Trash2, RefreshCw, X } from 'lucide-react';

/**
 * NEW FILE: CategoryManagementPage Component
 * Admin portal for creating, listing, and deleting product categories.
 */

export const CategoryManagementPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await categoryService.getAllCategories();
      setCategories(data || []);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await categoryService.createCategory({ name, description });
      setShowModal(false);
      setName('');
      setDescription('');
      fetchCategories();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create category.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      await categoryService.deleteCategory(id);
      fetchCategories();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete category.');
    }
  };

  return (
    <div className="category-admin-page page-container">
      <div className="page-header flex-between">
        <div>
          <h1>Category Management</h1>
          <p>Organize bakery products into logical groupings (Bread, Cakes, Pastries)</p>
        </div>

        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus size={18} /> Create New Category
        </button>
      </div>

      {loading ? (
        <div className="loading-state">
          <RefreshCw className="spinner" size={32} />
          <p>Loading categories...</p>
        </div>
      ) : categories.length === 0 ? (
        <div className="empty-state card">
          <Layers size={48} />
          <h3>No Categories Found</h3>
          <p>Create your first category to group products.</p>
        </div>
      ) : (
        <div className="table-responsive card">
          <table className="inventory-table">
            <thead>
              <tr>
                <th>Cat ID</th>
                <th>Category Name</th>
                <th>Description</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id}>
                  <td>#{cat.id}</td>
                  <td className="font-bold">{cat.name}</td>
                  <td>{cat.description || 'No description'}</td>
                  <td className="text-right">
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="btn-sm btn-danger"
                      title="Delete Category"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-container card">
            <div className="modal-header">
              <h3>Create Category</h3>
              <button onClick={() => setShowModal(false)} className="modal-close-btn">
                <X size={20} />
              </button>
            </div>

            {error && <div className="error-alert">{error}</div>}

            <form onSubmit={handleCreateCategory} className="modal-form">
              <div className="form-group">
                <label>Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sourdough Breads"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  rows={3}
                  placeholder="Short description of products in this category..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? 'Creating...' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
