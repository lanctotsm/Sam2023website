import React from "react";

const SectionDivider: React.FC = () => {
    return (
    <div className='section-divider'>
        <div className="divider-line"></div>
        <div className="divider-icon"><i className="fa fa-gift"></i></div>
        <div className="divider-line"></div>
    </div>
    );
};

export default SectionDivider;