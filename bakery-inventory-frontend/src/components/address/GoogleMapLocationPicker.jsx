import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, CheckCircle2, Navigation } from 'lucide-react';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

/**
 * GoogleMapLocationPicker Component
 *
 * Implements the current Google Maps Platform Places API (New) & AdvancedMarkerElement:
 *   - Uses Google Places API (New) PlaceAutocompleteElement (<gmp-place-autocomplete>)
 *   - Uses modern AdvancedMarkerElement with draggable capability
 *   - Extracts placeId, coordinates, and address components using modern Place fields
 *   - Allows manual correction and requires explicit confirmation before saving
 *   - Clear fallback message when Google Maps API key is missing or failed to load
 */
export const GoogleMapLocationPicker = ({
  initialLatitude,
  initialLongitude,
  onLocationSelect,
  onLocationConfirmed
}) => {
  const [loadStatus, setLoadStatus] = useState('loading'); // 'loading' | 'ready' | 'error'
  const [errorMessage, setErrorMessage] = useState(null);
  const [currentCoords, setCurrentCoords] = useState(() => ({
    lat: initialLatitude ? Number(initialLatitude) : 19.0760, // Default coordinates (Mumbai)
    lng: initialLongitude ? Number(initialLongitude) : 72.8777,
  }));
  const [selectedPlaceName, setSelectedPlaceName] = useState('');
  const [isLocationConfirmed, setIsLocationConfirmed] = useState(false);

  const mapContainerRef = useRef(null);
  const autocompleteContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerInstanceRef = useRef(null);
  const geocoderRef = useRef(null);

  // Dynamic Google Maps Script loader supporting Places API (New) & Advanced Markers
  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) {
      setLoadStatus('error');
      setErrorMessage(
        'Interactive map is currently unavailable. Please enter your address details in the fields below.'
      );
      return;
    }

    if (window.google && window.google.maps && window.google.maps.importLibrary) {
      setLoadStatus('ready');
      return;
    }

    const existingScript = document.getElementById('google-maps-script');
    if (!existingScript) {
      const script = document.createElement('script');
      script.id = 'google-maps-script';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&v=weekly&libraries=places,marker`;
      script.async = true;
      script.defer = true;

      script.onload = () => setLoadStatus('ready');
      script.onerror = () => {
        setLoadStatus('error');
        setErrorMessage(
          'Failed to load Google Maps. Please check your internet connection or enter address details manually.'
        );
      };

      document.head.appendChild(script);
    } else {
      existingScript.addEventListener('load', () => setLoadStatus('ready'));
      existingScript.addEventListener('error', () => {
        setLoadStatus('error');
        setErrorMessage(
          'Failed to load Google Maps. You can enter address details manually.'
        );
      });
    }
  }, []);

  // Parse modern or legacy address components
  const parseAddressComponents = useCallback((components, place) => {
    let streetNumber = '';
    let route = '';
    let sublocality = '';
    let city = '';
    let state = '';
    let postalCode = '';

    if (Array.isArray(components)) {
      components.forEach((comp) => {
        const types = comp.types || [];
        const longVal = comp.longText || comp.long_name || comp.shortText || comp.short_name || '';
        const shortVal = comp.shortText || comp.short_name || longVal;

        if (types.includes('street_number')) {
          streetNumber = longVal;
        } else if (types.includes('route')) {
          route = longVal;
        } else if (types.includes('sublocality') || types.includes('sublocality_level_1')) {
          sublocality = longVal;
        } else if (types.includes('locality')) {
          city = longVal;
        } else if (types.includes('administrative_area_level_1')) {
          state = longVal;
        } else if (types.includes('postal_code')) {
          postalCode = shortVal;
        }
      });
    }

    const displayName = typeof place?.displayName === 'object'
      ? place.displayName.text
      : (place?.displayName || place?.name || '');

    const streetPart = [streetNumber, route].filter(Boolean).join(' ');
    const addressLine = [displayName, streetPart, sublocality].filter(Boolean).join(', ') || place?.formattedAddress || place?.formatted_address || '';

    return {
      addressLine: addressLine.slice(0, 255),
      city: city.slice(0, 100),
      state: state.slice(0, 100),
      postalCode: postalCode.replace(/\D/g, '').slice(0, 6),
    };
  }, []);

  // Reverse Geocode for marker pin drag
  const handleReverseGeocode = useCallback((lat, lng) => {
    if (!geocoderRef.current && window.google?.maps?.Geocoder) {
      geocoderRef.current = new window.google.maps.Geocoder();
    }

    if (geocoderRef.current) {
      geocoderRef.current.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const result = results[0];
          const parsed = parseAddressComponents(result.address_components, result);

          setSelectedPlaceName(result.formatted_address || `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
          setIsLocationConfirmed(false);

          if (onLocationSelect) {
            onLocationSelect({
              ...parsed,
              latitude: Number(lat.toFixed(8)),
              longitude: Number(lng.toFixed(8)),
              placeId: result.place_id || '',
            });
          }
        } else {
          if (onLocationSelect) {
            onLocationSelect({
              latitude: Number(lat.toFixed(8)),
              longitude: Number(lng.toFixed(8)),
            });
          }
        }
      });
    } else if (onLocationSelect) {
      onLocationSelect({
        latitude: Number(lat.toFixed(8)),
        longitude: Number(lng.toFixed(8)),
      });
    }
  }, [onLocationSelect, parseAddressComponents]);

  // Initialize Map, Places API (New) Autocomplete, and Marker
  useEffect(() => {
    if (loadStatus !== 'ready' || !mapContainerRef.current || !window.google?.maps) {
      return;
    }

    let isMounted = true;

    const initMapAndPlaces = async () => {
      try {
        const { Map } = await window.google.maps.importLibrary('maps');
        const { PlaceAutocompleteElement } = await window.google.maps.importLibrary('places');
        const markerLib = await window.google.maps.importLibrary('marker');

        if (!isMounted) return;

        const initialPos = {
          lat: initialLatitude ? Number(initialLatitude) : currentCoords.lat,
          lng: initialLongitude ? Number(initialLongitude) : currentCoords.lng,
        };

        // Create Map instance
        const map = new Map(mapContainerRef.current, {
          center: initialPos,
          zoom: 15,
          mapId: 'BAKERY_LOCATION_MAP_ID',
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });
        mapInstanceRef.current = map;

        // Create Marker (AdvancedMarkerElement with graceful fallback)
        let marker;
        if (markerLib?.AdvancedMarkerElement) {
          marker = new markerLib.AdvancedMarkerElement({
            map,
            position: initialPos,
            gmpDraggable: true,
            title: 'Drag to adjust delivery location pin',
          });

          marker.addListener('dragend', () => {
            const pos = marker.position;
            const lat = typeof pos.lat === 'function' ? pos.lat() : pos.lat;
            const lng = typeof pos.lng === 'function' ? pos.lng() : pos.lng;
            setCurrentCoords({ lat, lng });
            handleReverseGeocode(lat, lng);
          });
        } else if (window.google.maps.Marker) {
          marker = new window.google.maps.Marker({
            position: initialPos,
            map,
            draggable: true,
            title: 'Drag to adjust delivery location pin',
          });

          marker.addListener('dragend', (event) => {
            const lat = event.latLng.lat();
            const lng = event.latLng.lng();
            setCurrentCoords({ lat, lng });
            handleReverseGeocode(lat, lng);
          });
        }
        markerInstanceRef.current = marker;

        // Initialize Places API (New) PlaceAutocompleteElement
        if (autocompleteContainerRef.current && PlaceAutocompleteElement) {
          autocompleteContainerRef.current.innerHTML = '';
          const placeAutocomplete = new PlaceAutocompleteElement();
          autocompleteContainerRef.current.appendChild(placeAutocomplete);

          placeAutocomplete.addEventListener('gmp-placeselect', async (event) => {
            const place = event.place;
            if (!place) return;

            await place.fetchFields({
              fields: ['displayName', 'formattedAddress', 'location', 'addressComponents', 'id']
            });

            if (!place.location) return;

            const lat = typeof place.location.lat === 'function' ? place.location.lat() : place.location.lat;
            const lng = typeof place.location.lng === 'function' ? place.location.lng() : place.location.lng;
            const coords = { lat, lng };

            setCurrentCoords(coords);
            const displayName = typeof place.displayName === 'object'
              ? place.displayName.text
              : (place.displayName || place.formattedAddress || '');
            setSelectedPlaceName(displayName);
            setIsLocationConfirmed(false);

            map.setCenter(coords);
            map.setZoom(17);

            if (marker.position !== undefined) {
              marker.position = coords;
            } else if (marker.setPosition) {
              marker.setPosition(coords);
            }

            const parsed = parseAddressComponents(place.addressComponents, place);
            if (onLocationSelect) {
              onLocationSelect({
                ...parsed,
                latitude: Number(lat.toFixed(8)),
                longitude: Number(lng.toFixed(8)),
                placeId: place.id || '',
              });
            }
          });
        }
      } catch (err) {
        console.warn('Error initializing Google Maps Platform Places API (New):', err);
      }
    };

    initMapAndPlaces();

    return () => {
      isMounted = false;
    };
  }, [loadStatus, initialLatitude, initialLongitude, parseAddressComponents, handleReverseGeocode, onLocationSelect, currentCoords.lat, currentCoords.lng]);

  const handleConfirmLocation = () => {
    setIsLocationConfirmed(true);
    if (onLocationConfirmed) {
      onLocationConfirmed(currentCoords);
    }
  };

  if (loadStatus === 'error') {
    return (
      <div className="location-picker-fallback">
        <div className="location-fallback-header">
          <MapPin size={20} className="text-amber" />
          <div>
            <strong>Enter Address Manually</strong>
            <p>{errorMessage}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="google-map-location-picker">
      <div className="location-search-wrapper">
        <label className="form-label">
          Search Delivery Location / Landmark
        </label>
        {/* Container where Places API (New) PlaceAutocompleteElement is mounted */}
        <div ref={autocompleteContainerRef} className="places-new-autocomplete-container" />
        <div className="location-picker-tip">
          <MapPin size={14} />
          <span>You can drag the map pin to precisely adjust your delivery point.</span>
        </div>
      </div>

      {/* Interactive Map Canvas */}
      <div className="map-canvas-wrapper">
        <div ref={mapContainerRef} className="map-canvas" />
      </div>

      {/* Confirmation Area */}
      <div className="location-confirm-bar">
        <div className="location-status-info">
          {selectedPlaceName ? (
            <div className="selected-place-text">
              <Navigation size={15} className="text-primary" />
              <span>{selectedPlaceName}</span>
            </div>
          ) : (
            <span className="text-muted text-sm">Pin placed on map</span>
          )}
        </div>

        <button
          type="button"
          onClick={handleConfirmLocation}
          className={`btn-confirm-location ${isLocationConfirmed ? 'confirmed' : ''}`}
        >
          {isLocationConfirmed ? (
            <>
              <CheckCircle2 size={16} />
              <span>Location Confirmed</span>
            </>
          ) : (
            <>
              <MapPin size={16} />
              <span>Confirm Location Pin</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
