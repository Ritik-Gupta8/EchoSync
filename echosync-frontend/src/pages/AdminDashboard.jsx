import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useLoadScript, GoogleMap, Marker, InfoWindow } from '@react-google-maps/api';
import { AlertTriangle, Clock, MapPin, ShieldAlert, CheckCircle, Languages, Image as ImageIcon } from 'lucide-react';

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const defaultCenter = {
  lat: 40.7128, // Default to NYC
  lng: -74.0060,
};

const AdminDashboard = () => {
  const [alerts, setAlerts] = useState([]);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [isNewAlertPulsing, setIsNewAlertPulsing] = useState(false);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
  const isInvalidKey = !apiKey || apiKey === "your_google_maps_key_here";

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: apiKey,
  });

  useEffect(() => {
    // Listen to Firebase Realtime updates
    const q = query(collection(db, 'alerts'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const alertsData = [];
      querySnapshot.forEach((doc) => {
        alertsData.push({ id: doc.id, ...doc.data() });
      });
      
      setAlerts(prevAlerts => {
        if (alertsData.length > prevAlerts.length && prevAlerts.length !== 0) {
          setIsNewAlertPulsing(true);
          setTimeout(() => setIsNewAlertPulsing(false), 3000); // Pulse for 3 seconds
        }
        return alertsData;
      });
    });

    return () => unsubscribe();
  }, []);

  const handleUpdateStatus = async (alertId, newStatus) => {
    try {
      await updateDoc(doc(db, 'alerts', alertId), {
        status: newStatus
      });
      // Close selected alert view if it was resolved
      if (newStatus === 'Resolved' && selectedAlert?.id === alertId) {
        setSelectedAlert(null);
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority?.toLowerCase()) {
      case 'critical': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'high': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      case 'medium': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  // Filter out resolved alerts from the main sidebar if desired, 
  // but for MVP let's show all or just gray out resolved ones.
  const activeAlerts = alerts.filter(a => a.status !== 'Resolved');

  return (
    <div className={`flex h-screen overflow-hidden font-sans transition-colors duration-500 ${isNewAlertPulsing ? 'bg-red-950/40' : 'bg-darker'}`}>
      
      {/* Sidebar: Active Alerts */}
      <div className="w-[26rem] bg-dark border-r border-slate-800 flex flex-col shadow-2xl z-10">
        <div className="p-6 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center space-x-3">
            <ShieldAlert className="w-8 h-8 text-brand" />
            <div>
              <h1 className="text-xl font-bold text-white tracking-wide">Mission Control</h1>
              <p className="text-xs text-slate-400">EchoSync Admin Dashboard</p>
            </div>
          </div>
        </div>

        <div className="p-4 flex-1 overflow-y-auto space-y-4 custom-scrollbar">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Active Alerts</span>
            <span className="bg-brand/20 text-brand px-2 py-0.5 rounded-full text-xs">{activeAlerts.length}</span>
          </h2>
          
          {activeAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-500">
              <CheckCircle className="w-10 h-10 mb-2 opacity-50" />
              <p className="text-sm">No active alerts</p>
            </div>
          ) : (
            activeAlerts.map(alert => (
              <div 
                key={alert.id} 
                onClick={() => setSelectedAlert(alert)}
                className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 hover:shadow-lg flex flex-col gap-3 ${
                  selectedAlert?.id === alert.id 
                    ? 'bg-slate-800 border-brand/50 shadow-[0_0_15px_rgba(225,29,72,0.15)]' 
                    : 'bg-slate-900/50 border-slate-800 hover:bg-slate-800'
                }`}
              >
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div className="flex gap-2">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-md border uppercase tracking-wider ${getPriorityColor(alert.priority)}`}>
                      {alert.priority}
                    </span>
                    {alert.status === 'Acknowledged' && (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-md border border-emerald-500/20 text-emerald-400 bg-emerald-500/10 uppercase tracking-wider">
                        ACK
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-500 flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {alert.timestamp?.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) || 'Just now'}
                  </span>
                </div>
                
                {/* Image Preview Thumbnail */}
                {alert.image && (
                  <div className="flex items-center text-xs text-slate-400 bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <ImageIcon className="w-4 h-4 mr-2 text-blue-400" />
                    Image Attached
                  </div>
                )}

                {/* Translation & Message */}
                <div>
                  <p className="text-slate-200 text-sm line-clamp-2 mb-1">{alert.english_translation || alert.message}</p>
                  
                  {(alert.language_code && alert.language_code !== 'en' && alert.english_translation && alert.english_translation !== alert.message) && (
                    <div className="flex items-center text-xs text-slate-500 mt-1">
                      <Languages className="w-3 h-3 mr-1" />
                      Translated from: {alert.language_code.toUpperCase()}
                      <span className="ml-2 italic truncate">"{alert.message}"</span>
                    </div>
                  )}
                </div>

                {/* Action Required */}
                <div className="bg-slate-950 rounded-lg p-2.5 border border-slate-800/50">
                  <p className="text-xs text-brand mb-1 font-semibold uppercase">Action Required:</p>
                  <p className="text-sm text-slate-200">{alert.recommendedAction}</p>
                </div>

                {/* Admin Controls */}
                <div className="flex gap-2 mt-1">
                  {alert.status === 'Active' && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleUpdateStatus(alert.id, 'Acknowledged'); }}
                      className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 rounded-lg transition-colors"
                    >
                      Acknowledge
                    </button>
                  )}
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleUpdateStatus(alert.id, 'Resolved'); }}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2 rounded-lg transition-colors"
                  >
                    Resolve
                  </button>
                </div>
                
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Content: Map */}
      <div className="flex-1 relative bg-slate-900 p-4">
        {isInvalidKey ? (
          <div className="absolute inset-4 flex items-center justify-center bg-slate-800/50 flex-col border border-slate-700 rounded-2xl">
            <MapPin className="w-16 h-16 text-slate-500 mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Map Preview Disabled</h2>
            <p className="text-slate-400 text-center max-w-md">
              Please add a valid Google Maps API Key in your <code className="bg-slate-900 px-2 py-1 rounded text-brand">.env</code> file to enable the live map.
              <br/><br/>
              <span className="text-slate-300 font-medium">Don't worry! Your alerts are still functioning perfectly on the left.</span>
            </p>
          </div>
        ) : !isLoaded ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
          </div>
        ) : loadError ? (
          <div className="absolute inset-0 flex items-center justify-center bg-darker flex-col">
            <AlertTriangle className="w-16 h-16 text-yellow-500 mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Map Loading Error</h2>
            <p className="text-slate-400">Please check your Google Maps API Key in .env</p>
          </div>
        ) : (
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            zoom={13}
            center={activeAlerts.length > 0 && activeAlerts[0].location ? activeAlerts[0].location : defaultCenter}
            options={{
              styles: [
                { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
                { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
                { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
                { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
                { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
                { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#263c3f" }] },
                { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#6b9a76" }] },
                { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
                { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
                { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
                { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#746855" }] },
                { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1f2835" }] },
                { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#f3d19c" }] },
                { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
                { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] },
                { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#17263c" }] },
              ],
              disableDefaultUI: true,
              zoomControl: true,
            }}
          >
            {activeAlerts.map(alert => alert.location && (
              <Marker
                key={alert.id}
                position={alert.location}
                onClick={() => setSelectedAlert(alert)}
                icon={{
                  url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#E11D48" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>'),
                  scaledSize: new window.google.maps.Size(40, 40),
                }}
              />
            ))}

            {selectedAlert && selectedAlert.location && (
              <InfoWindow
                position={selectedAlert.location}
                onCloseClick={() => setSelectedAlert(null)}
              >
                <div className="p-4 bg-slate-900 text-white rounded-lg max-w-xs shadow-2xl border border-slate-700">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className={`font-bold text-sm ${getPriorityColor(selectedAlert.priority).split(' ')[0]}`}>
                      {selectedAlert.priority} Priority
                    </h3>
                  </div>
                  
                  {selectedAlert.image && (
                    <img src={selectedAlert.image} alt="Emergency" className="w-full h-32 object-cover rounded-md mb-2 border border-slate-700" />
                  )}

                  <p className="text-sm mb-3 text-slate-200">{selectedAlert.english_translation || selectedAlert.message}</p>
                  
                  <div className="bg-slate-950 p-2 rounded-md border border-slate-800">
                    <p className="text-xs font-semibold text-brand uppercase mb-1">Action Needed:</p>
                    <p className="text-xs text-slate-300">{selectedAlert.recommendedAction}</p>
                  </div>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
