import React, { useState, useEffect } from 'react';
import { collection, addDoc, doc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { AlertTriangle, MapPin, Mic, Send, Loader2, Camera, X, CheckCircle2, ShieldCheck } from 'lucide-react';
import axios from 'axios';

const GuestView = () => {
  const [message, setMessage] = useState('');
  const [image, setImage] = useState(null); // base64 string
  const [location, setLocation] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  
  // Real-time tracking state
  const [activeAlertId, setActiveAlertId] = useState(null);
  const [activeAlertStatus, setActiveAlertStatus] = useState(null);

  useEffect(() => {
    // Get location on load
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          setLocation({ lat: 40.7128, lng: -74.0060 });
        }
      );
    }
  }, []);

  // Listen for real-time status updates from the Admin
  useEffect(() => {
    if (!activeAlertId) return;

    const unsub = onSnapshot(doc(db, 'alerts', activeAlertId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setActiveAlertStatus(data.status);
        
        if (data.status === 'Resolved') {
          // If admin resolves it, clear the active alert after a delay
          setTimeout(() => {
            setActiveAlertId(null);
            setActiveAlertStatus(null);
            setMessage('');
            setImage(null);
          }, 3000);
        }
      }
    });

    return () => unsub();
  }, [activeAlertId]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSOS = async () => {
    if (!message && !image) {
      alert("Please enter a message or attach an image.");
      return;
    }
    
    setIsSubmitting(true);
    setStatusMsg("AI is analyzing the situation...");

    try {
      // 1. Send to Backend AI
      const payload = { message: message };
      if (image) payload.image_data = image;

      const aiResponse = await axios.post('https://echosync-backend-dgj4.onrender.com/analyze-crisis', payload);
      const { priority, action, english_translation, language_code } = aiResponse.data;
      
      setStatusMsg("Dispatching alert...");

      // 2. Save to Firestore
      const docRef = await addDoc(collection(db, 'alerts'), {
        message: message,
        image: image,
        location: location || { lat: 0, lng: 0 },
        priority: priority || 'High',
        recommendedAction: action || 'Investigate immediately',
        english_translation: english_translation || message,
        language_code: language_code || 'en',
        status: 'Active',
        timestamp: serverTimestamp(),
      });

      // Track this specific alert to give the user updates
      setActiveAlertId(docRef.id);
      setActiveAlertStatus('Active');
      setIsSubmitting(false);
      setStatusMsg('');

    } catch (error) {
      console.error("Error sending SOS:", error);
      setStatusMsg("Failed to send alert. Please try again.");
      setIsSubmitting(false);
    }
  };

  // --- RENDERING LIFELINE VIEW ---
  if (activeAlertId) {
    const isAcknowledged = activeAlertStatus === 'Acknowledged' || activeAlertStatus === 'Resolved';
    
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-6 font-sans transition-colors duration-700 ${isAcknowledged ? 'bg-emerald-950' : 'bg-red-950'}`}>
        <div className="w-full max-w-md bg-dark rounded-2xl shadow-2xl p-8 text-center border border-slate-800">
          
          {isAcknowledged ? (
            <ShieldCheck className="w-24 h-24 text-emerald-500 mx-auto mb-6 animate-pulse" />
          ) : (
            <AlertTriangle className="w-24 h-24 text-brand mx-auto mb-6 animate-bounce" />
          )}

          <h2 className="text-3xl font-bold text-white mb-2">
            {isAcknowledged ? "Help is on the way!" : "Alert Sent"}
          </h2>
          
          <p className="text-slate-300 mb-8 text-lg">
            {isAcknowledged 
              ? "Security responders have acknowledged your alert and are heading to your location."
              : "Your alert has been broadcasted to all active responders. Please stay calm and remain in a safe location."}
          </p>

          <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
            <p className="text-sm text-slate-400 mb-1">Current Status</p>
            <p className={`text-xl font-bold uppercase tracking-widest ${isAcknowledged ? 'text-emerald-400' : 'text-brand'}`}>
              {activeAlertStatus}
            </p>
          </div>
          
        </div>
      </div>
    );
  }

  // --- RENDERING FORM VIEW ---
  return (
    <div className="min-h-screen bg-darker flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-dark rounded-2xl shadow-2xl overflow-hidden border border-slate-800">
        
        <div className="bg-brand/10 p-6 text-center border-b border-brand/20">
          <AlertTriangle className="w-12 h-12 text-brand mx-auto mb-2" />
          <h1 className="text-2xl font-bold text-white tracking-wide">EchoSync</h1>
          <p className="text-slate-400 text-sm mt-1">Emergency Response System</p>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Location Indicator */}
          <div className="flex items-center space-x-3 bg-slate-900/50 p-3 rounded-lg border border-slate-800">
            <div className="bg-blue-500/20 p-2 rounded-full">
              <MapPin className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-slate-400">Current Location</p>
              <p className="text-sm font-medium text-slate-200">
                {location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : 'Locating...'}
              </p>
            </div>
          </div>

          {/* Message Input & Image Upload */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Describe the situation
            </label>
            
            {image && (
              <div className="relative mb-3 inline-block">
                <img src={image} alt="Preview" className="h-24 w-24 object-cover rounded-xl border border-slate-700" />
                <button 
                  onClick={() => setImage(null)}
                  className="absolute -top-2 -right-2 bg-slate-800 rounded-full p-1 text-slate-300 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="relative">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="E.g., Fire in the lobby, someone is hurt..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 pb-12 text-white placeholder-slate-500 focus:ring-2 focus:ring-brand focus:border-transparent transition-all duration-200 resize-none h-32"
                disabled={isSubmitting}
              />
              
              <div className="absolute bottom-3 left-3 flex space-x-2">
                <label className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer" title="Attach Photo">
                  <Camera className="w-5 h-5" />
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              </div>

              <button 
                className="absolute bottom-3 right-3 p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                title="Voice Input (Mock)"
              >
                <Mic className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* SOS Button */}
          <button
            onClick={handleSOS}
            disabled={isSubmitting || (!message && !image)}
            className={`w-full relative overflow-hidden group rounded-xl p-4 flex items-center justify-center space-x-2 transition-all duration-300 ${
              isSubmitting 
                ? 'bg-brand/50 cursor-not-allowed' 
                : (!message && !image) 
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                  : 'bg-brand hover:bg-red-500 hover:shadow-[0_0_30px_rgba(225,29,72,0.4)] text-white'
            }`}
          >
            {isSubmitting ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <span className="text-xl font-bold tracking-widest">SEND SOS</span>
                <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
          
          {statusMsg && (
            <p className="text-center text-sm font-medium text-slate-300 animate-fade-in">
              {statusMsg}
            </p>
          )}

        </div>
      </div>
    </div>
  );
};

export default GuestView;
