import React from 'react'
import { motion } from 'framer-motion'
import StatsCard from '../components/StatsCard'
import ProgressBar from '../components/ProgressBar'

export default function About(){
  return (
    <motion.div initial={{opacity:0,y:40}} animate={{opacity:1,y:0}} transition={{duration:0.6}} className="p-12">
      <h2 className="text-4xl font-extrabold text-center about-title">About Me</h2>
      <p className="text-[var(--text-secondary)] mt-3 text-center">Get to know me better</p>

      <div className="about-grid max-w-5xl mx-auto mt-6">
        <div className="about-left">
          <h2 className="about-hello">Hello, I'm Atif Ayyoub</h2>
          <p className="about-subtext">Consistency Makes a Man Perfect in Their Skill Set.</p>
          <p className="about-bio">I’m a passionate and results driven professional who believes in delivering quality work that truly makes an impact. With a strong background in technology, design, and digital innovation, I specialize in creating practical, high performing solutions tailored to each client’s unique goals. I take pride in clear communication, creative problem solving, and a commitment to exceeding expectations on every project. My focus is always on building long-term partnerships through reliability, professionalism, and exceptional results.</p>
        </div>

        <div className="about-right flex items-start justify-center">
          <div className="about-right-circle" />
        </div>
      </div>

      <h2 className="about-stats">Statistics</h2>

      <div className="quick-stats">
        <div className="quick-item"><span className="quick-value">1+</span> <span className="quick-label">Years Experience</span></div>
        <div className="quick-item"><span className="quick-value">5+</span> <span className="quick-label">Completed Projects</span></div>
      </div>

      <h2 className="about-skills">Skills & Expertise</h2>

      <div className="mt-8 max-w-3xl mx-auto text-left">
          <h3 className="text-2xl font-bold">Skills</h3>
          <div className="mt-4 skills-section">
          <div className="skill">
            <div className="skill-title">AI UI Design — Web & APP</div>
            <div className="progress-bar">
              <div className="progress-fill" style={{"--w":"70%"}}>70%</div>
            </div>
          </div>

          <div className="skill">
            <div className="skill-title">AI Web Development</div>
            <div className="progress-bar">
              <div className="progress-fill" style={{"--w":"72%"}}>72%</div>
            </div>
          </div>

          <div className="skill">
            <div className="skill-title">AI Mobile App Development</div>
            <div className="progress-bar">
              <div className="progress-fill" style={{"--w":"77%"}}>77%</div>
            </div>
          </div>
        </div>
      </div>

      <div className="about-interests-section" style={{marginTop: '50px'}}>
        <h2 className="about-interests">Personal Interests</h2>
        <p className="about-interests-text">When I'm not designing, I enjoy exploring new technologies, reading about design trends, and spending time with my family. I believe in maintaining a healthy work-life balance and continuously improving my skills.</p>
      </div>
    </motion.div>
  )
}
