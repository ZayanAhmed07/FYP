import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaIdCard, FaUpload, FaTimesCircle, FaUser, FaBriefcase, FaDollarSign, FaClock } from 'react-icons/fa';
import { authService } from '../services/authService';
import { httpClient } from '../api/httpClient';
import styles from './VerifyIdentityPage.module.css';

const VerifyIdentityPage = () => {
  const [frontIdImage, setFrontIdImage] = useState<File | null>(null);
  const [backIdImage, setBackIdImage] = useState<File | null>(null);
  const [supportingDocs, setSupportingDocs] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Profile fields
  const [profileData, setProfileData] = useState({
    title: '',
    bio: '',
    specialization: [] as string[],
    hourlyRate: '',
    experience: '',
    skills: [] as string[],
    city: '',
  });
  const [selectedSpecialization, setSelectedSpecialization] = useState('');
  const [newSkill, setNewSkill] = useState('');
  
  const specializationOptions = [
    'LEGAL',
    'EDUCATION',
    'BUSINESS',
  ];
  
  const navigate = useNavigate();

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    side: 'front' | 'back' | 'supporting'
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (side === 'front') {
      setFrontIdImage(files[0]);
    } else if (side === 'back') {
      setBackIdImage(files[0]);
    } else if (side === 'supporting') {
      setSupportingDocs([...supportingDocs, ...Array.from(files)]);
    }
  };

  const handleRemoveSupportingDoc = (index: number) => {
    setSupportingDocs(supportingDocs.filter((_, i) => i !== index));
  };

  const handleAddSpecialization = () => {
    if (selectedSpecialization && !profileData.specialization.includes(selectedSpecialization)) {
      setProfileData({
        ...profileData,
        specialization: [...profileData.specialization, selectedSpecialization],
      });
      setSelectedSpecialization('');
    }
  };

  const handleRemoveSpecialization = (spec: string) => {
    setProfileData({
      ...profileData,
      specialization: profileData.specialization.filter(s => s !== spec),
    });
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !profileData.skills.includes(newSkill.trim())) {
      setProfileData({
        ...profileData,
        skills: [...profileData.skills, newSkill.trim()],
      });
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setProfileData({
      ...profileData,
      skills: profileData.skills.filter(s => s !== skill),
    });
  };

  const handleVerify = async () => {
    setError('');
    
    // Validation
    if (!frontIdImage || !backIdImage) {
      setError('Please upload both sides of your CNIC');
      return;
    }
    
    if (!profileData.title || !profileData.bio || !profileData.hourlyRate || !profileData.experience || !profileData.city) {
      setError('Please fill all required profile fields including city');
      return;
    }
    
    if (profileData.specialization.length === 0) {
      setError('Please add at least one specialization');
      return;
    }
    
    if (profileData.skills.length === 0) {
      setError('Please add at least one skill');
      return;
    }

    setLoading(true);
    
    try {
      // Convert files to base64
      const toBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = error => reject(error);
        });
      };

      const frontIdBase64 = await toBase64(frontIdImage);
      const backIdBase64 = await toBase64(backIdImage);
      const supportingDocsBase64 = await Promise.all(
        supportingDocs.map(doc => toBase64(doc))
      );

      const payload = {
        title: profileData.title,
        bio: profileData.bio,
        hourlyRate: Number(profileData.hourlyRate),
        experience: profileData.experience,
        specialization: profileData.specialization,
        skills: profileData.skills,
        city: profileData.city,
        idCardFront: frontIdBase64,
        idCardBack: backIdBase64,
        supportingDocuments: supportingDocsBase64,
      };

      await httpClient.post('/consultants/verify-profile', payload);

      // Navigate to pending approval page
      navigate('/verification-pending');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit profile for verification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.leftPanel}>
        <div className={styles.content}>
          <h1 className={styles.title}>
            Step Into<br />Expert Raah
          </h1>
          <p className={styles.subtitle}>
            Join our platform to connect with clients seeking expert guidance in Education, Business, and Legal consultancy.
          </p>
          <button className={styles.backButton} onClick={() => navigate(-1)}>
            <span className={styles.backArrow}>←</span>
          </button>
        </div>
      </div>

      <div className={styles.rightPanel}>
        <div className={styles.formCard}>
          <h2 className={styles.welcomeTitle}>Verify Your Identity</h2>
          <p className={styles.welcomeSubtitle}>Complete your consultant profile to help clients find the right expertise in Education, Business, or Legal services.</p>

          <div className={styles.uploadSection}>
            {/* Front Side Upload */}
            <div className={styles.uploadCard}>
              <input
                type="file"
                id="frontId"
                accept="image/jpeg,image/png,image/jpg,application/pdf"
                onChange={(e) => handleFileUpload(e, 'front')}
                className={styles.fileInput}
              />
              <label htmlFor="frontId" className={styles.uploadLabel}>
                <div className={styles.uploadIcon}>
                  <FaIdCard />
                </div>
                <p className={styles.uploadText}>
                  {frontIdImage ? frontIdImage.name : 'Upload'}
                </p>
              </label>
              <p className={styles.uploadCaption}>Front Side of your Identity Card</p>
            </div>

            {/* Back Side Upload */}
            <div className={styles.uploadCard}>
              <input
                type="file"
                id="backId"
                accept="image/jpeg,image/png,image/jpg,application/pdf"
                onChange={(e) => handleFileUpload(e, 'back')}
                className={styles.fileInput}
              />
              <label htmlFor="backId" className={styles.uploadLabel}>
                <div className={styles.uploadIcon}>
                  <FaIdCard />
                </div>
                <p className={styles.uploadText}>
                  {backIdImage ? backIdImage.name : 'Upload'}
                </p>
              </label>
              <p className={styles.uploadCaption}>Back Side of your Identity Card</p>
            </div>
          </div>

          {/* Instructions */}
          <div className={styles.instructions}>
            <h3 className={styles.instructionsTitle}>Instructions</h3>
            <ul className={styles.instructionsList}>
              <li>Upload a clear image of your ID card's front side.</li>
              <li>Upload the back side of your ID card for complete verification.</li>
              <li>Ensure all details are visible and not blurred.</li>
              <li>Accepted formats: JPG, PNG, or PDF (max size: 5MB).</li>
            </ul>
          </div>

          {/* Profile Information Section */}
          <div className={styles.profileSection}>
            <h3 className={styles.sectionTitle}>
              <FaUser className={styles.sectionIcon} />
              Professional Profile
            </h3>

            {/* Title */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Professional Title *</label>
              <input
                type="text"
                value={profileData.title}
                onChange={(e) => setProfileData({ ...profileData, title: e.target.value })}
                placeholder="e.g., Corporate Law Specialist, MBA Career Advisor, Business Strategy Consultant"
                className={styles.input}
              />
            </div>

            {/* Bio */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Bio *</label>
              <textarea
                value={profileData.bio}
                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                placeholder="Describe your expertise in Education, Business, or Legal consultancy, your qualifications, and how you help clients achieve their goals..."
                className={styles.textarea}
                rows={4}
              />
            </div>

            {/* Specialization */}
            <div className={styles.formGroup}>
              <label className={styles.label}>
                <FaBriefcase className={styles.labelIcon} />
                Specialization *
              </label>
              <div className={styles.tagInputContainer}>
                <select
                  value={selectedSpecialization}
                  onChange={(e) => setSelectedSpecialization(e.target.value)}
                  className={styles.input}
                >
                  <option value="">Select a specialization</option>
                  {specializationOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleAddSpecialization}
                  className={styles.addButton}
                  disabled={!selectedSpecialization}
                >
                  Add
                </button>
              </div>
              <div className={styles.tagsList}>
                {profileData.specialization.map((spec, index) => (
                  <span key={index} className={styles.tag}>
                    {spec}
                    <FaTimesCircle
                      className={styles.tagRemove}
                      onClick={() => handleRemoveSpecialization(spec)}
                    />
                  </span>
                ))}
              </div>
            </div>

            {/* Hourly Rate */}
            <div className={styles.formGroup}>
              <label className={styles.label}>
                <FaDollarSign className={styles.labelIcon} />
                Hourly Rate (PKR) *
              </label>
              <input
                type="number"
                value={profileData.hourlyRate}
                onChange={(e) => setProfileData({ ...profileData, hourlyRate: e.target.value })}
                placeholder="e.g., 2000"
                className={styles.input}
                min="0"
              />
            </div>

            {/* Experience */}
            <div className={styles.formGroup}>
              <label className={styles.label}>
                <FaClock className={styles.labelIcon} />
                Years of Experience *
              </label>
              <input
                type="text"
                value={profileData.experience}
                onChange={(e) => setProfileData({ ...profileData, experience: e.target.value })}
                placeholder="e.g., 5+ years"
                className={styles.input}
              />
            </div>

            {/* City */}
            <div className={styles.formGroup}>
              <label className={styles.label}>City *</label>
              <select
                value={profileData.city}
                onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                className={styles.input}
              >
                <option value="">Select your city</option>
                <option value="Rawalpindi">Rawalpindi</option>
                <option value="Islamabad">Islamabad</option>
                <option value="Lahore">Lahore</option>
                <option value="Karachi">Karachi</option>
              </select>
            </div>

            {/* Skills */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Skills *</label>
              <div className={styles.tagInputContainer}>
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                  placeholder="e.g., Contract Drafting, Educational Planning, Financial Analysis"
                  className={styles.input}
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className={styles.addButton}
                >
                  Add
                </button>
              </div>
              <div className={styles.tagsList}>
                {profileData.skills.map((skill, index) => (
                  <span key={index} className={styles.tag}>
                    {skill}
                    <FaTimesCircle
                      className={styles.tagRemove}
                      onClick={() => handleRemoveSkill(skill)}
                    />
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Supporting Documents Section */}
          <div className={styles.supportingDocs}>
            <h3 className={styles.supportingDocsTitle}>Additional Supporting Documents</h3>
            <p className={styles.supportingDocsSubtitle}>
              Upload certificates, licenses, or other credentials (optional)
            </p>

            <div className={styles.supportingDocsUpload}>
              <input
                type="file"
                id="supportingDocs"
                accept="image/jpeg,image/png,image/jpg,application/pdf"
                multiple
                onChange={(e) => handleFileUpload(e, 'supporting')}
                className={styles.fileInput}
              />
              <label htmlFor="supportingDocs" className={styles.supportingUploadButton}>
                <FaUpload className={styles.uploadButtonIcon} />
                <span>Add Documents</span>
              </label>
            </div>

            {/* Display uploaded supporting documents */}
            {supportingDocs.length > 0 && (
              <div className={styles.uploadedDocsList}>
                {supportingDocs.map((doc, index) => (
                  <div key={index} className={styles.uploadedDocItem}>
                    <span className={styles.docName}>{doc.name}</span>
                    <button
                      className={styles.removeDocButton}
                      onClick={() => handleRemoveSupportingDoc(index)}
                      type="button"
                    >
                      <FaTimesCircle />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && <div className={styles.errorMessage}>{error}</div>}

          {/* Verify Button */}
          <button 
            className={styles.verifyButton} 
            onClick={handleVerify}
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Submit for Verification'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyIdentityPage;

