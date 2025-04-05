import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import './UploadHistoryPage.css';
import React, { useState, useEffect } from 'react';

// UploadHistoryPage component displays a list of past lecture uploads and related details
function UploadHistoryPage() {
    // State to store lectures, expanded lecture index, and button hover state
    const [lectures, setLectures] = useState([]);
    const [expandedLectureIndex, setExpandedLectureIndex] = useState(null);
    const [hover, setHover] = useState(false);

    // Fetches the user's upload history from the server on component mount
    useEffect(() => {
        const fetchUploadHistory = async () => {
            try {
                // Sends a GET request with the auth token to retrieve upload history
                const response = await axios.get('http://127.0.0.1:8000/upload-history', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                // Sorts lectures by creation date, with most recent first
                const sortedLectures = (response.data.lectures || []).sort(
                    (a, b) => new Date(b.created_at) - new Date(a.created_at)
                );
                setLectures(sortedLectures);
            } catch (error) {
                console.error("Error fetching upload history:", error);
                setLectures([]); // Clears lectures if an error occurs
            }
        };

        fetchUploadHistory();
    }, []);

    // Toggles the expanded view of lecture details by index
    const toggleLectureDetails = (index) => {
        setExpandedLectureIndex(expandedLectureIndex === index ? null : index);
    };

    return (
        <div className="container mt-5">
            <h2>Upload History</h2>
            {/* Displays lectures if available, else shows a message */}
            {lectures.length > 0 ? (
                <ul className="list-group mt-4">
                    {lectures.map((lecture, index) => (
                        <li key={index} className="list-group-item text-left">
                            <h3>Lecture Log</h3>
                            <p><strong>Lecture Summary:</strong> {lecture.lecture_summary}</p>
                            <p><strong>Lecture File:</strong> {lecture.lecture_file_name}</p>
                            <p><strong>Lecture at:</strong> {new Date(lecture.created_at).toLocaleString()}</p>
                            
                            {/* Button to expand/collapse lecture details */}
                            <button
                                className="btn btn-outline-primary btn-sm text-left mt-2"
                                onClick={() => toggleLectureDetails(index)}
                                onMouseEnter={() => setHover(true)}
                                onMouseLeave={() => setHover(false)}
                                aria-expanded={expandedLectureIndex === index}
                                style={{ 
                                    width: 'auto',
                                    backgroundColor: hover ? '#B3E7FF' : '#D1F3FF',
                                    color: "#000000",
                                    border: 'none' 
                                }}  
                            >
                                {expandedLectureIndex === index ? 'Hide Details' : 'Show Details'}
                            </button>

                            {/* Conditional rendering for expanded lecture details */}
                            {expandedLectureIndex === index && (
                                <div className="mt-3">
                                    <h5>Student Questions, Responses, LLM Evaluations</h5>
                                    {lecture.students && lecture.students.length > 0 ? (
                                        <ul className="list-group">
                                        {/* Displays student questions, responses, and evaluations */}
                                        {lecture.students.map((student, studentIndex) => (
                                          <li key={studentIndex} className="list-group-item">
                                            <p><strong>Question:</strong> {student.question}</p>
                                            <p><strong>Answer:</strong> {student.response}</p>
                                            <strong>Evaluation: </strong>
                                            <ReactMarkdown
                                              components={{
                                                p: ({ node, ...props }) => <span {...props} />, // Render <p> as <span>
                                              }}
                                            >
                                              {student.evaluation}
                                            </ReactMarkdown>
                                          </li>
                                        ))}
                                      </ul>
                                    ) : (
                                        <p className="mt-2">No student questions available for this lecture.</p>
                                    )}
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="mt-4">Nothing to see here yet!</p>
            )}
        </div>
    );
}

export default UploadHistoryPage;
