import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';
import './UploadPage.css';

function UploadPage() {
  // Setting up state variables
  const [textContent, setTextContent] = useState('');
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSummarising, setIsSummarising] = useState(false);
  const [boxResponses, setBoxResponses] = useState(Array(10).fill(null));
  const [answers, setAnswers] = useState(Array(10).fill(''));
  const [evaluations, setEvaluations] = useState(Array(10).fill(null));
  const [isActive, setIsActive] = useState(false);
  const [currentLectureId, setCurrentLectureId] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(Array(10).fill(false));
  const [isFormDisabled, setIsFormDisabled] = useState(false);
  const [isBoxLoading, setIsBoxLoading] = useState(Array(10).fill(false));
  const [summarisedContent, setSummarisedContent] = useState([]);
  const fileInputRef = useRef(null);
  const abortControllersRef = useRef([]);
  const evaluateControllersRef = useRef([]);
  const summariseControllerRef = useRef(null);

  // UseEffect to cancel out going requests
  useEffect(() => {
    return () => {
      abortAllRequests();
    };
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      abortAllRequests();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Function to cancel all outgoing requests to backend server
  const abortAllRequests = () => {
    abortControllersRef.current.forEach((controller) => {
      if (controller) controller.abort();
    });
    abortControllersRef.current = [];

    evaluateControllersRef.current.forEach((controller) => {
      if (controller) controller.abort();
    });
    evaluateControllersRef.current = [];

    if (summariseControllerRef.current) {
      summariseControllerRef.current.abort();
      summariseControllerRef.current = null;
    }
  };

  // Function summarises text content uploaded to the frontend. Improves response times from LLM Query route.
  const summariseFile = async () => {
    if (file || textContent.trim()) {
      const formData = new FormData();
  
      // Append file if present
      if (file) {
        formData.append('file', file);
      }
  
      // Append lecture summary text if present
      if (textContent.trim()) {
        formData.append('lecture_summary', textContent.trim());
      }
  
      if (summariseControllerRef.current) {
        summariseControllerRef.current.abort();
      }
  
      summariseControllerRef.current = new AbortController();
  
      try {
        setIsSummarising(true); // Set specific loading state for summarisation
        // Sending content to summarise route in backend
        const response = await axios.post('http://127.0.0.1:8000/summarise', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          signal: summariseControllerRef.current.signal,
        });
  
        // Store and return summarised content
        setSummarisedContent(response.data.summaries);
        return response.data.summaries;
      } catch (error) {
        if (error.name === 'CanceledError') {
          console.log('Summarise request canceled:', error.message);
          setFile(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        } else {
          console.error('An error occurred while summarising the content:', error);
        }
        return null;
      } finally {
        summariseControllerRef.current = null;
        setIsSummarising(false); // Reset specific loading state
      }
    }
    return null;
  };

  // Function to retrieve queries back from LLM based on material provided.
  // Stores new content on UploadHistory page and in the MongoDB DB.
  const handleSubmit = async (event) => {
    event.preventDefault();
  
    // Clear any existing requests before starting new ones
    abortAllRequests();
  
    setIsFormDisabled(true);
    setIsActive(true);
  
    try {
      let summaries = [];
  
      // Ensure summariseFile() runs if either file or textContent is present
      if (file || textContent.trim()) {
        summaries = await summariseFile();
        if (!summaries) {
          console.error('Failed to summarise content. Cannot proceed with submission.');
          handleReset();
          return;
        }
      }
      
      // Storing new lecture content
      const lectureId = await storeLecture();
      if (!lectureId) {
        console.error('Failed to store lecture. Cannot proceed with evaluation.');
        handleReset(); // Reset the form if lecture storage fails
        return;
      }
  
      console.log('Text content before sending:', textContent);
      
      // Ensures to fill all 10 student boxes and once there is a missing box, generates a new question
      setIsBoxLoading(Array(10).fill(true));
      setIsLoading(true);
      const initialRequests = Array.from({ length: 10 }, (_, index) =>
        fetchApiResponse(index, summaries)
      );
      await Promise.all(initialRequests);
    } catch (error) {
      console.error('An error occurred during submission:', error);
      handleReset(); // Reset the form if any error occurs
    } finally {
      setIsLoading(false);
    }
  };

  // Function to gather questions from the LLM.
  const fetchApiResponse = async (index, summaries) => {
    const abortController = new AbortController();
    abortControllersRef.current.push(abortController);

    setIsBoxLoading((prevLoading) => {
      const newLoading = [...prevLoading];
      newLoading[index] = true;
      return newLoading;
    });

    setBoxResponses((prevBoxResponses) => {
      const newBoxResponses = [...prevBoxResponses];
      newBoxResponses[index] = null;
      return newBoxResponses;
    });

    const formData = new FormData();
    if (summaries && summaries.length > 0) {
      formData.append('summaries', JSON.stringify(summaries));
    }

    // Uses the upload route to generate questions
    try {
      const response = await axios.post('http://127.0.0.1:8000/upload', formData, {
        
        signal: abortController.signal,
      });

      console.log('Received response from backend:', response.data.message);

      // Inserts questions into student boxes
      setBoxResponses((prevBoxResponses) => {
        const newBoxResponses = [...prevBoxResponses];
        newBoxResponses[index] = response.data.message;
        return newBoxResponses;
      });
    } catch (error) {
      if (error.name === 'CanceledError') {
        console.log('Request canceled:', error.message);
      } else {
        console.error('An error occurred while uploading content:', error);
      }
    } finally {
      abortControllersRef.current = abortControllersRef.current.filter(
        (controller) => controller !== abortController
      );

      setIsBoxLoading((prevLoading) => {
        const newLoading = [...prevLoading];
        newLoading[index] = false;
        return newLoading;
      });
    }
  };

  // Function to store lectures in MongoDB database
  const storeLecture = async () => {
    if (textContent.trim() || file) {
      const formData = new FormData();
      formData.append('lecture_summary', textContent.trim() ? textContent : 'N/A');
      const fileName = file ? file.name : 'N/A';
      formData.append('lecture_file_name', fileName);

      try {
        const response = await axios.post('http://127.0.0.1:8000/store-lecture', formData, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'multipart/form-data',
          },
        });
        const lectureId = response.data.lecture_id;
        setCurrentLectureId(lectureId);
        return lectureId;
      } catch (error) {
        console.error('Failed to store lecture:', error);
        return null;
      }
    } else {
      console.error('Please provide either text content or a file.');
      return null;
    }
  };

  // Function to pair questions and answers together 
  const handleAnswerChange = (index, value) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
  };

  // Used to rate the quality of the users answer to the LLM generated question
  // Appends the question, answer, evaluation truple to the associated lecture in the DB
  const handleEvaluate = async (index) => {
    const answer = answers[index];
    if (answer.trim() && currentLectureId) {
      const formData = new FormData();
      formData.append('question', boxResponses[index]);
      formData.append('answer', answer);

      setIsEvaluating((prev) => {
        const newEvaluatingState = [...prev];
        newEvaluatingState[index] = true;
        return newEvaluatingState;
      });

      const controller = new AbortController();
      evaluateControllersRef.current[index] = controller;

      try {
        const response = await axios.post('http://127.0.0.1:8000/evaluate', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          signal: controller.signal
        });

        const evaluation = response.data.evaluation;
        setEvaluations((prevEvaluations) => {
          const newEvaluations = [...prevEvaluations];
          newEvaluations[index] = evaluation;
          return newEvaluations;
        });

        const storeData = new FormData();
        storeData.append('lecture_id', currentLectureId);
        storeData.append('question', boxResponses[index]);
        storeData.append('response', answer);
        storeData.append('evaluation', evaluation);

        await axios.post('http://127.0.0.1:8000/store-student-response', storeData, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'multipart/form-data',
          },
        });

      } catch (error) {
        if (error.name === 'CanceledError') {
          console.log('Evaluate request canceled:', error.message);
        } else {
          console.error('Failed to evaluate answer or store response:', error);
        }
      } finally {
        evaluateControllersRef.current[index] = null;
        setIsEvaluating((prev) => {
          const newEvaluatingState = [...prev];
          newEvaluatingState[index] = false;
          return newEvaluatingState;
        });
      }
    }
  };

  // Used to generate a new question after the user has completed the evaluation for a current one
  const handleNextResponse = (index, summaries) => {
        // Reset answers and evaluations for the index
        setAnswers((prevAnswers) => {
          const newAnswers = [...prevAnswers];
          newAnswers[index] = '';
          return newAnswers;
        });
        setEvaluations((prevEvaluations) => {
          const newEvaluations = [...prevEvaluations];
          newEvaluations[index] = null;
          return newEvaluations;
        });
        // Fetch new response for this index
        fetchApiResponse(index, summaries);
      };
  
  // Function to handle reset and reset all state variables
  const handleReset = () => {
    // First abort all pending requests
    abortAllRequests();
    
    // Reset all states
    setTextContent('');
    setFile(null);
    setBoxResponses(Array(10).fill(null));
    setAnswers(Array(10).fill(''));
    setEvaluations(Array(10).fill(null));
    setIsActive(false);
    setIsFormDisabled(false);
    setCurrentLectureId(null);
    setIsBoxLoading(Array(10).fill(false));
    setIsEvaluating(Array(10).fill(false));
    setSummarisedContent([]);
    setIsLoading(false); // Ensure loading state is reset

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // Clear all abort controllers
    abortControllersRef.current = [];
    evaluateControllersRef.current = [];
    summariseControllerRef.current = null;
  };

  // Add cleanup for component unmount
  useEffect(() => {
    return () => {
      handleReset(); // Use handleReset for cleanup to ensure consistent state reset
    };
  }, []);


  return (
    <div className="container mt-5 pt-4">
      <h2 className="mb-4 text-center">Upload Your Lecture Content</h2>
      <p className="text-center">
        Please upload the content for your lecture here. You can provide a text summary, upload a file, or do both.
        After submitting, the content will be processed and questions will be generated below.
        These questions are intended to mimic the questions students would ask.
      </p>

      <form onSubmit={handleSubmit} className="mb-5">
        <div className="mb-3">
          <label htmlFor="textContent" className="form-label fw-bold text-start d-block">
            Lecture Summary:
          </label>
          <textarea
            id="textContent"
            className="form-control"
            rows="4"
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            placeholder="Enter a brief summary of your lecture here..."
            disabled={isFormDisabled}
          ></textarea>
        </div>

        <div className="mb-3">
          <label htmlFor="fileUpload" className="form-label fw-bold text-start d-block">
            Upload File:
          </label>
          <input
            type="file"
            id="fileUpload"
            className="form-control"
            ref={fileInputRef}
            onChange={(e) => setFile(e.target.files[0])}
            disabled={isFormDisabled}
          />
        </div>

        <div className="text-end">
          <button type="submit" className="btn btn-primary" disabled={isFormDisabled}>Submit</button>
          <button type="button" className="btn btn-success ms-2" onClick={handleReset}>Reset</button>
        </div>
      </form>

      <h2 className="mb-4">Questions</h2>

      {isLoading && (
        <div className="text-center mt-4">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Generating questions...</p> {/* Specific text for summarisation */}
      </div>
      )}

      {isSummarising && (
        <div className="text-center mt-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Summarising content...</p> {/* Specific text for summarisation */}
        </div>
      )}

      {[...Array(10)].map((_, index) => (
        <div className="mt-4" key={index}>
          <h6 className="mb-2 text-start">Student {index + 1}</h6>
          <div
            className={`p-3 border rounded text-start ${boxResponses[index] && !isBoxLoading[index] ? 'bg-light-green' : 'bg-white'}`}
            style={{ backgroundColor: boxResponses[index] && !isBoxLoading[index] ? '#e8f5e9' : 'white' }}
          >
            <p><strong>Question:</strong> {isBoxLoading[index] ? (
              <span>
                
                <span className="spinner-border spinner-border-sm text-primary ms-2" role="status" aria-hidden="true"></span>
              </span>
            ) : (
              boxResponses[index] || "Waiting for response..."
            )}</p>

            <label className="form-label mt-3" style={{ display: 'block' }}><strong>Answer:</strong></label>
            <input
              type="text"
              className="form-control"
              placeholder="Enter your answer here"
              value={answers[index]}
              onChange={(e) => handleAnswerChange(index, e.target.value)}
              disabled={isBoxLoading[index]}
            />

            <div className="d-flex justify-content-start mt-2">
              <button
                className="btn btn-primary me-2"
                onClick={() => handleEvaluate(index)}
                disabled={!answers[index].trim() || isEvaluating[index] || isBoxLoading[index]}
              >
                {isEvaluating[index] ? (
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                ) : (
                  "Evaluate"
                )}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => handleNextResponse(index, summarisedContent)}
                disabled={!isActive || isEvaluating[index] || isBoxLoading[index]}
              >
                {isBoxLoading[index] ? (
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                ) : (
                  "Next Response"
                )}
              </button>
            </div>
            <div className="mt-3">
              <strong>Evaluation:</strong> 
              <ReactMarkdown>
                {evaluations[index] || "Awaiting evaluation..."}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default UploadPage;