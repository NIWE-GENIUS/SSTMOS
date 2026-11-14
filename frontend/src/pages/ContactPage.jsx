// src/pages/ContactPage.jsx
import Navbar from './landing/Navbar';
import Footer from './landing/Footer';
import ContactHero from './contact/ContactHero';
import ContactInfo from './contact/ContactInfo';
import ContactForm from './contact/ContactForm';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <ContactHero />
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <ContactInfo />
            </div>
            <div className="lg:col-span-2">
              <ContactForm />
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}