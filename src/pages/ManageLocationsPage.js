// src/pages/ManageLocationsPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css'; // Ensure Leaflet CSS is imported here

// Fix for default marker icon issue with Leaflet in Webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

function ManageLocationsPage() {
    const [locationName, setLocationName] = useState('');
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');
    const [radius, setRadius] = useState('');
    const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]); // Default center for India
    const [markerPosition, setMarkerPosition] = useState(null); // Marker position on map
    const [loading, setLoading] = useState(false);
    const [isLocationSet, setIsLocationSet] = useState(false); // To determine if delete button should show

    const API_URL = 'http://localhost:5000/api/geo-locations';

    useEffect(() => {
        // Fetch existing location data on component mount
        fetchLocation();
    }, []);

    // Effect to update map center and marker when latitude/longitude states change
    useEffect(() => {
        const lat = parseFloat(latitude);
        const lon = parseFloat(longitude);
        if (!isNaN(lat) && !isNaN(lon)) {
            setMapCenter([lat, lon]);
            setMarkerPosition([lat, lon]);
        } else {
            setMarkerPosition(null); // Clear marker if coordinates are invalid or empty
        }
    }, [latitude, longitude]);

    const fetchLocation = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(API_URL, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const { location_name, latitude, longitude, radius_meters } = res.data;
            setLocationName(location_name);
            setLatitude(String(latitude)); // Ensure it's a string for input field
            setLongitude(String(longitude)); // Ensure it's a string for input field
            setRadius(String(radius_meters)); // Ensure it's a string for input field
            // Map center and marker will be updated by the useEffect hook above
            setIsLocationSet(true); // Location is set, show delete button
            toast.success('Existing location loaded!');
        } catch (err) {
            console.error('Error fetching location:', err.response ? err.response.data : err.message);
            setIsLocationSet(false); // No location set, hide delete button
            if (err.response && err.response.status === 404) {
                toast.info('No global attendance location set yet. Please set one.');
            } else {
                toast.error('Failed to load existing location.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSetUpdateLocation = async (e) => {
        e.preventDefault();
        setLoading(true);

        const parsedLatitude = parseFloat(latitude);
        const parsedLongitude = parseFloat(longitude);
        const parsedRadius = parseInt(radius);

        if (!locationName.trim()) {
            toast.error('Location Name is required.');
            setLoading(false);
            return;
        }
        if (isNaN(parsedLatitude) || parsedLatitude < -90 || parsedLatitude > 90) {
            toast.error('Please enter a valid Latitude (-90 to 90).');
            setLoading(false);
            return;
        }
        if (isNaN(parsedLongitude) || parsedLongitude < -180 || parsedLongitude > 180) {
            toast.error('Please enter a valid Longitude (-180 to 180).');
            setLoading(false);
            return;
        }
        if (isNaN(parsedRadius) || parsedRadius <= 0) {
            toast.error('Please enter a valid Radius (a positive number in meters).');
            setLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const locationData = {
                location_name: locationName.trim(),
                latitude: parsedLatitude,
                longitude: parsedLongitude,
                radius_meters: parsedRadius,
            };

            const res = await axios.post(API_URL, locationData, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            toast.success(res.data.msg);
            setIsLocationSet(true); // Mark as set
        } catch (err) {
            console.error('Error setting/updating location:', err.response ? err.response.data : err.message);
            const errorMsg = err.response && err.response.data && err.response.data.msg
                                ? err.response.data.msg
                                : 'Failed to set/update location.';
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteLocation = async () => {
        if (!window.confirm('Are you sure you want to delete the global attendance location?')) {
            return;
        }
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.delete(API_URL, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            toast.success(res.data.msg);
            // Clear form and map after deletion
            setLocationName('');
            setLatitude('');
            setLongitude('');
            setRadius('');
            setMarkerPosition(null);
            setIsLocationSet(false); // Mark as not set
        } catch (err) {
            console.error('Error deleting location:', err.response ? err.response.data : err.message);
            const errorMsg = err.response && err.response.data && err.response.data.msg
                                ? err.response.data.msg
                                : 'Failed to delete location.';
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    // Component to handle map clicks and update marker/coordinates
    function MapEvents() {
        const map = useMapEvents({
            click: (e) => {
                const { lat, lng } = e.latlng;
                setLatitude(lat.toFixed(6));
                setLongitude(lng.toFixed(6));
                // Marker position and map center will be updated by the useEffect hook
                toast.info(`Map clicked: Lat ${lat.toFixed(6)}, Lon ${lng.toFixed(6)}`);
            },
            // You can add other events like dragend for marker if needed
        });
        return null;
    }

    return (
        <div className="container mx-auto p-4 md:p-8 bg-gray-50 min-h-screen">
            <h2 className="text-4xl font-extrabold mb-8 text-center text-indigo-800">Manage Global Attendance Location</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Form Section */}
                <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg border border-gray-200 h-fit">
                    <p className="text-gray-600 mb-6 text-center max-w-2xl mx-auto">
                        Define the central location for attendance tracking by entering its coordinates and radius. Employees checking in within this radius will be marked present.
                    </p>
                    <form onSubmit={handleSetUpdateLocation} className="space-y-6">
                        {/* Location Name Input */}
                        <div>
                            <label className="block text-gray-800 text-sm font-semibold mb-2" htmlFor="locationName">
                                Location Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="locationName"
                                className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-2.5 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200"
                                value={locationName}
                                onChange={(e) => setLocationName(e.target.value)}
                                placeholder="e.g., Main Office Building"
                                required
                            />
                        </div>

                        {/* Latitude Input */}
                        <div>
                            <label className="block text-gray-800 text-sm font-semibold mb-2" htmlFor="latitude">
                                Latitude <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="latitude"
                                className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-2.5 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200"
                                value={latitude}
                                onChange={(e) => setLatitude(e.target.value)}
                                placeholder="e.g., 37.422"
                                required
                            />
                        </div>

                        {/* Longitude Input */}
                        <div>
                            <label className="block text-gray-800 text-sm font-semibold mb-2" htmlFor="longitude">
                                Longitude <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="longitude"
                                className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-2.5 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200"
                                value={longitude}
                                onChange={(e) => setLongitude(e.target.value)}
                                placeholder="e.g., -122.084"
                                required
                            />
                        </div>

                        {/* Radius Input */}
                        <div>
                            <label className="block text-gray-800 text-sm font-semibold mb-2" htmlFor="radius">
                                Radius (meters) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                id="radius"
                                className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-2.5 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200"
                                value={radius}
                                onChange={(e) => setRadius(e.target.value)}
                                placeholder="e.g., 50 (meters)"
                                required
                            />
                        </div>

                        <div className="flex justify-center space-x-4 pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className={`px-8 py-3 rounded-lg font-bold text-lg transition duration-300 ease-in-out transform hover:scale-105
                                    ${loading
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md'
                                    }`}
                            >
                                {loading ? 'Processing...' : 'Set/Update Location'}
                            </button>
                            {isLocationSet && (
                                <button
                                    type="button"
                                    onClick={handleDeleteLocation}
                                    disabled={loading}
                                    className={`px-8 py-3 rounded-lg font-bold text-lg transition duration-300 ease-in-out transform hover:scale-105
                                        ${loading
                                            ? 'bg-gray-400 cursor-not-allowed'
                                            : 'bg-red-600 hover:bg-red-700 text-white shadow-md'
                                        }`}
                                >
                                    {loading ? 'Deleting...' : 'Delete Location'}
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* Map Section */}
                <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg flex flex-col border border-gray-200">
                    <h3 className="text-2xl font-semibold mb-4 text-indigo-700 text-center">Location Preview on Map</h3>
                    <p className="text-gray-600 mb-4 text-center">Click anywhere on the map to set Latitude and Longitude automatically in the form.</p>
                    <div className="flex-grow w-full h-[400px] rounded-lg overflow-hidden border border-gray-300"> {/* Added explicit height */}
                        <MapContainer
                            key={`${mapCenter[0]}-${mapCenter[1]}`} // Key prop to force re-render on center change
                            center={mapCenter}
                            zoom={13}
                            scrollWheelZoom={true}
                            className="h-full w-full" // Ensure map takes full height of its container
                        >
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            {markerPosition && (
                                <Marker
                                    position={markerPosition}
                                />
                            )}
                            <MapEvents /> {/* Custom component to handle map click events */}
                        </MapContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ManageLocationsPage;