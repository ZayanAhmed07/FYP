import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaUserTie, FaCheckCircle, FaTimesCircle, FaBan, FaEye, FaFileAlt, FaUserCircle, FaStar, FaTrash } from 'react-icons/fa';
import { httpClient } from '../api/httpClient';
import { authService } from '../services/authService';
import reviewService from '../services/reviewService';
import styles from './AdminDashboardPage.module.css';

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'consultants' | 'buyers' | 'reviews'>('consultants');
  const [consultants, setConsultants] = useState<any[]>([]);
  const [buyers, setBuyers] = useState<any[]>([]);
  const [selectedConsultant, setSelectedConsultant] = useState<any>(null);
  const [showDocuments, setShowDocuments] = useState(false);
  const [loading, setLoading] = useState(false);
  const [buyersLoading, setBuyersLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Reviews state
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsTotalPages, setReviewsTotalPages] = useState(1);

  useEffect(() => {
    // Admin dashboard can be accessed without login
    fetchConsultants();
    fetchBuyers();
  }, []);

  useEffect(() => {
    if (activeTab === 'reviews') {
      fetchReviews();
    }
  }, [activeTab, reviewsPage]);

  const fetchConsultants = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await httpClient.get('/consultants');
      console.log('Consultants API Response:', response);
      
      // Handle both paginated and non-paginated responses
      let consultantsData = [];
      if (response.data?.data?.consultants) {
        // Paginated response
        consultantsData = response.data.data.consultants;
      } else if (response.data?.data) {
        // Direct array response
        consultantsData = Array.isArray(response.data.data) ? response.data.data : [];
      }
      
      console.log('Consultants Data:', consultantsData);
      
      // Transform data to match component structure
      const transformedConsultants = consultantsData.map((c: any) => ({
        id: c._id,
        name: c.userId?.name || 'Unknown',
        email: c.userId?.email || 'N/A',
        title: c.title || 'N/A',
        experience: c.experience || 'N/A',
        specialization: c.specialization || [],
        hourlyRate: c.hourlyRate || 0,
        isVerified: c.isVerified || false,
        status: c.isVerified ? 'approved' : 'pending',
        idCardFront: c.idCardFront,
        idCardBack: c.idCardBack,
        supportingDocs: c.supportingDocuments || [],
        avatar: c.userId?.profileImage || null,
        joinedDate: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'N/A',
        isBanned: c.userId?.isBanned || false,
        userId: c.userId?._id,
      }));
      
      console.log('Transformed Consultants:', transformedConsultants);
      setConsultants(transformedConsultants);
    } catch (err: any) {
      console.error('Failed to fetch consultants', err);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to load consultants';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const fetchBuyers = async () => {
    try {
      setBuyersLoading(true);
      const response = await httpClient.get('/admin/users');
      console.log('Users API Response:', response);
      
      // Handle paginated response
      let usersData = [];
      if (response.data?.data?.users) {
        // Paginated response
        usersData = response.data.data.users;
      } else if (response.data?.data) {
        // Direct array response
        usersData = Array.isArray(response.data.data) ? response.data.data : [];
      }
      
      console.log('All Users Data:', usersData);
      
      // Filter only buyers
      const buyersData = usersData.filter((u: any) => u.accountType === 'buyer');
      console.log('Buyers Data:', buyersData);
      
      // Get job counts for each buyer
      const transformedBuyers = await Promise.all(
        buyersData.map(async (b: any) => {
          try {
            const jobsResponse = await httpClient.get(`/jobs/buyer/${b._id}`);
            const jobs = jobsResponse.data?.data || [];
            
            return {
              id: b._id,
              name: b.name || 'Unknown',
              email: b.email || 'N/A',
              phone: b.phone || 'N/A',
              totalJobsPosted: jobs.length,
              totalSpent: 0, // Can be calculated from orders if needed
              avatar: b.profileImage || null,
              joinedDate: b.createdAt ? new Date(b.createdAt).toLocaleDateString() : 'N/A',
              isBanned: b.isBanned || false,
            };
          } catch (jobErr) {
            console.error(`Failed to fetch jobs for buyer ${b._id}`, jobErr);
            return {
              id: b._id,
              name: b.name || 'Unknown',
              email: b.email || 'N/A',
              phone: b.phone || 'N/A',
              totalJobsPosted: 0,
              totalSpent: 0,
              avatar: b.profileImage || null,
              joinedDate: b.createdAt ? new Date(b.createdAt).toLocaleDateString() : 'N/A',
              isBanned: b.isBanned || false,
            };
          }
        })
      );
      
      console.log('Transformed Buyers:', transformedBuyers);
      setBuyers(transformedBuyers);
    } catch (err: any) {
      console.error('Failed to fetch buyers', err);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to load buyers';
      // Don't set error state for buyers, just log it
      console.error('Buyers error:', errorMsg);
    } finally {
      setBuyersLoading(false);
    }
  };

  const handleApproveConsultant = async (id: string) => {
    try {
      await httpClient.patch(`/admin/consultants/${id}/verify`);
      alert('Consultant approved successfully!');
      setShowDocuments(false);
      setSelectedConsultant(null);
      await fetchConsultants(); // Refresh list
    } catch (err) {
      console.error('Failed to approve consultant', err);
      alert('Failed to approve consultant');
    }
  };

  const handleDeclineConsultant = async (id: string) => {
    try {
      await httpClient.patch(`/admin/consultants/${id}/decline`);
      alert('Consultant declined!');
      setShowDocuments(false);
      setSelectedConsultant(null);
      await fetchConsultants(); // Refresh list
    } catch (err) {
      console.error('Failed to decline consultant', err);
      alert('Failed to decline consultant');
    }
  };

  const handleBanConsultant = async (id: string, userId: string) => {
    if (confirm('Are you sure you want to ban this consultant?')) {
      try {
        await httpClient.patch(`/admin/users/${userId}/ban`);
        alert('Consultant banned successfully!');
        await fetchConsultants(); // Refresh list
      } catch (err) {
        console.error('Failed to ban consultant', err);
        alert('Failed to ban consultant');
      }
    }
  };

  const handleUnbanConsultant = async (id: string, userId: string) => {
    try {
      await httpClient.patch(`/admin/users/${userId}/unban`);
      alert('Consultant unbanned successfully!');
      await fetchConsultants(); // Refresh list
    } catch (err) {
      console.error('Failed to unban consultant', err);
      alert('Failed to unban consultant');
    }
  };

  const handleBanBuyer = async (id: string) => {
    if (confirm('Are you sure you want to ban this buyer?')) {
      try {
        await httpClient.patch(`/admin/users/${id}/ban`);
        alert('Buyer banned successfully!');
        await fetchBuyers(); // Refresh list
      } catch (err) {
        console.error('Failed to ban buyer', err);
        alert('Failed to ban buyer');
      }
    }
  };

  const handleUnbanBuyer = async (id: string) => {
    try {
      await httpClient.patch(`/admin/users/${id}/unban`);
      alert('Buyer unbanned successfully!');
      await fetchBuyers(); // Refresh list
    } catch (err) {
      console.error('Failed to unban buyer', err);
      alert('Failed to unban buyer');
    }
  };

  const fetchReviews = async () => {
    try {
      setReviewsLoading(true);
      const response = await reviewService.getAllReviews(reviewsPage, 20);
      setReviews(response.reviews);
      setReviewsTotalPages(response.pages);
    } catch (err) {
      console.error('Failed to fetch reviews', err);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (confirm('Are you sure you want to delete this review?')) {
      try {
        await reviewService.deleteReview(reviewId);
        alert('Review deleted successfully!');
        await fetchReviews(); // Refresh list
      } catch (err) {
        console.error('Failed to delete review', err);
        alert('Failed to delete review');
      }
    }
  };

  const pendingConsultants = consultants.filter(c => c.status === 'pending');
  const approvedConsultants = consultants.filter(c => c.status === 'approved');

  return (
    <div className={styles.pageContainer}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.logo}>
          <img src="/src/assets/logo.png" alt="Expert Raah" className={styles.logoImage} />
          <span className={styles.logoText}>Admin Panel</span>
        </div>

        <button className={styles.logoutButton} onClick={() => navigate('/')}>
          Logout
        </button>
      </header>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'consultants' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('consultants')}
          >
            <FaUserTie /> Consultants
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'buyers' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('buyers')}
          >
            <FaUser /> Buyers
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'reviews' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('reviews')}
          >
            <FaStar /> Reviews & Ratings
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
            <p>Loading data...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className={styles.errorContainer}>
            <p className={styles.errorText}>{error}</p>
            <button onClick={() => { fetchConsultants(); fetchBuyers(); }} className={styles.retryButton}>
              Retry
            </button>
          </div>
        )}

        {/* Consultants Tab */}
        {!loading && activeTab === 'consultants' && (
          <div className={styles.content}>
            {/* Empty State */}
            {consultants.length === 0 && (
              <div className={styles.emptyState}>
                <FaUserTie className={styles.emptyIcon} />
                <h3>No Consultants Yet</h3>
                <p>Consultants will appear here once they sign up and create their profiles.</p>
              </div>
            )}

            {/* Pending Approvals Section */}
            {pendingConsultants.length > 0 && (
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>
                  Awaiting Verification - {pendingConsultants.length} {pendingConsultants.length === 1 ? 'Consultant' : 'Consultants'}
                </h2>
                <div className={styles.cardGrid}>
                  {pendingConsultants.map((consultant) => (
                    <div key={consultant.id} className={styles.card}>
                      <div className={styles.cardHeader}>
                        {consultant.avatar ? (
                          <img src={consultant.avatar} alt={consultant.name} className={styles.avatar} />
                        ) : (
                          <FaUserCircle className={styles.avatar} style={{ fontSize: '60px', color: '#ccc' }} />
                        )}
                        <div className={styles.cardInfo}>
                          <h3 className={styles.cardName}>{consultant.name}</h3>
                          <p className={styles.cardTitle}>{consultant.title}</p>
                          <p className={styles.cardEmail}>{consultant.email}</p>
                        </div>
                        <span className={styles.badgePending}>Pending</span>
                      </div>

                      <div className={styles.cardBody}>
                        <div className={styles.infoRow}>
                          <span className={styles.label}>Experience:</span>
                          <span className={styles.value}>{consultant.experience}</span>
                        </div>
                        <div className={styles.infoRow}>
                          <span className={styles.label}>Hourly Rate:</span>
                          <span className={styles.value}>PKR{consultant.hourlyRate}/hr</span>
                        </div>
                        <div className={styles.infoRow}>
                          <span className={styles.label}>Specialization:</span>
                          <span className={styles.value}>{consultant.specialization.join(', ')}</span>
                        </div>
                      </div>

                      <div className={styles.cardActions}>
                        <button
                          className={styles.viewDocsButton}
                          onClick={() => {
                            setSelectedConsultant(consultant);
                            setShowDocuments(true);
                          }}
                        >
                          <FaFileAlt /> View Documents
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All Consultants Section */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>
                All Consultants
              </h2>
              <div className={styles.table}>
                <table>
                  <thead>
                    <tr>
                      <th>Consultant</th>
                      <th>Email</th>
                      <th>Title</th>
                      <th>Rate</th>
                      <th>Status</th>
                      <th>Joined</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {consultants.map((consultant) => (
                      <tr key={consultant.id} className={consultant.isBanned ? styles.banned : ''}>
                        <td>
                          <div className={styles.userCell}>
                            {consultant.avatar ? (
                              <img src={consultant.avatar} alt={consultant.name} className={styles.smallAvatar} />
                            ) : (
                              <FaUserCircle className={styles.smallAvatar} style={{ fontSize: '32px', color: '#ccc' }} />
                            )}
                            <span>{consultant.name}</span>
                          </div>
                        </td>
                        <td>{consultant.email}</td>
                        <td>{consultant.title}</td>
                        <td>PKR{consultant.hourlyRate}/hr</td>
                        <td>
                          {consultant.isBanned ? (
                            <span className={styles.badgeBanned}>Banned</span>
                          ) : consultant.isVerified ? (
                            <span className={styles.badgeVerified}>Verified</span>
                          ) : (
                            <span className={styles.badgePending}>Pending</span>
                          )}
                        </td>
                        <td>{consultant.joinedDate}</td>
                        <td>
                          <div className={styles.actionButtons}>
                            <button
                              className={styles.viewButton}
                              onClick={() => {
                                setSelectedConsultant(consultant);
                                setShowDocuments(true);
                              }}
                              title="View Details"
                            >
                              <FaEye />
                            </button>
                            {consultant.isBanned ? (
                              <button
                                className={styles.unbanButton}
                                onClick={() => handleUnbanConsultant(consultant.id, consultant.userId)}
                                title="Unban"
                              >
                                <FaCheckCircle />
                              </button>
                            ) : (
                              <button
                                className={styles.banButton}
                                onClick={() => handleBanConsultant(consultant.id, consultant.userId)}
                                title="Ban"
                              >
                                <FaBan />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Buyers Tab */}
        {activeTab === 'buyers' && (
          <div className={styles.content}>
            {/* Loading State for Buyers */}
            {buyersLoading && (
              <div className={styles.loadingContainer}>
                <div className={styles.loadingSpinner}></div>
                <p>Loading buyers...</p>
              </div>
            )}

            {/* Empty State */}
            {!buyersLoading && buyers.length === 0 && (
              <div className={styles.emptyState}>
                <FaUser className={styles.emptyIcon} />
                <h3>No Buyers Yet</h3>
                <p>Buyers will appear here once they sign up.</p>
              </div>
            )}

            {!buyersLoading && buyers.length > 0 && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>All Buyers</h2>
              <div className={styles.table}>
                <table>
                  <thead>
                    <tr>
                      <th>Buyer</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Jobs Posted</th>
                      <th>Total Spent</th>
                      <th>Joined</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {buyers.map((buyer) => (
                      <tr key={buyer.id} className={buyer.isBanned ? styles.banned : ''}>
                        <td>
                          <div className={styles.userCell}>
                            {buyer.avatar ? (
                              <img src={buyer.avatar} alt={buyer.name} className={styles.smallAvatar} />
                            ) : (
                              <FaUserCircle className={styles.smallAvatar} style={{ fontSize: '32px', color: '#ccc' }} />
                            )}
                            <span>{buyer.name}</span>
                          </div>
                        </td>
                        <td>{buyer.email}</td>
                        <td>{buyer.phone}</td>
                        <td>{buyer.totalJobsPosted}</td>
                        <td>${buyer.totalSpent.toLocaleString()}</td>
                        <td>{buyer.joinedDate}</td>
                        <td>
                          <div className={styles.actionButtons}>
                            {buyer.isBanned ? (
                              <>
                                <span className={styles.badgeBanned}>Banned</span>
                                <button
                                  className={styles.unbanButton}
                                  onClick={() => handleUnbanBuyer(buyer.id)}
                                  title="Unban"
                                >
                                  <FaCheckCircle />
                                </button>
                              </>
                            ) : (
                              <button
                                className={styles.banButton}
                                onClick={() => handleBanBuyer(buyer.id)}
                                title="Ban"
                              >
                                <FaBan />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            )}
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div className={styles.content}>
            {/* Loading State */}
            {reviewsLoading && (
              <div className={styles.loadingContainer}>
                <div className={styles.loadingSpinner}></div>
                <p>Loading reviews...</p>
              </div>
            )}

            {/* Empty State */}
            {!reviewsLoading && reviews.length === 0 && (
              <div className={styles.emptyState}>
                <FaStar className={styles.emptyIcon} />
                <h3>No Reviews Yet</h3>
                <p>Reviews will appear here once buyers submit them.</p>
              </div>
            )}

            {/* Reviews List */}
            {!reviewsLoading && reviews.length > 0 && (
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>All Reviews & Ratings</h2>
                <div className={styles.reviewsGrid}>
                  {reviews.map((review) => (
                    <div key={review._id} className={styles.reviewCard}>
                      <div className={styles.reviewHeader}>
                        <div className={styles.reviewRatingStars}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <FaStar
                              key={star}
                              className={star <= review.rating ? styles.starFilled : styles.starEmpty}
                            />
                          ))}
                          <span className={styles.reviewRatingNumber}>({review.rating}/5)</span>
                        </div>
                        <button
                          className={styles.deleteReviewButton}
                          onClick={() => handleDeleteReview(review._id)}
                          title="Delete Review"
                        >
                          <FaTrash />
                        </button>
                      </div>

                      <div className={styles.reviewContent}>
                        <p className={styles.reviewComment}>{review.comment}</p>
                      </div>

                      <div className={styles.reviewFooter}>
                        <div className={styles.reviewUser}>
                          <strong>Buyer:</strong> {review.buyerId?.firstName} {review.buyerId?.lastName}
                          <br />
                          <small>{review.buyerId?.email}</small>
                        </div>
                        <div className={styles.reviewConsultant}>
                          <strong>Consultant:</strong> {review.consultantId?.firstName} {review.consultantId?.lastName}
                          <br />
                          <small>{review.consultantId?.email}</small>
                        </div>
                        <div className={styles.reviewJob}>
                          <strong>Job:</strong> {review.jobId?.title || 'N/A'}
                        </div>
                        <div className={styles.reviewDate}>
                          {new Date(review.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {reviewsTotalPages > 1 && (
                  <div className={styles.pagination}>
                    <button
                      className={styles.paginationButton}
                      disabled={reviewsPage === 1}
                      onClick={() => setReviewsPage((prev) => prev - 1)}
                    >
                      Previous
                    </button>
                    <span className={styles.paginationInfo}>
                      Page {reviewsPage} of {reviewsTotalPages}
                    </span>
                    <button
                      className={styles.paginationButton}
                      disabled={reviewsPage === reviewsTotalPages}
                      onClick={() => setReviewsPage((prev) => prev + 1)}
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Documents Modal */}
      {showDocuments && selectedConsultant && (
        <>
          <div className={styles.overlay} onClick={() => {
            setShowDocuments(false);
            setSelectedConsultant(null);
          }}></div>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>Consultant Details & Documents</h2>
              <button
                className={styles.closeButton}
                onClick={() => {
                  setShowDocuments(false);
                  setSelectedConsultant(null);
                }}
              >
                ✕
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.consultantDetails}>
                {selectedConsultant.avatar ? (
                  <img src={selectedConsultant.avatar} alt={selectedConsultant.name} className={styles.largeAvatar} />
                ) : (
                  <FaUserCircle className={styles.largeAvatar} style={{ fontSize: '100px', color: '#ccc' }} />
                )}
                <div className={styles.detailsInfo}>
                  <h3>{selectedConsultant.name}</h3>
                  <p className={styles.detailTitle}>{selectedConsultant.title}</p>
                  <p className={styles.detailEmail}>{selectedConsultant.email}</p>
                  <div className={styles.detailsGrid}>
                    <div>
                      <span className={styles.detailLabel}>Experience:</span>
                      <span className={styles.detailValue}>{selectedConsultant.experience}</span>
                    </div>
                    <div>
                      <span className={styles.detailLabel}>Rate:</span>
                      <span className={styles.detailValue}>${selectedConsultant.hourlyRate}/hr</span>
                    </div>
                    <div>
                      <span className={styles.detailLabel}>Status:</span>
                      <span className={styles.detailValue}>{selectedConsultant.status}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.documentsSection}>
                <h3>Identity Documents</h3>
                <div className={styles.documentsGrid}>
                  {selectedConsultant.idCardFront && (
                    <div className={styles.docCard}>
                      <span className={styles.docLabel}>ID Card (Front)</span>
                      <div className={styles.docPreview}>
                        {selectedConsultant.idCardFront.startsWith('data:') ? (
                          <img 
                            src={selectedConsultant.idCardFront} 
                            alt="ID Card Front" 
                            className={styles.docImage}
                          />
                        ) : (
                          <>
                            <FaFileAlt className={styles.docIcon} />
                            <p>id-card-front.jpg</p>
                          </>
                        )}
                      </div>
                      {selectedConsultant.idCardFront.startsWith('data:') && (
                        <a 
                          href={selectedConsultant.idCardFront} 
                          download="id-card-front.jpg"
                          className={styles.downloadButton}
                        >
                          Download
                        </a>
                      )}
                    </div>
                  )}
                  {selectedConsultant.idCardBack && (
                    <div className={styles.docCard}>
                      <span className={styles.docLabel}>ID Card (Back)</span>
                      <div className={styles.docPreview}>
                        {selectedConsultant.idCardBack.startsWith('data:') ? (
                          <img 
                            src={selectedConsultant.idCardBack} 
                            alt="ID Card Back" 
                            className={styles.docImage}
                          />
                        ) : (
                          <>
                            <FaFileAlt className={styles.docIcon} />
                            <p>id-card-back.jpg</p>
                          </>
                        )}
                      </div>
                      {selectedConsultant.idCardBack.startsWith('data:') && (
                        <a 
                          href={selectedConsultant.idCardBack} 
                          download="id-card-back.jpg"
                          className={styles.downloadButton}
                        >
                          Download
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {selectedConsultant.supportingDocs && selectedConsultant.supportingDocs.length > 0 && (
                  <>
                    <h3>Supporting Documents</h3>
                    <div className={styles.docsList}>
                      {selectedConsultant.supportingDocs.map((doc: string, index: number) => (
                        <div key={index} className={styles.docItem}>
                          {doc.startsWith('data:') ? (
                            <>
                              <div className={styles.docImageWrapper}>
                                <img 
                                  src={doc} 
                                  alt={`Supporting Document ${index + 1}`}
                                  className={styles.docThumbnail}
                                />
                              </div>
                              <span>Document {index + 1}</span>
                              <a 
                                href={doc} 
                                download={`supporting-doc-${index + 1}.jpg`}
                                className={styles.downloadButton}
                              >
                                Download
                              </a>
                            </>
                          ) : (
                            <>
                              <FaFileAlt className={styles.docItemIcon} />
                              <span>Document {index + 1}</span>
                              <button className={styles.downloadButton}>View/Download</button>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {selectedConsultant.status === 'pending' && (
              <div className={styles.modalFooter}>
                <button
                  className={styles.declineButton}
                  onClick={() => handleDeclineConsultant(selectedConsultant.id)}
                >
                  <FaTimesCircle /> Decline
                </button>
                <button
                  className={styles.approveButton}
                  onClick={() => handleApproveConsultant(selectedConsultant.id)}
                >
                  <FaCheckCircle /> Approve Consultant
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboardPage;

