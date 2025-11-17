import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUserCircle, FaCamera } from 'react-icons/fa';
import { authService } from '../services/authService';
import { httpClient } from '../api/httpClient';
import styles from './ProfilePage.module.css';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  // Consultant-specific fields
  const [consultantProfile, setConsultantProfile] = useState<any>(null);
  const [consultantData, setConsultantData] = useState({
    title: '',
    bio: '',
    specialization: [] as string[],
    hourlyRate: '',
    experience: '',
    skills: [] as string[],
  });
  const [newSkill, setNewSkill] = useState('');
  const [newSpecialization, setNewSpecialization] = useState('');

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      setFormData({ name: user.name, email: user.email });
      if (user.profileImage) {
        setPreviewUrl(user.profileImage);
      }
      
      // Fetch consultant profile if user is a consultant
      if (user.accountType === 'consultant') {
        fetchConsultantProfile(user.id);
      }
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const fetchConsultantProfile = async (userId: string) => {
    try {
      const response = await httpClient.get(`/consultants/user/${userId}`);
      const myProfile = response.data?.data;
      
      if (myProfile) {
        console.log('Fetched consultant profile:', myProfile);
        setConsultantProfile(myProfile);
        setConsultantData({
          title: myProfile.title || '',
          bio: myProfile.bio || '',
          specialization: myProfile.specialization || [],
          hourlyRate: myProfile.hourlyRate?.toString() || '',
          experience: myProfile.experience || '',
          skills: myProfile.skills || [],
        });
      } else {
        console.log('No consultant profile found for user:', userId);
        // Reset to empty state if no profile exists
        setConsultantProfile(null);
        setConsultantData({
          title: '',
          bio: '',
          specialization: [],
          hourlyRate: '',
          experience: '',
          skills: [],
        });
      }
    } catch (err: any) {
      console.error('Failed to fetch consultant profile:', err);
      // If 404, it means no profile exists yet (which is fine)
      if (err.response?.status === 404) {
        setConsultantProfile(null);
        setConsultantData({
          title: '',
          bio: '',
          specialization: [],
          hourlyRate: '',
          experience: '',
          skills: [],
        });
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
    setSuccess('');
  };

  const handleConsultantInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setConsultantData(prev => ({ ...prev, [name]: value }));
    setError('');
    setSuccess('');
  };

  const addSkill = () => {
    if (newSkill.trim() && !consultantData.skills.includes(newSkill.trim())) {
      setConsultantData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setConsultantData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
  };

  const addSpecialization = () => {
    if (newSpecialization.trim() && !consultantData.specialization.includes(newSpecialization.trim())) {
      setConsultantData(prev => ({
        ...prev,
        specialization: [...prev.specialization, newSpecialization.trim()]
      }));
      setNewSpecialization('');
    }
  };

  const removeSpecialization = (spec: string) => {
    setConsultantData(prev => ({
      ...prev,
      specialization: prev.specialization.filter(s => s !== spec)
    }));
  };

  const compressImage = (file: File, callback: (base64: string) => void) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Resize if too large (max 800px width)
        if (width > 800) {
          height = (height * 800) / width;
          width = 800;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          callback(canvas.toDataURL('image/jpeg', 0.7)); // 70% quality
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }

      setProfileImage(file);
      compressImage(file, (compressedBase64) => {
        setPreviewUrl(compressedBase64);
      });
      setError('');
      setSuccess('');
    }
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const updates: any = {};

      // Update name if changed
      if (formData.name !== currentUser.name) {
        updates.name = formData.name;
      }

      // Update email if changed
      if (formData.email !== currentUser.email) {
        updates.email = formData.email;
      }

      // Handle image upload if changed
      if (profileImage) {
        // Convert image to base64
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            updates.profileImage = reader.result as string;
            
            // Send update to backend
            await httpClient.patch('/users/me', updates);
            
            // Update consultant profile if user is consultant
            if (currentUser.accountType === 'consultant') {
              await saveConsultantProfile();
            }
            
            // Update localStorage
            const updatedUser = { ...currentUser, ...updates };
            localStorage.setItem('expert_raah_user', JSON.stringify(updatedUser));
            setCurrentUser(updatedUser);
            
            setSuccess('Profile updated successfully!');
            setProfileImage(null);
            setLoading(false);
            setTimeout(() => setSuccess(''), 3000);
          } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to update profile');
            setLoading(false);
          }
        };
        reader.readAsDataURL(profileImage);
        return;
      } else {
        // Send user update to backend if there are changes
        if (Object.keys(updates).length > 0) {
          await httpClient.patch('/users/me', updates);
          
          // Update localStorage
          const updatedUser = { ...currentUser, ...updates };
          localStorage.setItem('expert_raah_user', JSON.stringify(updatedUser));
          setCurrentUser(updatedUser);
        }

        // Update consultant profile if user is consultant
        if (currentUser.accountType === 'consultant') {
          await saveConsultantProfile();
        }
        
        setSuccess('Profile updated successfully!');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const saveConsultantProfile = async () => {
    // Validate consultant data
    if (!consultantData.title.trim()) {
      throw new Error('Professional title is required');
    }
    if (!consultantData.bio.trim()) {
      throw new Error('Bio/description is required');
    }
    if (consultantData.specialization.length === 0) {
      throw new Error('At least one specialization is required');
    }
    if (!consultantData.hourlyRate || Number(consultantData.hourlyRate) <= 0) {
      throw new Error('Valid hourly rate is required');
    }
    if (!consultantData.experience.trim()) {
      throw new Error('Experience is required');
    }

    const consultantPayload = {
      userId: currentUser.id, // Add userId to the payload
      title: consultantData.title,
      bio: consultantData.bio,
      specialization: consultantData.specialization,
      hourlyRate: Number(consultantData.hourlyRate),
      experience: consultantData.experience,
      skills: consultantData.skills,
    };

    if (consultantProfile) {
      // Update existing profile (don't send userId for updates)
      const { userId, ...updatePayload } = consultantPayload;
      await httpClient.patch(`/consultants/${consultantProfile._id}`, updatePayload);
    } else {
      // Create new profile (include userId)
      await httpClient.post('/consultants', consultantPayload);
      if (currentUser?.id) {
        await fetchConsultantProfile(currentUser.id); // Refresh to get the created profile
      }
    }
  };

  if (!currentUser) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>Account Settings</h1>
          <button className={styles.backButton} onClick={() => navigate(-1)}>
            ← Back to Dashboard
          </button>
        </div>

        {/* Main Content Grid */}
        <div className={styles.mainContent}>
          {/* Sidebar */}
          <div className={styles.sidebar}>
            <div className={styles.profileCard}>
              <div className={styles.profileImageContainer}>
                {previewUrl ? (
                  <img src={previewUrl} alt="Profile" className={styles.profileImage} />
                ) : (
                  <FaUserCircle className={styles.defaultIcon} />
                )}
                <label className={styles.uploadLabel} title="Click to change profile picture">
                  <FaCamera className={styles.cameraIcon} />
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageChange}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
              <h3 className={styles.userName}>{currentUser.name}</h3>
              <p className={styles.userEmail}>{currentUser.email}</p>
            </div>
          </div>

          {/* Main Content */}
          <div className={styles.content}>
            {/* Messages */}
            {(success || error) && (
              <div className={styles.messages}>
                {success && <div className={styles.successMessage}>{success}</div>}
                {error && <div className={styles.errorMessage}>{error}</div>}
              </div>
            )}

            {/* Personal Information Card */}
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Personal Information</h2>
              <div className={styles.formGroup}>
                <label className={styles.label}>Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={styles.input}
                  placeholder="Enter your full name"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={styles.input}
                  placeholder="Enter your email address"
                />
              </div>
            </div>

            {/* Consultant Professional Profile - Only for consultants */}
            {currentUser.accountType === 'consultant' && (
              <>
                {!consultantProfile && (
                  <div className={styles.infoCard}>
                    <h3 className={styles.infoTitle}>📝 Complete Your Professional Profile</h3>
                    <p className={styles.infoText}>
                      To submit proposals and attract clients, please complete your professional profile below. 
                      All fields marked with * are required.
                    </p>
                  </div>
                )}
                
                <div className={styles.card}>
                  <h2 className={styles.cardTitle}>Professional Profile</h2>
                  <p className={styles.cardSubtitle}>Build your consultant portfolio to attract clients</p>
                  
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Professional Title *</label>
                    <input
                      type="text"
                      name="title"
                      value={consultantData.title}
                      onChange={handleConsultantInputChange}
                      className={styles.input}
                      placeholder="e.g., Senior Legal Consultant, Business Strategy Expert"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Professional Bio / Description *</label>
                    <textarea
                      name="bio"
                      value={consultantData.bio}
                      onChange={handleConsultantInputChange}
                      className={styles.textarea}
                      rows={6}
                      placeholder="Write a compelling description of your expertise, experience, and what makes you unique..."
                    />
                    <span className={styles.hint}>
                      {consultantData.bio.length} characters (Recommended: 200-500 characters)
                    </span>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Specialization / Areas of Expertise *</label>
                    <div className={styles.tagInput}>
                      <input
                        type="text"
                        value={newSpecialization}
                        onChange={(e) => setNewSpecialization(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecialization())}
                        className={styles.input}
                        placeholder="e.g., Education, Business, Legal"
                      />
                      <button 
                        type="button" 
                        onClick={addSpecialization}
                        className={styles.addButton}
                      >
                        Add
                      </button>
                    </div>
                    <div className={styles.tagList}>
                      {consultantData.specialization.map((spec) => (
                        <span key={spec} className={styles.tag}>
                          {spec}
                          <button 
                            type="button" 
                            onClick={() => removeSpecialization(spec)}
                            className={styles.tagRemove}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Years of Experience *</label>
                    <input
                      type="text"
                      name="experience"
                      value={consultantData.experience}
                      onChange={handleConsultantInputChange}
                      className={styles.input}
                      placeholder="e.g., 10 years, 5+ years"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Hourly Rate (PKR) *</label>
                    <input
                      type="number"
                      name="hourlyRate"
                      value={consultantData.hourlyRate}
                      onChange={handleConsultantInputChange}
                      className={styles.input}
                      placeholder="e.g., 5000"
                      min="0"
                    />
                  </div>
                </div>

                <div className={styles.card}>
                  <h2 className={styles.cardTitle}>Skills & Expertise</h2>
                  <p className={styles.cardSubtitle}>Add relevant skills to showcase your capabilities</p>
                  
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Skills</label>
                    <div className={styles.tagInput}>
                      <input
                        type="text"
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                        className={styles.input}
                        placeholder="e.g., Contract Law, Market Research, Curriculum Design"
                      />
                      <button 
                        type="button" 
                        onClick={addSkill}
                        className={styles.addButton}
                      >
                        Add Skill
                      </button>
                    </div>
                    <div className={styles.tagList}>
                      {consultantData.skills.map((skill) => (
                        <span key={skill} className={styles.tag}>
                          {skill}
                          <button 
                            type="button" 
                            onClick={() => removeSkill(skill)}
                            className={styles.tagRemove}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Save All Changes Button - Single button for entire profile */}
            <div className={styles.saveAllSection}>
              <div className={styles.actions}>
                <button 
                  type="button" 
                  className={styles.cancelButton}
                  onClick={() => navigate(-1)}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={handleSubmit}
                  className={styles.saveButton}
                  disabled={loading}
                >
                  {loading ? 'Saving Changes...' : 'Save All Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

