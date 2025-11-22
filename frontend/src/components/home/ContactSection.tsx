import { useState } from 'react';
import type { FormEvent } from 'react';
import { toast } from 'react-toastify';

import styles from './ContactSection.module.css';


const initialFormState = {
  firstName: '',
  lastName: '',
  email: '',
  message: '',
};

const ContactSection = () => {
  const [form, setForm] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.email || !form.message) {
      toast.warning('Please provide a valid email and message.');
      return;
    }

    try {
      setIsSubmitting(true);
      // TODO: Integrate with backend contact endpoint.
      await new Promise((resolve) => setTimeout(resolve, 800));
      toast.success('Thanks for reaching out! We will contact you shortly.');
      setForm(initialFormState);
    } catch (error) {
      toast.error('Failed to send your message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className={styles.wrapper}>
      <header className={styles.header}>
        <h2>Contact Us</h2>
        <p>Connect with Expert Raah for support, inquiries, or collaborations.</p>
      </header>
      <div className={styles.grid}>
        <ul className={styles.details}>
          <li>
            <span className={styles.label}>LinkedIn</span>
            <a href="https://www.linkedin.com/">https://www.linkedin.com/</a>
          </li>
          <li>
            <span className={styles.label}>Facebook</span>
            <a href="https://www.facebook.com/">https://www.facebook.com/</a>
          </li>
          <li>
            <span className={styles.label}>Email</span>
            <a href="mailto:expertraah@email.com">expertraah@email.com</a>
          </li>
          <li>
            <span className={styles.label}>Phone</span>
            <a href="tel:+92511234567">+92-51-1234567</a>
          </li>
          <li>
            <span className={styles.label}>Address</span>
            <span>Khudadad Heights, E-11, Islamabad</span>
          </li>
        </ul>
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.row}>
            <input
              type="text"
              placeholder="First Name"
              value={form.firstName}
              onChange={(event) => setForm((prev) => ({ ...prev, firstName: event.target.value }))}
              aria-label="First Name"
            />
            <input
              type="text"
              placeholder="Last Name"
              value={form.lastName}
              onChange={(event) => setForm((prev) => ({ ...prev, lastName: event.target.value }))}
              aria-label="Last Name"
            />
          </div>
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            aria-label="Email"
            required
          />
          <textarea
            rows={4}
            placeholder="Message"
            value={form.message}
            onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
            aria-label="Message"
            required
          />
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Sending...' : 'Send Message'}
          </button>
        </form>
      </div>
    </section>
  );
};

export default ContactSection;




