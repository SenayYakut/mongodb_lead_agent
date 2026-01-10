import React, { useState, useRef } from 'react';
import { submitMeeting } from '../services/api';

/**
 * Component for submitting new meetings with voice recording and photo capture
 */
const MeetingInput = ({ onMeetingSubmitted }) => {
  const [text, setText] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  
  // Photo state
  const [photos, setPhotos] = useState([]);
  const fileInputRef = useRef(null);

  // Voice recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setMessage('Error accessing microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const clearRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    audioChunksRef.current = [];
  };

  // Photo capture functions
  const handlePhotoCapture = (e) => {
    const files = Array.from(e.target.files);
    const newPhotos = files.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    setPhotos([...photos, ...newPhotos]);
  };

  const removePhoto = (index) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    newPhotos.forEach(photo => URL.revokeObjectURL(photo.preview));
    setPhotos(newPhotos);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!text.trim() && !audioBlob && photos.length === 0) {
      setMessage('Please enter meeting text, record audio, or upload photos');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const result = await submitMeeting(text, location || null, audioBlob, photos);
      setMessage(`Meeting processed! Priority: ${result.priority_group}`);
      setText('');
      setLocation('');
      clearRecording();
      photos.forEach(photo => URL.revokeObjectURL(photo.preview));
      setPhotos([]);
      
      // Notify parent component
      if (onMeetingSubmitted) {
        onMeetingSubmitted();
      }
    } catch (error) {
      setMessage('Error submitting meeting. Please try again.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Submit New Meeting</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.inputGroup}>
          <label style={styles.label}>Meeting Text (optional)</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter conversation transcript or meeting notes..."
            style={styles.textarea}
            rows={4}
          />
        </div>

        {/* Voice Recording Section */}
        <div style={styles.inputGroup}>
          <label style={styles.label}>Voice Recording</label>
          <div style={styles.recordingControls}>
            {!isRecording && !audioBlob && (
              <button
                type="button"
                onClick={startRecording}
                style={styles.recordButton}
              >
                🎤 Start Recording
              </button>
            )}
            {isRecording && (
              <button
                type="button"
                onClick={stopRecording}
                style={{ ...styles.recordButton, ...styles.stopButton }}
              >
                ⏹️ Stop Recording
              </button>
            )}
            {audioBlob && (
              <div style={styles.audioPreview}>
                <audio controls src={audioUrl} style={styles.audioPlayer} />
                <button
                  type="button"
                  onClick={clearRecording}
                  style={styles.clearButton}
                >
                  ✕ Clear
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Photo Capture Section */}
        <div style={styles.inputGroup}>
          <label style={styles.label}>Photos (Badge, Business Card, etc.)</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            onChange={handlePhotoCapture}
            style={styles.fileInput}
          />
          {photos.length > 0 && (
            <div style={styles.photosPreview}>
              {photos.map((photo, index) => (
                <div key={index} style={styles.photoItem}>
                  <img src={photo.preview} alt={`Preview ${index + 1}`} style={styles.photoPreview} />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    style={styles.removePhotoButton}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div style={styles.inputGroup}>
          <label style={styles.label}>Location (optional)</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g., Tech Conference 2024"
            style={styles.input}
          />
        </div>

        <button
          type="submit"
          disabled={loading || (!text.trim() && !audioBlob && photos.length === 0)}
          style={loading || (!text.trim() && !audioBlob && photos.length === 0) 
            ? { ...styles.button, ...styles.buttonDisabled } 
            : styles.button}
        >
          {loading ? 'Processing...' : 'Submit Meeting'}
        </button>

        {message && (
          <div style={styles.message}>
            {message}
          </div>
        )}
      </form>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px',
    border: '1px solid #000',
    borderRadius: '4px',
    marginBottom: '30px',
  },
  title: {
    marginBottom: '20px',
    fontSize: '24px',
    fontWeight: 'bold',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  inputGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontSize: '14px',
    fontWeight: '500',
  },
  textarea: {
    width: '100%',
    padding: '12px',
    border: '1px solid #000',
    borderRadius: '4px',
    fontSize: '14px',
    fontFamily: 'inherit',
    resize: 'vertical',
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '1px solid #000',
    borderRadius: '4px',
    fontSize: '14px',
    fontFamily: 'inherit',
  },
  button: {
    padding: '12px 24px',
    backgroundColor: '#000',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer',
    marginTop: '10px',
  },
  buttonDisabled: {
    backgroundColor: '#666',
    cursor: 'not-allowed',
  },
  message: {
    marginTop: '15px',
    padding: '10px',
    backgroundColor: '#f5f5f5',
    border: '1px solid #000',
    borderRadius: '4px',
    fontSize: '14px',
  },
  recordingControls: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  recordButton: {
    padding: '10px 20px',
    backgroundColor: '#000',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    cursor: 'pointer',
    width: 'fit-content',
  },
  stopButton: {
    backgroundColor: '#d32f2f',
  },
  audioPreview: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px',
    border: '1px solid #000',
    borderRadius: '4px',
    backgroundColor: '#f5f5f5',
  },
  audioPlayer: {
    flex: 1,
    maxWidth: '400px',
  },
  clearButton: {
    padding: '5px 10px',
    backgroundColor: '#666',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
  },
  fileInput: {
    width: '100%',
    padding: '10px',
    border: '1px solid #000',
    borderRadius: '4px',
    fontSize: '14px',
    marginBottom: '10px',
  },
  photosPreview: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
    marginTop: '10px',
  },
  photoItem: {
    position: 'relative',
    width: '150px',
    height: '150px',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    border: '1px solid #000',
    borderRadius: '4px',
  },
  removePhotoButton: {
    position: 'absolute',
    top: '5px',
    right: '5px',
    backgroundColor: '#d32f2f',
    color: '#fff',
    border: 'none',
    borderRadius: '50%',
    width: '24px',
    height: '24px',
    cursor: 'pointer',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};

export default MeetingInput;
