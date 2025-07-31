// src/pages/MyAttendancePage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function MyAttendancePage() {
    const [location, setLocation] = useState(null);
    const [locationError, setLocationError] = useState('');
    const [attendanceRecords, setAttendanceRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [markingAttendance, setMarkingAttendance] = useState(false); // For button loading state
    const [isMarkedPresentToday, setIsMarkedPresentToday] = useState(false); // To enable/disable button
    const [message, setMessage] = useState('');

    const API_URL = 'http://localhost:5000/api/attendance'; // Your backend attendance API endpoint

    useEffect(() => {
        getLocation();
        fetchAttendanceRecords();
    }, []);

    useEffect(() => {
        // After attendance records are fetched, determine if marked present today
        if (attendanceRecords.length > 0) {
            const today = new Date().toDateString();
            const todayRecords = attendanceRecords.filter(record =>
                new Date(record.attendance_date).toDateString() === today && record.status === 'Present'
            );
            setIsMarkedPresentToday(todayRecords.length > 0);
        } else {
            setIsMarkedPresentToday(false);
        }
    }, [attendanceRecords]);

    const getLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    });
                    setLocationError('');
                    toast.success(`Location retrieved with accuracy: ±${position.coords.accuracy.toFixed(2)} meters.`);
                },
                (error) => {
                    console.error("Error getting location:", error);
                    let errorMessage = "Unable to retrieve your location. Please enable location services and try again.";
                    if (error.code === error.PERMISSION_DENIED) {
                        errorMessage = "Location access denied. Please grant permission in your browser settings.";
                    } else if (error.code === error.POSITION_UNAVAILABLE) {
                        errorMessage = "Location information is unavailable.";
                    } else if (error.code === error.TIMEOUT) {
                        errorMessage = "Request to get user location timed out. Try again.";
                    }
                    setLocationError(errorMessage);
                    toast.error(`Location error: ${errorMessage}`);
                },
                { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
            );
        } else {
            setLocationError("Geolocation is not supported by this browser.");
            toast.error("Geolocation not supported by your browser.");
        }
    };

    const fetchAttendanceRecords = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(API_URL + '/my-attendance', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setAttendanceRecords(res.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching attendance records:', err);
            setMessage('Failed to load attendance history.');
            toast.error('Failed to load attendance history.');
            setLoading(false);
        }
    };

    const handleMarkPresent = async () => {
        // Always attempt to get a fresh location right before marking attendance
        if (navigator.geolocation) {
            setMarkingAttendance(true);
            setMessage('Getting precise location to mark attendance...');
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const currentCoords = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    };
                    setLocation(currentCoords); // Update state with the latest location
                    setLocationError('');
                    setMessage('');

                    try {
                        const token = localStorage.getItem('token');
                        // Use the new endpoint: /api/attendance/mark-present
                        const res = await axios.post(API_URL + '/mark-present', currentCoords, {
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        });
                        toast.success(res.data.msg);
                        setMessage(res.data.msg);
                        fetchAttendanceRecords(); // Refresh records to show new entry
                    } catch (err) {
                        console.error('Mark present error:', err.response ? err.response.data : err.message);
                        const errorMsg = err.response && err.response.data && err.response.data.msg
                                            ? err.response.data.msg
                                            : 'Failed to mark attendance. Server error.';
                        toast.error(errorMsg);
                        setMessage(errorMsg);
                    } finally {
                        setMarkingAttendance(false);
                    }
                },
                (error) => {
                    console.error("Error getting location for marking attendance:", error);
                    let errorMessage = "Unable to get precise location. Please ensure GPS is on and try again.";
                    if (error.code === error.PERMISSION_DENIED) {
                        errorMessage = "Location access denied. Cannot mark attendance without permission.";
                    } else if (error.code === error.TIMEOUT) {
                        errorMessage = "Location request timed out. Could not get a precise location in time.";
                    }
                    setLocationError(errorMessage);
                    toast.error(errorMessage);
                    setMessage(errorMessage);
                    setMarkingAttendance(false);
                },
                { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 } // Request fresh, high-accuracy for marking
            );
        } else {
            const errorMsg = "Geolocation is not supported by your browser. Cannot mark attendance.";
            setLocationError(errorMsg);
            toast.error(errorMsg);
            setMessage(errorMsg);
        }
    };

    // Helper to format date
    const formatDate = (isoString) => {
        if (!isoString) return 'N/A';
        // Use 'en-IN' for Indian locale date formatting, or undefined for default browser locale
        return new Date(isoString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short', // e.g., Jul
            day: 'numeric'
        });
    };

    // Helper to format time (Corrected version for ISO string like '1970-01-01T17:54:51.000Z')
    const formatTime = (isoTimeString) => {
        if (!isoTimeString) return 'N/A';

        const dateObj = new Date(isoTimeString); // Directly parse the ISO string

        // Check if parsing resulted in a valid date object
        if (isNaN(dateObj.getTime())) {
            console.error("Invalid time value received by formatTime:", isoTimeString);
            return 'Invalid Time'; // Fallback for truly unparseable strings
        }

        // Format to a local time string, including seconds for consistency with "Recorded At" column
        // Using 'en-IN' for Indian locale, with 12-hour format (AM/PM)
        return dateObj.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
    };

    return (
        <div className="container mx-auto p-4 md:p-8 bg-gray-50 min-h-screen">
            <h2 className="text-4xl font-extrabold mb-8 text-center text-indigo-800">My Attendance</h2>

            <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg mb-8 border border-gray-200">
                <h3 className="text-2xl font-semibold mb-4 text-indigo-700 text-center">Mark Attendance</h3>
                {locationError && (
                    <p className="text-red-600 text-base mb-4 text-center font-medium">{locationError}</p>
                )}
                {!location && !locationError && (
                    <p className="text-gray-600 text-base mb-4 text-center">
                        Attempting to get your current location... Please ensure location services are enabled for your browser and device.
                    </p>
                )}
                {location && (
                    <p className="text-green-700 text-base mb-4 text-center font-medium">
                        Location retrieved: Lat {location.latitude.toFixed(6)}, Lon {location.longitude.toFixed(6)}
                        {location.accuracy && ` (Accuracy: ±${location.accuracy.toFixed(2)} meters)`}
                    </p>
                )}

                <div className="flex justify-center space-x-4 mb-4">
                    <button
                        onClick={handleMarkPresent}
                        disabled={markingAttendance || !location || isMarkedPresentToday}
                        className={`px-8 py-3 rounded-lg font-bold text-lg transition duration-300 ease-in-out transform hover:scale-105
                            ${(markingAttendance && !isMarkedPresentToday) || !location || isMarkedPresentToday
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-green-600 hover:bg-green-700 text-white shadow-md'
                            }`}
                    >
                        {markingAttendance ? 'Marking...' : (isMarkedPresentToday ? 'Marked Present Today' : 'Mark Present')}
                    </button>
                </div>
                {message && <p className="text-center mt-2 text-md font-medium text-gray-800">{message}</p>}
            </div>

            <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg border border-gray-200">
                <h3 className="text-2xl font-semibold mb-4 text-indigo-700 text-center">Attendance History</h3>
                {loading ? (
                    <p className="text-center text-gray-600 py-4">Loading attendance records...</p>
                ) : attendanceRecords.length === 0 ? (
                    <p className="text-center text-gray-600 py-4">No attendance records found.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white border border-gray-200 rounded-lg overflow-hidden">
                            <thead className="bg-indigo-100">
                                <tr>
                                    <th className="py-3 px-4 border-b text-left text-sm font-semibold text-indigo-800">Date</th>
                                    <th className="py-3 px-4 border-b text-left text-sm font-semibold text-indigo-800">Time In</th>
                                    <th className="py-3 px-4 border-b text-left text-sm font-semibold text-indigo-800">Status</th>
                                    <th className="py-3 px-4 border-b text-left text-sm font-semibold text-indigo-800">Location</th>
                                    <th className="py-3 px-4 border-b text-left text-sm font-semibold text-indigo-800">Recorded At (UTC)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {attendanceRecords.map((record) => (
                                    <tr key={record.attendance_id} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="py-2.5 px-4 text-sm text-gray-800">
                                            {formatDate(record.attendance_date)}
                                        </td>
                                        <td className="py-2.5 px-4 text-sm text-gray-800">
                                            {formatTime(record.time_in)}
                                        </td>
                                        <td className="py-2.5 px-4 text-sm text-gray-800">
                                            {record.status}
                                        </td>
                                        <td className="py-2.5 px-4 text-sm text-gray-800">
                                            {record.recorded_latitude && record.recorded_longitude
                                                ? `Lat: ${record.recorded_latitude.toFixed(4)}, Lon: ${record.recorded_longitude.toFixed(4)}`
                                                : 'N/A'}
                                        </td>
                                        <td className="py-2.5 px-4 text-sm text-gray-800">
                                            {new Date(record.created_at).toLocaleString('en-IN')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default MyAttendancePage;