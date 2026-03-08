import React from 'react'
import { motion } from 'framer-motion'
import ServiceCard from '../components/ServiceCard'
import { FaPaintBrush, FaCode, FaMobileAlt, FaDesktop } from 'react-icons/fa'

export default function Services(){
  return (
    <motion.div initial={{opacity:0,y:40}} animate={{opacity:1,y:0}} transition={{duration:0.6}} className="p-12">
      <h2 className="text-4xl font-extrabold services-title">My Services</h2>

      <div className="mt-8 grid services-grid">
        <div style={{marginTop:30}}>
          <ServiceCard icon={FaPaintBrush} title="UI/UX Design" price="$20/hours">
            Crafting intelligent UI/UX experiences with AI-powered design thinking.
            I build clean, modern interfaces supported by smart visual systems and prototypes.
            Every design balances aesthetics, usability, and functionality.
            Focused on creating seamless digital experiences for web and mobile.
          </ServiceCard>
        </div>

        <div style={{marginTop:30}}>
          <ServiceCard icon={FaCode} title="Web Development" price="$20/hours">
            Building modern, responsive, and high-performance websites.
            I develop scalable web applications using clean and efficient code.
            Focused on delivering fast, secure, and user-friendly digital experiences.
            Turning ideas into fully functional web solutions.
          </ServiceCard>
        </div>

        <ServiceCard icon={FaMobileAlt} title="Mobile App" price="$20/hours">
          Crafting high-performance mobile apps with clean, maintainable code.
          Specialized in responsive designs and seamless user interactions.
          Leveraging modern frameworks to deliver scalable mobile solutions.
          Transforming concepts into powerful digital experiences.
        </ServiceCard>

        <ServiceCard icon={FaDesktop} title="Desktop App" price="$20/hours">
          Designing and developing robust desktop applications for Windows, Mac, and Linux.
          Focused on creating seamless, user-friendly, and high-performance software.
          From concept to deployment, I deliver scalable and reliable solutions.
          Turning complex workflows into intuitive desktop experiences.
        </ServiceCard>
      </div>

      <div className="mt-12">
        <div className="cta-card">
          <h3 className="text-2xl font-bold">Ready to work together?</h3>
          <p className="mt-3 text-[var(--text-secondary)]">Let's discuss your project and create something amazing together.</p>
          <button type="button" aria-label="Let's Talk" className="mt-6 gradient-btn px-6 py-3 rounded-full font-semibold">Let's Talk</button>
        </div>
      </div>
    </motion.div>
  )
}
