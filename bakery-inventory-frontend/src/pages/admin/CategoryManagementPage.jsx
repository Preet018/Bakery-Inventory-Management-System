import React, { useEffect, useState, useMemo } from 'react';
import { categoryService } from '../../services/categoryService';
import { BackOfficeHeaderBadge } from '../../components/common/BackOfficeHeaderBadge';
import { CustomSelect } from '../../components/common/CustomSelect';
import { getErrorMessage } from '../../utils/apiError';
import {
  Shield,
  Layers,
  Plus,
  Trash2,
  RefreshCw,
  Search,
  X,
  ArrowUpDown,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

/**
 * CategoryManagementPage Component
 * Issue #18: Admin Category Management
 *
 * Provides:
 * 1. View/list categories
 * 2. Search by Category ID (#1, 1, 12, #12) & case-insensitive Name partial matching
 * 3. Client-side ordering (Category ID default, Category Name)
 * 4. Result count ("Showing X of Y categories")
 * 5. Create category modal (reusing { name })
 * 6. Delete category with backend validation error handling
 * (Category editing is intentionally out of scope for Issue #18)
 */
export const CategoryManagementPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [pageError, setPageError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Search & Sorting state
  const [searchQuery, setSearchQuery] = useState('');
  const [orderBy, setOrderBy] = useState('ID'); // 'ID' | 'NAME'

  // Modal & mutation states
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchCategories = async (isManual = false) => {
    try {
      if (isManual) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setPageError(null);

      const data = await categoryService.getAllCategories();
      setCategories(Array.isArray(data) ? data : []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      setPageError(getErrorMessage(err, 'Failed to load categories from database.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Auto-dismiss success message after 5 seconds
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => {
        setSuccessMsg(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  // Client-side filtering & sorting
  const filteredCategories = useMemo(() => {
    let result = [...categories];

    // 1. Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const rawId = q.replace(/^#\s*/, '');
      result = result.filter((cat) => {
        const idMatch =
          String(cat.id || '') === rawId ||
          `#${cat.id}`.toLowerCase().includes(q) ||
          (rawId && String(cat.id || '').includes(rawId));
        const nameMatch = (cat.name || '').toLowerCase().includes(q);
        const descMatch = (cat.description || '').toLowerCase().includes(q);
        return idMatch || nameMatch || descMatch;
      });
    }

    // 2. Client-side Ordering
    result.sort((a, b) => {
      if (orderBy === 'ID') {
        return (Number(a.id) || 0) - (Number(b.id) || 0);
      }
      if (orderBy === 'NAME') {
        return (a.name || '').localeCompare(b.name || '');
      }
      return 0;
    });

    return result;
  }, [categories, searchQuery, orderBy]);

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    setModalError(null);
    setPageError(null);
    setSuccessMsg(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setModalError('Category name is required.');
      return;
    }

    setSubmitting(true);

    try {
      const created = await categoryService.createCategory({ name: trimmedName });
      setShowModal(false);
      setName('');
      setSuccessMsg(`Category "${created?.name || trimmedName}" was created successfully.`);
      await fetchCategories();
    } catch (err) {
      console.error('Failed to create category:', err);
      setModalError(getErrorMessage(err, 'Failed to create category. Please check the name and try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCategory = async (id, catName) => {
    const displayName = catName ? `"${catName}"` : `Category #${id}`;
    if (!window.confirm(`Are you sure you want to delete ${displayName}?`)) return;

    setDeletingId(id);
    setPageError(null);
    setSuccessMsg(null);

    try {
      await categoryService.deleteCategory(id);
      setSuccessMsg(`${displayName} was successfully deleted.`);
      await fetchCategories();
    } catch (err) {
      console.error('Failed to delete category:', err);
      setPageError(getErrorMessage(err, 'Failed to delete category. It may have associated products.'));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="admin-dashboard-page category-admin-page page-container">
      {/* ===================================================
          1. HEADER & ACTIONS
          =================================================== */}
      <div className="dashboard-header-container">
        <div className="dashboard-title-area">
          <BackOfficeHeaderBadge lastUpdated={lastUpdated} />
          <h1>Category Management</h1>
          <p className="dashboard-subtitle">
            Organize bakery products into logical groupings (Bread, Cakes, Pastries)
          </p>
        </div>

        <div className="dashboard-header-actions">
          <button
            onClick={() => fetchCategories(true)}
            className="btn-secondary refresh-btn"
            disabled={refreshing || loading}
            title="Refresh categories from database"
          >
            <RefreshCw className={refreshing ? 'spinner' : ''} size={16} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          <button
            onClick={() => {
              setModalError(null);
              setName('');
              setShowModal(true);
            }}
            className="btn-primary"
            title="Create New Category"
          >
            <Plus size={16} />
            <span>Create New Category</span>
          </button>
        </div>
      </div>

      {/* Global Error Banner */}
      {pageError && (
        <div className="error-alert mb-4">
          <AlertCircle size={18} />
          <span>{pageError}</span>
        </div>
      )}

      {/* Global Success Banner */}
      {successMsg && (
        <div className="success-alert mb-4 flex-between">
          <div className="flex-center gap-2">
            <CheckCircle2 size={18} />
            <span>{successMsg}</span>
          </div>
          <button
            onClick={() => setSuccessMsg(null)}
            className="btn-link"
            style={{ color: 'inherit', padding: 0 }}
            aria-label="Dismiss alert"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* ===================================================
          2. SEARCH & FILTER TOOLBAR
          =================================================== */}
      <div className="inventory-toolbar card mb-6">
        <div className="toolbar-search-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search by Category ID (#1) or Category name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-field"
            id="category-search-input"
            aria-label="Search categories"
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

        <div className="toolbar-controls">
          <CustomSelect
            options={[
              { value: 'ID', label: 'Category ID' },
              { value: 'NAME', label: 'Category Name' },
            ]}
            value={orderBy}
            onChange={setOrderBy}
            icon={<ArrowUpDown size={14} />}
          />
        </div>
      </div>

      {/* ===================================================
          3. CATEGORIES TABLE & LIST
          =================================================== */}
      {loading ? (
        // CHANGE: Standardized semantic loading state
        <div className="loading-state admin-table-container admin-empty-container card">
          <RefreshCw className="spinner" size={28} />
          <p className="mt-2 text-muted">Loading categories from database...</p>
        </div>
      ) : categories.length === 0 ? (
        // CHANGE: Standardized empty dataset state with create CTA
        <div className="empty-state card text-center py-8">
          <Layers size={48} className="text-muted mb-2" />
          <h3>No Categories Found</h3>
          <p className="text-muted mb-3">Create your first category to group products.</p>
          <button
            onClick={() => {
              setModalError(null);
              setName('');
              setShowModal(true);
            }}
            className="btn-primary mt-2"
            style={{ margin: '0 auto' }}
          >
            <Plus size={16} /> Create First Category
          </button>
        </div>
      ) : filteredCategories.length === 0 ? (
        // CHANGE: Standardized filtered empty state with clear search CTA
        <div className="table-responsive card inventory-table-card">
          <div className="table-header-strip">
            <span className="table-count-label">
              Showing&nbsp;<strong>0</strong>&nbsp;of&nbsp;<strong>{categories.length}</strong>&nbsp;categories
            </span>
          </div>
          <div className="empty-state admin-empty-container" style={{ minHeight: '232px' }}>
            <Layers size={40} className="text-muted mb-2" />
            <h3>No Matching Categories Found</h3>
            <p className="text-muted mb-3">
              No categories match your current search query "{searchQuery.trim()}".
            </p>
            <button onClick={() => setSearchQuery('')} className="btn-secondary" style={{ margin: '0 auto' }}>
              <X size={14} /> Clear Search
            </button>
          </div>
        </div>
      ) : (
        <div className="table-responsive card inventory-table-card">
          <div className="table-header-strip">
            <span className="table-count-label">
              Showing&nbsp;<strong>{filteredCategories.length}</strong>&nbsp;of&nbsp;<strong>{categories.length}</strong>&nbsp;categories
            </span>
          </div>

          <table className="inventory-table">
            <thead>
              <tr>
                <th style={{ width: '15%' }}>Category ID</th>
                <th style={{ width: '65%' }}>Category Name</th>
                <th style={{ width: '20%' }} className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.map((cat) => (
                <tr key={cat.id}>
                  <td>
                    <span className="font-semibold" style={{ color: 'var(--color-primary, #d97706)' }}>
                      #{cat.id}
                    </span>
                  </td>
                  <td className="font-bold">{cat.name}</td>
                  <td className="text-right">
                    <button
                      onClick={() => handleDeleteCategory(cat.id, cat.name)}
                      className="btn-sm btn-danger"
                      title="Delete Category"
                      disabled={deletingId === cat.id}
                    >
                      <Trash2 size={14} /> {deletingId === cat.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ===================================================
          4. CREATE CATEGORY MODAL
          =================================================== */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-container card" style={{ maxWidth: '460px' }}>
            <div className="modal-header">
              <h3>Create Category</h3>
              <button
                onClick={() => setShowModal(false)}
                className="modal-close-btn"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            {modalError && (
              <div className="error-alert mb-4">
                <AlertCircle size={16} />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateCategory} className="modal-form">
              <div className="form-group">
                <label htmlFor="category-name-input">Category Name *</label>
                <input
                  id="category-name-input"
                  type="text"
                  required
                  placeholder="e.g. Sourdough Breads"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary"
                  disabled={submitting}
                >
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

