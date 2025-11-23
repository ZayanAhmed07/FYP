import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { httpClient } from '../../api/httpClient';
import styles from './ContactManagement.module.css';

interface Contact {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  message: string;
  status: 'pending' | 'reviewed' | 'responded';
  adminResponse?: string;
  adminResponseDate?: string;
  reviewedBy?: {
    firstName: string;
    lastName: string;
  };
  submissionDate: string;
}

interface ContactStats {
  total: number;
  pending: number;
  reviewed: number;
  responded: number;
}

const ContactManagement = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [stats, setStats] = useState<ContactStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [response, setResponse] = useState('');
  const [filter, setFilter] = useState<string>('');

  useEffect(() => {
    fetchContacts();
    fetchStats();
  }, [filter]);

  const fetchContacts = async () => {
    try {
      const response = await httpClient.get(`/admin/contacts?status=${filter}`);
      setContacts(response.data.data.contacts);
    } catch (error) {
      toast.error('Failed to fetch contacts');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await httpClient.get('/admin/contacts/stats');
      setStats(response.data.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleStatusUpdate = async (contactId: string, status: string, adminResponse?: string) => {
    try {
      await httpClient.patch(`/admin/contacts/${contactId}`, {
        status,
        adminResponse: adminResponse || undefined,
      });
      toast.success('Contact updated successfully');
      fetchContacts();
      fetchStats();
      setSelectedContact(null);
      setResponse('');
    } catch (error) {
      toast.error('Failed to update contact');
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'pending': return styles.statusPending;
      case 'reviewed': return styles.statusReviewed;
      case 'responded': return styles.statusResponded;
      default: return styles.statusPending;
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <div className={styles.contactManagement}>
      <div className={styles.header}>
        <h1 className={styles.title}>Contact Management</h1>
      </div>

      <div className={styles.filterSection}>
        <label className={styles.filterLabel}>Filter by Status:</label>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="">All Contacts</option>
          <option value="pending">Pending</option>
          <option value="reviewed">Reviewed</option>
          <option value="responded">Responded</option>
        </select>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>{stats.total}</div>
            <div className={styles.statLabel}>Total Contacts</div>
          </div>
          <div className={`${styles.statCard} ${styles.statPending}`}>
            <div className={styles.statNumber}>{stats.pending}</div>
            <div className={styles.statLabel}>Pending</div>
          </div>
          <div className={`${styles.statCard} ${styles.statReviewed}`}>
            <div className={styles.statNumber}>{stats.reviewed}</div>
            <div className={styles.statLabel}>Reviewed</div>
          </div>
          <div className={`${styles.statCard} ${styles.statResponded}`}>
            <div className={styles.statNumber}>{stats.responded}</div>
            <div className={styles.statLabel}>Responded</div>
          </div>
        </div>
      )}

      {/* Contacts List */}
      <div className={styles.contactsContainer}>
        <div className={styles.contactsHeader}>
          <h3 className={styles.contactsTitle}>Contact Submissions</h3>
        </div>
        <div className={styles.contactsList}>
          <div className={styles.contactsList}>
            {contacts.map((contact) => (
              <div key={contact._id} className={styles.contactItem}>
                <div className={styles.contactHeader}>
                  <div className={styles.contactInfo}>
                    <h4>
                      {contact.firstName} {contact.lastName}
                    </h4>
                    <p className={styles.contactEmail}>{contact.email}</p>
                    <p className={styles.contactDate}>
                      {new Date(contact.submissionDate).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`${styles.statusBadge} ${getStatusClass(contact.status)}`}>
                    {contact.status}
                  </span>
                </div>
                <div className={styles.contactMessage}>
                  <p>{contact.message}</p>
                </div>
                {contact.adminResponse && (
                  <div className={styles.adminResponse}>
                    <p className={styles.responseTitle}>Admin Response:</p>
                    <p className={styles.responseText}>{contact.adminResponse}</p>
                  </div>
                )}
                <div className={styles.contactActions}>
                  {contact.status === 'pending' && (
                    <button
                      onClick={() => handleStatusUpdate(contact._id, 'reviewed')}
                      className={`${styles.actionButton} ${styles.markReviewedButton}`}
                    >
                      Mark as Reviewed
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedContact(contact)}
                    className={`${styles.actionButton} ${styles.respondButton}`}
                  >
                    Respond
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Response Modal */}
      {selectedContact && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>
                Respond to {selectedContact.firstName} {selectedContact.lastName}
              </h3>
            </div>
            <div className={styles.originalMessage}>
              <p className={styles.messageLabel}><strong>Original Message:</strong></p>
              <p className={styles.originalMessageText}>{selectedContact.message}</p>
            </div>
            <div className={styles.responseSection}>
              <label className={styles.responseLabel}>
                Your Response
              </label>
              <textarea
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                rows={6}
                className={styles.responseTextarea}
                placeholder="Type your response here..."
              />
            </div>
            <div className={styles.modalActions}>
              <button
                onClick={() => {
                  setSelectedContact(null);
                  setResponse('');
                }}
                className={styles.cancelButton}
              >
                Cancel
              </button>
              <button
                onClick={() => handleStatusUpdate(selectedContact._id, 'responded', response)}
                disabled={!response.trim()}
                className={styles.sendButton}
              >
                Send Response
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactManagement;