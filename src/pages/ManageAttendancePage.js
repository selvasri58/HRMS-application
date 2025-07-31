// src/pages/ManageAttendancePage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function ManageAttendancePage() {
    const [attendanceRecords, setAttendanceRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const API_URL = 'http://localhost:5000/api/attendance'; // Your backend attendance API endpoint for HR

    useEffect(() => {
        fetchAttendanceRecords();
    }, []);

    const fetchAttendanceRecords = async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(API_URL, { // This endpoint is authorized for HR and fetches all records
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            // Filter for 'Present' status and set the records
            const presentRecords = res.data.filter(record => record.status === 'Present');
            setAttendanceRecords(presentRecords);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching all attendance records for HR:', err);
            const errorMsg = err.response && err.response.data && err.response.data.msg
                             ? err.response.data.msg
                             : 'Failed to load attendance records. Server error or not authorized.';
            setError(errorMsg);
            toast.error(errorMsg);
            setLoading(false);
        }
    };

    // Helper to format date
    const formatDate = (isoString) => {
        if (!isoString) return 'N/A';
        return new Date(isoString).toLocaleDateString();
    };

    // Helper to format time
    const formatTime = (timeString) => {
        if (!timeString) return 'N/A';
        // Assuming timeString is in 'HH:MM:SS' format from SQL TIME type
        const [hours, minutes, seconds] = timeString.split(':');
        // Create a dummy date to use toLocaleTimeString
        const dummyDate = new Date();
        dummyDate.setHours(hours, minutes, seconds);
        return dummyDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="container mx-auto p-4 md:p-8 bg-gray-50 min-h-screen">
            <h2 className="text-4xl font-extrabold mb-8 text-center text-indigo-800">Manage Attendance (HR Dashboard)</h2>

            <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg border border-gray-200">
                <h3 className="text-2xl font-semibold mb-4 text-indigo-700 text-center">Present Employees Today</h3>
                {error && (
                    <p className="text-red-600 text-base mb-4 text-center font-medium">{error}</p>
                )}
                {loading ? (
                    <p className="text-center text-gray-600 py-4">Loading attendance records...</p>
                ) : attendanceRecords.length === 0 ? (
                    <p className="text-center text-gray-600 py-4">No employees marked as 'Present' yet today.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white border border-gray-200 rounded-lg overflow-hidden">
                            <thead className="bg-indigo-100">
                                <tr>
                                    <th className="py-3 px-4 border-b text-left text-sm font-semibold text-indigo-800">Employee ID</th>
                                    <th className="py-3 px-4 border-b text-left text-sm font-semibold text-indigo-800">Employee Name</th>
                                    <th className="py-3 px-4 border-b text-left text-sm font-semibold text-indigo-800">Date</th>
                                    <th className="py-3 px-4 border-b text-left text-sm font-semibold text-indigo-800">Time In</th>
                                    <th className="py-3 px-4 border-b text-left text-sm font-semibold text-indigo-800">Status</th>
                                    <th className="py-3 px-4 border-b text-left text-sm font-semibold text-indigo-800">Recorded Location</th>
                                </tr>
                            </thead>
                            <tbody>
                                {attendanceRecords.map((record) => (
                                    <tr key={record.attendance_id} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="py-2.5 px-4 text-sm text-gray-800">
                                            {record.employee_id}
                                        </td>
                                        <td className="py-2.5 px-4 text-sm text-gray-800">
                                            {record.employee_name}
                                        </td>
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

export default ManageAttendancePage;