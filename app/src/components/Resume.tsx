import React from 'react';
import Container from 'react-bootstrap/Container';
import { Col,Image,Row } from 'react-bootstrap';

export interface ResumeProps {
    resume: any;
}
const Resume: React.FC<ResumeProps> = ({resume}) => {
    let localResume = resume.resume;
    console.log(localResume);
    return (
       <Container>
   
        <Row className="justify-content-center">
            <Col xs={12} md={4}>
            <div>
            {localResume.basics.image ? null :
                <Image height={150} src={localResume.basics.image}>

                </Image>
             }
            </div>
            <div>
                <h3 className='mb-1'>Summary</h3>
                <p>{localResume.basics.summary}</p>
            </div>
            <div>
                <h3>Contact Information</h3>
                <div>
                    <a href={`mailto:${localResume.basics.email}`} style={{color:'inherit', textDecoration:'underline'}}>{localResume.basics.email}</a>
                </div>
                <div>
                    {localResume.basics.phone}
                </div>
                <div>
                    <a href={localResume.basics.website} target="_blank" style={{color:'inherit',textDecoration:'underline'}}>{localResume.basics.website}</a>
                </div>
                <hr/>
            </div>
            {(!localResume.education?.length)? null : 
            <div>
                <h3>Education</h3>
                {(localResume.education).map((education: any, index: number) => (
                    <div key={index+education.institution}>
                        <h5>{education.institution}</h5>
                        <div>{education.area}</div>
                        {(!education.score) ? null : 
                        <div>
                            <span style={{fontWeight:'bold'}}>GPA: {education.score} </span>
                        </div>
                        }
                        <div style={{fontWeight:'bold'}}>{education.studyType}</div>
                        <div>{education.startDate} - {education.endDate}</div>
                        <hr/>
                    </div>
                ))

                }
            </div> 
            }
                {(isEmpty(localResume.basics.profiles)) ? null: 
                <div>
                    <h3>Profiles</h3>
                    {(localResume.basics.profiles).map((profile: any, index: number) => (
                        <div key={index} className='social-icons'>
                            <a href={profile.url} target='_blank' className='social-icon' style={{ display:'inline-flex', alignItems: 'center', marginRight:'0em' }}>
                                {profile.network === 'GitHub' ? <i className="fa fa-github"></i> :
                                 profile.network==='LinkedIn' ? <i className="fa fa-linkedin"></i> :
                                  profile.network==='Instagram' ? <i className="fa fa-instagram"></i> :null}
                            </a>
                            <span style={{fontWeight:'bold'}}>{profile.username.toUpperCase()}</span>

                        </div>
                    ))}
                </div> 
            }
          
            {(localResume.interests.length === 0) ? null:
            <div>
                   <h3 className='mb-1'>Interests</h3>
                    <ul>
                        {(localResume.interests).map((interest: any, index: number) => (
                            <li key={index}>{interest.name}</li>
                        ))}
                    </ul>
            
            </div>
            }
         
            </Col>
            <Col xs={12} md={8}>
            <div>
                <h3 className='mb-1'>Skills</h3>
                <hr></hr>
                {(localResume.skills).map((skill: any, index: number) => (
                <div className='rounded border-dark border py-1 px-2 m-1' style={{display:'inline-block'}}>
                    <span className='mr-1' key={index}>
                        <b >{skill.name}</b>
                    </span>            

                    <span>{' ' + skill.level}</span>
                </div>
                ))}
         
              <h3 className='mb-1'>Work Experience</h3>
            <hr></hr>
                {(localResume.work).map((work: any, index: number) => (
                    <div key={index}>
                        <h5>{work.position}, <span style={{fontWeight:'bold'}}>{work.name}</span></h5>
                        <div style={{fontWeight:'bold'}}>{new Date(work.startDate).toLocaleDateString('en-us', { year:"numeric", month:"short"})} 
                        - {work.endDate? new Date(work.endDate).toLocaleDateString('en-us', { year:"numeric", month:"short"}): 'Present'}</div>
                        <div>{work.summary}</div>
                        <hr/>
                    </div>
                ))}
                </div>
            </Col>
        </Row>
       </Container>    
       )
}
function isEmpty(obj: any) {
    return obj === undefined || obj.length === 0;
}
export default Resume;