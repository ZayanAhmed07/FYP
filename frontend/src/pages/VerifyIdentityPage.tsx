import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaIdCard, FaUpload, FaTimesCircle } from 'react-icons/fa';
import styles from './VerifyIdentityPage.module.css';

const VerifyIdentityPage = () => {
  const [frontIdImage, setFrontIdImage] = useState<File | null>(null);
  const [backIdImage, setBackIdImage] = useState<File | null>(null);
  const [supportingDocs, setSupportingDocs] = useState<File[]>([]);
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

  const handleVerify = () => {
    if (!frontIdImage || !backIdImage) {
      alert('Please upload both sides of your ID card');
      return;
    }

    console.log('Verifying identity...', {
      frontIdImage,
      backIdImage,
      supportingDocs,
    });

    // Handle verification logic here
    // Navigate to consultant dashboard after verification
    navigate('/consultant-dashboard');
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.leftPanel}>
        <div className={styles.content}>
          <h1 className={styles.title}>
            Step Into<br />Expert Raah
          </h1>
          <p className={styles.subtitle}>
            Join or log in to experience a secure, professional platform built for meaningful client–consultant connections.
          </p>
          <button className={styles.backButton} onClick={() => navigate(-1)}>
            <span className={styles.backArrow}>←</span>
          </button>
        </div>
      </div>

      <div className={styles.rightPanel}>
        <div className={styles.formCard}>
          <h2 className={styles.welcomeTitle}>Verify Your Identity</h2>
          <p className={styles.welcomeSubtitle}>Simple verification for a safer experience.</p>

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

          {/* Verify Button */}
          <button className={styles.verifyButton} onClick={handleVerify}>
            Verify
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyIdentityPage;

