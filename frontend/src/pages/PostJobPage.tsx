import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaRobot, FaMagic, FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import { authService } from '../services/authService';
import { httpClient } from '../api/httpClient';
import styles from './PostJobPage.module.css';

interface JobFormData {
  category: string;
  title: string;
  description: string;
  skills: string[];
  budget: string;
  timeline: string;
  location: string;
  attachments: File[];
}

const PostJobPage = () => {
  const navigate = useNavigate();
  const { jobId } = useParams();
  const isEditMode = Boolean(jobId);
  const [step, setStep] = useState(1);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [jobData, setJobData] = useState<JobFormData>({
    category: '',
    title: '',
    description: '',
    skills: [],
    budget: '',
    timeline: '',
    location: '',
    attachments: []
  });

  const categories = ['Education', 'Business', 'Legal'];

  useEffect(() => {
    const loadJobForEdit = async () => {
      if (!isEditMode || !jobId) return;
      try {
        const response = await httpClient.get(`/jobs/${jobId}`);
        const job = response.data?.data;
        if (!job) return;

        // Map budget min/max back to range key
        let budgetRange = '';
        const min = job.budget?.min ?? 0;
        const max = job.budget?.max ?? 0;
        if (max === 10000) budgetRange = 'lt-10000';
        else if (min === 10000 && max === 50000) budgetRange = '10000-50000';
        else if (min === 50000 && max === 100000) budgetRange = '50000-100000';
        else if (min === 100000 && max === 200000) budgetRange = '100000-200000';
        else if (min === 200000) budgetRange = '200000+';

        // Map location string back to select value
        const locationValueMap: Record<string, string> = {
          'Rawalpindi, Pakistan': 'rawalpindi',
          'Islamabad, Pakistan': 'islamabad',
          'Lahore, Pakistan': 'lahore',
          'Karachi, Pakistan': 'karachi',
        };

        setJobData({
          category: job.category,
          title: job.title,
          description: job.description,
          skills: job.skills || [],
          budget: budgetRange,
          timeline: job.timeline,
          location: locationValueMap[job.location] || '',
          attachments: [],
        });
      } catch (error) {
        console.error('Failed to load job for editing', error);
        setSubmitError('Failed to load job for editing. Please try again.');
      }
    };

    loadJobForEdit();
  }, [isEditMode, jobId]);

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handlePrevious = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleAIEnhance = () => {
    // Simulate AI enhancement
    const enhancedDescription = jobData.description + '\n\n[AI Enhanced] This description has been optimized for better clarity and professionalism.';
    setJobData({ ...jobData, description: enhancedDescription });
    setShowAIAssistant(false);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmit = async () => {
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        navigate('/login');
        return;
      }

      // Basic required-field validation
      if (
        !jobData.category ||
        !jobData.title.trim() ||
        !jobData.description.trim() ||
        !jobData.location ||
        !jobData.budget ||
        !jobData.timeline
      ) {
        setSubmitError('Please complete all required fields (category, title, description, location, budget, timeline) before posting the job.');
        return;
      }

      // Map budget range to numeric min/max in PKR
      let budgetMin = 0;
      let budgetMax = 0;

      switch (jobData.budget) {
        case 'lt-10000':
          budgetMin = 0;
          budgetMax = 10000;
          break;
        case '10000-50000':
          budgetMin = 10000;
          budgetMax = 50000;
          break;
        case '50000-100000':
          budgetMin = 50000;
          budgetMax = 100000;
          break;
        case '100000-200000':
          budgetMin = 100000;
          budgetMax = 200000;
          break;
        case '200000+':
          budgetMin = 200000;
          budgetMax = 500000; // upper bound just for storage
          break;
        default:
          budgetMin = 0;
          budgetMax = 0;
      }

      // Map location value to full label
      const locationMap: Record<string, string> = {
        rawalpindi: 'Rawalpindi, Pakistan',
        islamabad: 'Islamabad, Pakistan',
        lahore: 'Lahore, Pakistan',
        karachi: 'Karachi, Pakistan',
      };

      // Convert files to base64
      const attachmentsBase64: string[] = [];
      if (jobData.attachments && jobData.attachments.length > 0) {
        for (const file of jobData.attachments) {
          try {
            const base64 = await fileToBase64(file);
            attachmentsBase64.push(base64);
          } catch (error) {
            console.error(`Failed to convert file ${file.name} to base64`, error);
            setSubmitError(`Failed to process file: ${file.name}`);
            return;
          }
        }
      }

      const payload = {
        category: jobData.category,
        title: jobData.title,
        description: jobData.description,
        budget: {
          min: budgetMin,
          max: budgetMax,
        },
        timeline: jobData.timeline,
        location: locationMap[jobData.location] || jobData.location,
        skills: jobData.skills,
        attachments: attachmentsBase64,
      };

      if (isEditMode && jobId) {
        await httpClient.put(`/jobs/${jobId}`, payload);
      } else {
        await httpClient.post('/jobs', payload);
      }

      setSubmitError('');
      navigate('/buyer-dashboard');
    } catch (error) {
      console.error('Failed to post job', error);
      setSubmitError('Failed to post job. Please try again.');
    }
  };

  return (
    <div className={styles.pageContainer}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.logo}>
          <span className={styles.logoText}>EXPERT RAAH</span>
        </div>
        <button className={styles.closeButton} onClick={() => navigate('/buyer-dashboard')}>
          ✕
        </button>
      </header>

      <div className={styles.content}>
        {/* Progress Steps */}
        <div className={styles.progressBar}>
          <div className={styles.stepIndicators}>
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className={styles.stepIndicator}>
                <div className={`${styles.stepCircle} ${step >= s ? styles.stepCircleActive : ''}`}>
                  {s}
                </div>
                <span className={styles.stepLabel}>
                  {s === 1 && 'Category'}
                  {s === 2 && 'Details'}
                  {s === 3 && 'Requirements'}
                  {s === 4 && 'Review'}
                </span>
                {s < 4 && <div className={`${styles.stepLine} ${step > s ? styles.stepLineActive : ''}`} />}
              </div>
            ))}
          </div>
        </div>

        {/* Main Form */}
        <div className={styles.formContainer}>
          <div className={styles.formCard}>
            {/* Step 1: Category Selection */}
            {step === 1 && (
              <div className={styles.stepContent}>
                <h2 className={styles.stepTitle}>What type of consultant do you need?</h2>
                <p className={styles.stepSubtitle}>Select the category that best matches your needs</p>

                <div className={styles.categoryGrid}>
                  {categories.map((category) => (
                    <button
                      key={category}
                      className={`${styles.categoryCard} ${jobData.category === category ? styles.categoryCardActive : ''}`}
                      onClick={() => setJobData({ ...jobData, category })}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Job Details */}
            {step === 2 && (
              <div className={styles.stepContent}>
                <h2 className={styles.stepTitle}>Tell us about your project</h2>
                <p className={styles.stepSubtitle}>Provide details to help consultants understand your needs</p>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Job Title *</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="e.g., Legal Consultant for Contract Review"
                    value={jobData.title}
                    onChange={(e) => setJobData({ ...jobData, title: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <div className={styles.labelWithAI}>
                    <label className={styles.label}>Job Description *</label>
                    <button
                      className={styles.aiButton}
                      onClick={() => setShowAIAssistant(!showAIAssistant)}
                    >
                      <FaRobot /> AI Assistant
                    </button>
                  </div>
                  <textarea
                    className={styles.textarea}
                    rows={8}
                    placeholder="Describe your project, goals, and what you're looking for in a consultant..."
                    value={jobData.description}
                    onChange={(e) => setJobData({ ...jobData, description: e.target.value })}
                  />

                  {showAIAssistant && (
                    <div className={styles.aiAssistant}>
                      <div className={styles.aiHeader}>
                        <FaRobot className={styles.aiIcon} />
                        <span>AI Writing Assistant</span>
                      </div>
                      <p className={styles.aiText}>
                        I can help enhance your job description to make it more professional and attractive to top consultants.
                      </p>
                      <div className={styles.aiSuggestions}>
                        <button className={styles.aiSuggestionButton} onClick={handleAIEnhance}>
                          <FaMagic /> Enhance Description
                        </button>
                        <button className={styles.aiSuggestionButton}>
                          <FaMagic /> Add Key Points
                        </button>
                        <button className={styles.aiSuggestionButton}>
                          <FaMagic /> Improve Clarity
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Location</label>
                  <select
                    className={styles.select}
                    value={jobData.location}
                    onChange={(e) => setJobData({ ...jobData, location: e.target.value })}
                  >
                    <option value="">Select location</option>
                    <option value="rawalpindi">Rawalpindi</option>
                    <option value="islamabad">Islamabad</option>
                    <option value="lahore">Lahore</option>
                    <option value="karachi">Karachi</option>
                  </select>
                </div>
              </div>
            )}

            {/* Step 3: Requirements */}
            {step === 3 && (
              <div className={styles.stepContent}>
                <h2 className={styles.stepTitle}>Project requirements</h2>
                <p className={styles.stepSubtitle}>Specify timeline and budget for your project</p>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Required Skills</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="e.g., Contract Law, Business Strategy (comma separated)"
                    onChange={(e) => setJobData({ ...jobData, skills: e.target.value.split(',') })}
                  />
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Budget Range</label>
                    <select
                      className={styles.select}
                      value={jobData.budget}
                      onChange={(e) => setJobData({ ...jobData, budget: e.target.value })}
                    >
                      <option value="">Select budget</option>
                      <option value="lt-10000">Less than Rs 10,000</option>
                      <option value="10000-50000">Rs 10,000 - Rs 50,000</option>
                      <option value="50000-100000">Rs 50,000 - Rs 100,000</option>
                      <option value="100000-200000">Rs 100,000 - Rs 200,000</option>
                      <option value="200000+">Rs 200,000+</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Project Timeline</label>
                    <select
                      className={styles.select}
                      value={jobData.timeline}
                      onChange={(e) => setJobData({ ...jobData, timeline: e.target.value })}
                    >
                      <option value="">Select timeline</option>
                      <option value="less-than-1-week">Less than 1 week</option>
                      <option value="1-2-weeks">1-2 weeks</option>
                      <option value="2-4-weeks">2-4 weeks</option>
                      <option value="1-3-months">1-3 months</option>
                      <option value="3-6-months">3-6 months</option>
                      <option value="6-months+">6+ months</option>
                    </select>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Attachments (Optional)</label>
                  <div className={styles.fileUpload}>
                    <input
                      type="file"
                      id="attachments"
                      multiple
                      className={styles.fileInput}
                      onChange={(e) => {
                        if (e.target.files) {
                          setJobData({ ...jobData, attachments: Array.from(e.target.files) });
                        }
                      }}
                    />
                    <label htmlFor="attachments" className={styles.fileLabel}>
                      📎 Upload Documents
                    </label>
                  </div>
                  
                  {/* Display uploaded files */}
                  {jobData.attachments && jobData.attachments.length > 0 && (
                    <div className={styles.uploadedFilesList}>
                      <p className={styles.uploadedFilesTitle}>Selected Files:</p>
                      <ul className={styles.filesList}>
                        {jobData.attachments.map((file, index) => (
                          <li key={index} className={styles.fileItem}>
                            <span className={styles.fileName}>{file.name}</span>
                            <span className={styles.fileSize}>
                              ({(file.size / 1024).toFixed(2)} KB)
                            </span>
                            <button
                              type="button"
                              className={styles.removeFileButton}
                              onClick={() => {
                                setJobData({
                                  ...jobData,
                                  attachments: jobData.attachments.filter((_, i) => i !== index),
                                });
                              }}
                            >
                              ✕
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 4: Review */}
            {step === 4 && (
              <div className={styles.stepContent}>
                <h2 className={styles.stepTitle}>
                  {isEditMode ? 'Review your job updates' : 'Review your job posting'}
                </h2>
                <p className={styles.stepSubtitle}>Make sure everything looks good before posting</p>

                {submitError && (
                  <p className={styles.errorText}>{submitError}</p>
                )}

                <div className={styles.reviewCard}>
                  <div className={styles.reviewItem}>
                    <span className={styles.reviewLabel}>Category:</span>
                    <span className={styles.reviewValue}>{jobData.category}</span>
                  </div>
                  <div className={styles.reviewItem}>
                    <span className={styles.reviewLabel}>Title:</span>
                    <span className={styles.reviewValue}>{jobData.title}</span>
                  </div>
                  <div className={styles.reviewItem}>
                    <span className={styles.reviewLabel}>Description:</span>
                    <p className={styles.reviewDescription}>{jobData.description}</p>
                  </div>
                  <div className={styles.reviewItem}>
                    <span className={styles.reviewLabel}>Location:</span>
                    <span className={styles.reviewValue}>{jobData.location || 'Not specified'}</span>
                  </div>
                  <div className={styles.reviewItem}>
                    <span className={styles.reviewLabel}>Budget:</span>
                    <span className={styles.reviewValue}>{jobData.budget || 'Not specified'}</span>
                  </div>
                  <div className={styles.reviewItem}>
                    <span className={styles.reviewLabel}>Timeline:</span>
                    <span className={styles.reviewValue}>{jobData.timeline || 'Not specified'}</span>
                  </div>
                  
                  {/* Display attachments in review */}
                  {jobData.attachments && jobData.attachments.length > 0 && (
                    <div className={styles.reviewItem}>
                      <span className={styles.reviewLabel}>Attachments:</span>
                      <div className={styles.reviewAttachments}>
                        {jobData.attachments.map((file, index) => (
                          <div key={index} className={styles.attachmentItem}>
                            <span className={styles.attachmentName}>{file.name}</span>
                            <span className={styles.attachmentSize}>
                              ({(file.size / 1024).toFixed(2)} KB)
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className={styles.navigationButtons}>
              {step > 1 && (
                <button className={styles.backButton} onClick={handlePrevious}>
                  <FaArrowLeft /> Previous
                </button>
              )}
              {step < 4 ? (
                <button className={styles.nextButton} onClick={handleNext}>
                  Next <FaArrowRight />
                </button>
              ) : (
                <button className={styles.submitButton} onClick={handleSubmit}>
                  {isEditMode ? 'Update Job' : 'Post Job'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostJobPage;

