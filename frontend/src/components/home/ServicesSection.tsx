import {
  serviceBusinessImage,
  serviceEducationImage,
  serviceLegalImage,
} from '../../assets';
import styles from './ServicesSection.module.css';

const SERVICES = [
  {
    id: 'education',
    title: 'Educational Consultation',
    description: 'Support with admissions, career counseling, study abroad guidance, and academic planning.',
    image: serviceEducationImage,
  },
  {
    id: 'legal',
    title: 'Legal Consultation',
    description: 'Contracts, disputes, intellectual property, compliance, and other legal matters.',
    image: serviceLegalImage,
  },
  {
    id: 'business',
    title: 'Business Consultation',
    description: 'Strategy, operations, marketing, and financial management expertise for growing teams.',
    image: serviceBusinessImage,
  },
];

const ServicesSection = () => {
  return (
    <section id="services" className={styles.wrapper}>
      <header className={styles.header}>
        <h2>Our Services</h2>
        <p>
          Expert Raah connects you with trusted consultants in legal, business, and educational fields. Choose the
          support you need and our network will guide you forward.
        </p>
      </header>
      <div className={styles.grid}>
        {SERVICES.map((service) => (
          <article key={service.id} className={styles.card}>
            <div className={styles.imageWrapper}>
              <img src={service.image} alt={service.title} />
            </div>
            <div className={styles.content}>
              <h3>{service.title}</h3>
              <p>{service.description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default ServicesSection;

