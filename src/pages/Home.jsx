import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';
import {
  heroContent,
  mission,
  services,
  whyChooseUs,
  cta,
  testimonials,
} from '../data/homeContent';

const Home = () => {
  return (
    <div className="text-gray-800 dark:text-white bg-white dark:bg-gray-900 transition-colors duration-300">

      {/* Hero Section */}
      <motion.section
        className="bg-blue-50 dark:bg-gray-800 py-16 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-4xl font-bold mb-4">{heroContent.title}</h1>
        <p className="text-lg max-w-2xl mx-auto mb-6">{heroContent.subtitle}</p>
        <Link to="/test-selection">
          <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
            {heroContent.buttonText}
          </button>
        </Link>
      </motion.section>

      {/* Mission Section */}
      <motion.section
        className="py-12 px-4 md:px-20 bg-white dark:bg-gray-900 text-center"
        initial={{ opacity: 0, x: -50 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-3xl font-semibold mb-4">{mission.title}</h2>
        <p className="max-w-3xl mx-auto text-lg">{mission.description}</p>
      </motion.section>

      {/* What We Offer */}
      <motion.section
        className="py-16 bg-gray-100 dark:bg-gray-800 px-6 md:px-20"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-3xl font-semibold text-center mb-8">What We Offer</h2>
        <div className="grid gap-8 md:grid-cols-3 text-center">
          {services.map(({ title, description, icon }, index) => {
            const LucideIcon = Icons[icon];
            return (
              <div key={index} className="bg-white dark:bg-gray-700 p-6 rounded-xl shadow-md">
                {LucideIcon && (
                  <LucideIcon className="mx-auto mb-4 text-blue-600" size={32} />
                )}
                <h3 className="text-xl font-bold mb-2">{title}</h3>
                <p>{description}</p>
              </div>
            );
          })}
        </div>
      </motion.section>

      {/* Why Choose Us */}
      <motion.section
        className="py-16 px-6 md:px-20 bg-white dark:bg-gray-900"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-3xl font-semibold text-center mb-8">
          Why Choose TestShala?
        </h2>
        <ul className="max-w-4xl mx-auto text-lg space-y-6">
          {whyChooseUs.map(({ icon, text }, index) => {
            const LucideIcon = Icons[icon];
            return (
              <li key={index} className="flex items-start gap-3">
                {LucideIcon && <LucideIcon className="text-blue-500 mt-1" />}
                {text}
              </li>
            );
          })}
        </ul>
      </motion.section>

      {/* ✅ Testimonials Section */}
      <motion.section
        className="py-16 px-6 md:px-20 bg-gray-100 dark:bg-gray-800 text-center"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-3xl font-semibold mb-10">What Our Students Say</h2>
        <div className="grid gap-10 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-md text-left"
            >
              <img
                src={testimonial.image}
                alt={testimonial.name}
                className="w-16 h-16 rounded-full mb-4 mx-auto"
              />
              <p className="italic mb-2 text-center">"{testimonial.review}"</p>
              <h4 className="text-lg font-semibold text-center">{testimonial.name}</h4>
            </div>
          ))}
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section
        className="py-16 bg-blue-600 text-white text-center"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
      >
        <h2 className="text-3xl font-bold mb-4">{cta.title}</h2>
        <p className="mb-6">{cta.subtitle}</p>
        <Link to="/test-selection">
          <button className="bg-white text-blue-600 font-semibold px-6 py-3 rounded-lg hover:bg-gray-100">
            {cta.buttonText}
          </button>
        </Link>
      </motion.section>
    </div>
  );
};

export default Home;
