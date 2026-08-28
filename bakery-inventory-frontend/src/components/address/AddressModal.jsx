import React, { useState, useEffect } from 'react';
import { GoogleMapLocationPicker } from './GoogleMapLocationPicker';
import { Home, Briefcase, MapPin, X, AlertTriangle, CheckCircle2, ShieldCheck } from 'lucide-react';

/**
 * AddressModal Component
 *
 * Creates or edits a Customer Saved Address.
 * Integrates GoogleMapLocationPicker, assists and allows manual editing of address fields,
 * validates 6-digit Indian postal codes, and requires explicit confirmation before saving.
 */
export const AddressModal = ({
  isOpen,
  onClose,
  onSave,
  address = null, // If provided, editing mode; else create mode
  isFirstAddress = false,
}) => {
  const isEdit = Boolean(address?.id);

  const [label, setLabel] = useState('Home');
  const [customLabel, setCustomLabel] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [latitude, setLatitude] = useState(19.0760);
  const [longitude, setLongitude] = useState(72.8777);
  const [placeId, setPlaceId] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  const [isConfirmed, setIsConfirmed] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Initialize or reset form when modal opens or address prop changes
  useEffect(() => {
    if (isOpen) {
      if (address) {
        // Edit mode
        const existingLabel = address.label || 'Home';
        if (['Home', 'Work'].includes(existingLabel)) {
          setLabel(existingLabel);
          setCustomLabel('');
        } else {
          setLabel('Other');
          setCustomLabel(existingLabel);
        }
        setAddressLine(address.addressLine || '');
        setLandmark(address.landmark || '');
        setCity(address.city || '');
        setState(address.state || '');
        setPostalCode(address.postalCode || '');
        setLatitude(address.latitude ? Number(address.latitude) : 19.0760);
        setLongitude(address.longitude ? Number(address.longitude) : 72.8777);
        setPlaceId(address.placeId || '');
        setIsDefault(Boolean(address.isDefault));
        setIsConfirmed(true); // Existing address is pre-confirmed
      } else {
        // Create mode
        setLabel('Home');
        setCustomLabel('');
        setAddressLine('');
        setLandmark('');
        setCity('');
        setState('');
        setPostalCode('');
        setLatitude(19.0760);
        setLongitude(72.8777);
        setPlaceId('');
        setIsDefault(isFirstAddress);
        setIsConfirmed(false);
      }
      setValidationError(null);
      setSaving(false);
    }
  }, [isOpen, address, isFirstAddress]);

  if (!isOpen) return null;

  // Callback when location is selected from Google Maps / Places
  const handleLocationSelect = (loc) => {
    if (loc.addressLine && !addressLine) {
      setAddressLine(loc.addressLine);
    } else if (loc.addressLine) {
      setAddressLine(loc.addressLine);
    }
    if (loc.city) setCity(loc.city);
    if (loc.state) setState(loc.state);
    if (loc.postalCode) setPostalCode(loc.postalCode);
    if (typeof loc.latitude === 'number') setLatitude(loc.latitude);
    if (typeof loc.longitude === 'number') setLongitude(loc.longitude);
    if (loc.placeId) setPlaceId(loc.placeId);
    setValidationError(null);
  };

  const handleLocationConfirmed = () => {
    setIsConfirmed(true);
    setValidationError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError(null);

    const finalLabel = label === 'Other' ? (customLabel.trim() || 'Other') : label;

    // Client-side validation matching backend Bean Validation
    if (!finalLabel) {
      setValidationError('Address label is required.');
      return;
    }
    if (finalLabel.length > 30) {
      setValidationError('Address label must not exceed 30 characters.');
      return;
    }
    if (!addressLine.trim()) {
      setValidationError('Address line is required.');
      return;
    }
    if (addressLine.length > 255) {
      setValidationError('Address line must not exceed 255 characters.');
      return;
    }
    if (landmark && landmark.length > 255) {
      setValidationError('Landmark must not exceed 255 characters.');
      return;
    }
    if (!city.trim()) {
      setValidationError('City is required.');
      return;
    }
    if (city.length > 100) {
      setValidationError('City must not exceed 100 characters.');
      return;
    }
    if (!state.trim()) {
      setValidationError('State is required.');
      return;
    }
    if (state.length > 100) {
      setValidationError('State must not exceed 100 characters.');
      return;
    }
    const pinRegex = /^[1-9][0-9]{5}$/;
    if (!postalCode || !pinRegex.test(postalCode.trim())) {
      setValidationError('Postal code must be a valid 6-digit Indian PIN code (e.g. 400001).');
      return;
    }
    if (typeof latitude !== 'number' || latitude < -90 || latitude > 90) {
      setValidationError('Valid latitude is required.');
      return;
    }
    if (typeof longitude !== 'number' || longitude < -180 || longitude > 180) {
      setValidationError('Valid longitude is required.');
      return;
    }

    if (!isConfirmed) {
      setValidationError('Please review and confirm your address location before saving.');
      return;
    }

    setSaving(true);
    try {
      if (isEdit) {
        // PUT /api/addresses/{id} payload (SavedAddressUpdateRequest - NO isDefault)
        const updatePayload = {
          label: finalLabel,
          addressLine: addressLine.trim(),
          landmark: landmark.trim() || null,
          city: city.trim(),
          state: state.trim(),
          postalCode: postalCode.trim(),
          latitude: Number(latitude.toFixed(8)),
          longitude: Number(longitude.toFixed(8)),
          placeId: placeId || null,
        };
        await onSave(updatePayload);
      } else {
        // POST /api/addresses payload (SavedAddressCreateRequest - includes isDefault)
        const createPayload = {
          label: finalLabel,
          addressLine: addressLine.trim(),
          landmark: landmark.trim() || null,
          city: city.trim(),
          state: state.trim(),
          postalCode: postalCode.trim(),
          latitude: Number(latitude.toFixed(8)),
          longitude: Number(longitude.toFixed(8)),
          placeId: placeId || null,
          isDefault: Boolean(isDefault),
        };
        await onSave(createPayload);
      }
      onClose();
    } catch (err) {
      setValidationError(
        err.response?.data?.message ||
        (typeof err.response?.data === 'string' ? err.response.data : 'Failed to save address. Please check your inputs.')
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-container card backoffice-modal address-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-header-info">
            <div className="modal-header-icon-title">
              <MapPin className="text-primary" size={20} />
              <h3>{isEdit ? 'Edit Delivery Address' : 'Add New Delivery Address'}</h3>
            </div>
            <p className="modal-subtitle">
              {isEdit
                ? 'Update your saved location and delivery address details'
                : 'Search your delivery location on the map and add address details'}
            </p>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {validationError && (
            <div className="error-alert">
              <AlertTriangle size={18} className="flex-shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Section 1: Google Maps / Places Location Picker */}
          <div className="address-section">
            <h4 className="address-section-title">1. Location & Pin Point</h4>
            <GoogleMapLocationPicker
              initialLatitude={latitude}
              initialLongitude={longitude}
              onLocationSelect={handleLocationSelect}
              onLocationConfirmed={handleLocationConfirmed}
            />
          </div>

          {/* Section 2: Address Details */}
          <div className="address-section">
            <h4 className="address-section-title">2. Address Details</h4>

            {/* Label Selector */}
            <div className="form-group mb-3">
              <label className="form-label">Address Label *</label>
              <div className="address-label-pills">
                <button
                  type="button"
                  className={`label-pill ${label === 'Home' ? 'active' : ''}`}
                  onClick={() => setLabel('Home')}
                >
                  <Home size={15} />
                  <span>Home</span>
                </button>
                <button
                  type="button"
                  className={`label-pill ${label === 'Work' ? 'active' : ''}`}
                  onClick={() => setLabel('Work')}
                >
                  <Briefcase size={15} />
                  <span>Work</span>
                </button>
                <button
                  type="button"
                  className={`label-pill ${label === 'Other' ? 'active' : ''}`}
                  onClick={() => setLabel('Other')}
                >
                  <MapPin size={15} />
                  <span>Other</span>
                </button>
              </div>

              {label === 'Other' && (
                <input
                  type="text"
                  className="form-control mt-2"
                  placeholder="e.g. Grandma's House, Studio, Beach House"
                  value={customLabel}
                  onChange={(e) => setCustomLabel(e.target.value)}
                  maxLength={30}
                />
              )}
            </div>

            {/* Address Line */}
            <div className="form-group mb-3">
              <label htmlFor="addressLine" className="form-label">
                House / Flat / Block No., Street & Area *
              </label>
              <input
                id="addressLine"
                type="text"
                className="form-control"
                placeholder="e.g. Flat 402, Sunshine Apartments, 12th Main Road"
                value={addressLine}
                onChange={(e) => setAddressLine(e.target.value)}
                maxLength={255}
                required
              />
            </div>

            {/* Landmark */}
            <div className="form-group mb-3">
              <label htmlFor="landmark" className="form-label">
                Landmark (Optional)
              </label>
              <input
                id="landmark"
                type="text"
                className="form-control"
                placeholder="e.g. Near Central Park, Behind Metro Station"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                maxLength={255}
              />
            </div>

            {/* City, State, Postal Code Grid */}
            <div className="address-fields-grid">
              <div className="form-group">
                <label htmlFor="city" className="form-label">City *</label>
                <input
                  id="city"
                  type="text"
                  className="form-control"
                  placeholder="e.g. Mumbai"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  maxLength={100}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="state" className="form-label">State *</label>
                <input
                  id="state"
                  type="text"
                  className="form-control"
                  placeholder="e.g. Maharashtra"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  maxLength={100}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="postalCode" className="form-label">PIN Code *</label>
                <input
                  id="postalCode"
                  type="text"
                  className="form-control"
                  placeholder="6-digit PIN Code"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  required
                />
              </div>
            </div>

            {/* Default Address Checkbox (create mode only) */}
            {!isEdit && (
              <div className="default-address-checkbox-wrapper mt-3">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={isDefault || isFirstAddress}
                    disabled={isFirstAddress}
                    onChange={(e) => setIsDefault(e.target.checked)}
                  />
                  <span>
                    Set as default delivery address
                    {isFirstAddress && ' (First address is automatically default)'}
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* Section 3: Explicit Confirmation */}
          <div className="address-confirm-box">
            <label className="confirm-checkbox-label">
              <input
                type="checkbox"
                checked={isConfirmed}
                onChange={(e) => setIsConfirmed(e.target.checked)}
              />
              <span>
                <ShieldCheck size={16} className="text-primary inline-icon" />
                I confirm that the location pin and address details are accurate for delivery.
              </span>
            </label>
          </div>

          {/* Modal Actions */}
          <div className="modal-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={saving}
            >
              {saving ? (
                <span>Saving Address...</span>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>{isEdit ? 'Update Address' : 'Save Address'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
