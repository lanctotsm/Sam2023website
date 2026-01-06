import React from "react";
interface SectionProps {
    children: React.ReactNode;
}
const SectionTitle : React.FC<SectionProps> = (props) => {
    return (
        <h1 className='page-section-heading text-center mb-0 pt-4' style={{color:'white'}} >{props.children}
        </h1>
    );
}
export default SectionTitle;