import React from 'react'

export default function ServiceCard({icon:Icon,title,price,children}){
  return (
    <div className="info-card service-card" style={{transition:'transform .3s, box-shadow .3s', paddingTop:20}}>
      <div style={{display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center'}}>
        <div className="service-icon-circle">
          {Icon && <Icon className="service-icon" />}
        </div>

        <h3 className="service-title" style={{marginTop:10, marginBottom:10}}>{title}</h3>

        <p className="service-desc" style={{marginBottom:10}}>{children}</p>

        <div className="service-price" style={{marginTop:10}}>{price}</div>
      </div>
    </div>
  )
}
