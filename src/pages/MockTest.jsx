import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { allSubjects } from '../data/MockTestContent';

const MockTestSelection = () => {
  const navigate = useNavigate();

  const [testScope, setTestScope] = useState('chapterwise');
  const [subject, setSubject] = useState('');
  const [selectedSubcategories, setSelectedSubcategories] = useState([]);
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [difficulty, setDifficulty] = useState('Medium');
  const [testType, setTestType] = useState('Mock Test');
  const [testDuration, setTestDuration] = useState();
  const [errors, setErrors] = useState([]); // For storing validation errors
  
  // Get the selected subject data
  const selectedSubject = allSubjects.find((subj) => subj.name === subject);

  // Use useMemo to prevent unnecessary recalculation of chapters and subcategories
  const subcategories = useMemo(() => {
    if (!selectedSubject) return [];
    return selectedSubject.subcategories || [];
  }, [selectedSubject]);

  // Calculate available chapters based on selected scope and subcategories
  const currentChapters = useMemo(() => {
    if (!selectedSubject) return [];
    
    // For chapterwise testing, show only chapters from selected subcategories
    if (testScope === 'subcategorywise' && selectedSubcategories.length > 0) {
      return subcategories
        .filter(subcat => selectedSubcategories.includes(subcat.name))
        .flatMap(subcat => subcat.chapters.map(chapter => chapter));
    }
    
    // For chapterwise testing, show all chapters
    if (testScope === 'chapterwise') {
      return subcategories.flatMap(subcat => subcat.chapters);
    }
    
    // For complete subject, include all chapters
    return subcategories.flatMap(subcat => subcat.chapters);
  }, [selectedSubject, testScope, selectedSubcategories, subcategories]);

  const handleTopicChange = (e) => {
    const { value, checked } = e.target;
    setSelectedTopics((prev) =>
      checked ? [...prev, value] : prev.filter((t) => t !== value)
    );
    // Clear errors when user makes changes
    setErrors([]);
  };

  const handleSubcategoryChange = (e) => {
    const { value, checked } = e.target;
    setSelectedSubcategories((prev) =>
      checked ? [...prev, value] : prev.filter((s) => s !== value)
    );
    // Clear errors when user makes changes
    setErrors([]);
  };

  // Reset selections when subject changes
  useEffect(() => {
    setSelectedTopics([]);
    setSelectedSubcategories([]);
    setErrors([]); // Clear errors when subject changes
  }, [subject]);

  // Reset topics when subcategories change
  useEffect(() => {
    setSelectedTopics([]);
  }, [selectedSubcategories, testScope]);

  // Auto-select all topics for complete subject test
  useEffect(() => {
    if (testScope === 'complete' && subject && currentChapters.length > 0) {
      setSelectedTopics(currentChapters);
    }
  }, [testScope, subject, currentChapters]);

  // Auto-select all subcategories for complete subject test
  useEffect(() => {
    if (testScope === 'complete' && subject && subcategories.length > 0) {
      setSelectedSubcategories(subcategories.map(subcat => subcat.name));
    }
  }, [testScope, subject, subcategories]);

  // Validate form
  const validateForm = () => {
    const newErrors = [];
    
    if (!subject) {
      newErrors.push('Please select a subject');
    }

    if (testScope === 'chapterwise' && selectedTopics.length === 0) {
      newErrors.push('Please select at least one chapter');
    }

    if (testScope === 'subcategorywise' && selectedSubcategories.length === 0) {
      newErrors.push('Please select at least one subcategory');
    }
    
    if (testDuration < 15 || testDuration > 180) {
      newErrors.push('Test duration must be between 15 and 180 minutes');
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  // Update the handleSubmit function
  const handleSubmit = () => {
    // Validate form
    if (!validateForm()) {
      // Scroll to error messages
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: 'smooth'
      });
      return;
    }

    // Store test configuration in localStorage
    const testConfig = {
      subject,
      testScope,
      selectedTopics,
      selectedSubcategories,
      difficulty,
      testType,
      testDuration: testDuration * 60 // Convert minutes to seconds for the timer
    };
    
    localStorage.setItem('testConfig', JSON.stringify(testConfig));
    
    // Navigate to the correct route
    navigate('/take-test');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50 dark:bg-gray-900 p-8 transition-colors duration-300">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md dark:shadow-gray-700/30">
        <h2 className="text-2xl font-bold text-center mb-6 dark:text-white">Evaluate Your Knowledge</h2>

        {/* Test Scope Selection */}
        <div className="mb-6 border-b dark:border-gray-700 pb-4">
          <label className="block font-semibold mb-3 dark:text-gray-200">Test Scope</label>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="testScope"
                value="chapterwise"
                checked={testScope === 'chapterwise'}
                onChange={() => setTestScope('chapterwise')}
                className="text-blue-600"
              />
              <span className="text-gray-800 dark:text-gray-200">Chapterwise Evaluation</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="testScope"
                value="subcategorywise"
                checked={testScope === 'subcategorywise'}
                onChange={() => setTestScope('subcategorywise')}
                className="text-blue-600"
              />
              <span className="text-gray-800 dark:text-gray-200">Categorical Evaluation</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="testScope"
                value="complete"
                checked={testScope === 'complete'}
                onChange={() => setTestScope('complete')}
                className="text-blue-600"
              />
              <span className="text-gray-800 dark:text-gray-200">Full Evaluation</span>
            </label>
          </div>
        </div>

        {/* Subject Selection */}
        <div className="mb-4">
          <label className="block font-semibold mb-2 dark:text-gray-200">Select Subject</label>
          <select
            value={subject}
            onChange={(e) => {
              setSubject(e.target.value);
              setErrors([]);
            }}
            className={`w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white ${!subject && errors.length > 0 ? 'border-red-500' : ''}`}
          >
            <option value="">-- Select Subject --</option>
            {allSubjects.map((subj) => (
              <option key={subj.name} value={subj.name}>
                {subj.name}
              </option>
            ))}
          </select>
        </div>

        {/* Subcategory Selection - Only for subcategorywise scope */}
        {testScope === 'subcategorywise' && subcategories.length > 0 && (
          <div className="mb-4">
            <label className="block font-semibold mb-2 dark:text-gray-200">
              Select Subcategories
            </label>
            <div className={`max-h-48 overflow-y-scroll border rounded-md p-2 space-y-2 dark:bg-gray-700 dark:border-gray-600 ${testScope === 'subcategorywise' && selectedSubcategories.length === 0 && errors.length > 0 ? 'border-red-500' : ''}`}>
              {subcategories.map((subcat) => (
                <div key={subcat.name} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`subcat-${subcat.name}`}
                    value={subcat.name}
                    checked={selectedSubcategories.includes(subcat.name)}
                    onChange={handleSubcategoryChange}
                    className="mr-2"
                  />
                  <label htmlFor={`subcat-${subcat.name}`} className="dark:text-gray-200">
                    {subcat.name} ({subcat.chapters.length} chapters)
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Topic Selection - Only shown for Chapterwise Test */}
        {testScope === 'chapterwise' && currentChapters.length > 0 && (
          <div className="mb-4">
            <label className="block font-semibold mb-2 dark:text-gray-200">
              Select Chapters
            </label>
            <div className={`max-h-48 overflow-y-scroll border rounded-md p-2 space-y-2 dark:bg-gray-700 dark:border-gray-600 ${testScope === 'chapterwise' && selectedTopics.length === 0 && errors.length > 0 ? 'border-red-500' : ''}`}>
              {currentChapters.map((topic) => (
                <div key={topic} className="flex items-center">
                  <input
                    type="checkbox"
                    value={topic}
                    checked={selectedTopics.includes(topic)}
                    onChange={handleTopicChange}
                    className="mr-2"
                    id={topic}
                  />
                  <label htmlFor={topic} className="dark:text-gray-200">{topic}</label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* For Subcategorywise - Show selected subcategories info */}
        {testScope === 'subcategorywise' && selectedSubcategories.length > 0 && (
          <div className="mb-4 bg-blue-50 dark:bg-gray-700 p-3 rounded-md">
            <p className="font-medium text-blue-800 dark:text-gray-200">
              You will be tested on {selectedSubcategories.length} subcategories with a total of {
                subcategories
                  .filter(subcat => selectedSubcategories.includes(subcat.name))
                  .flatMap(subcat => subcat.chapters)
                  .length
              } chapters
            </p>
          </div>
        )}

        {/* For Complete Test - Show selected subject info */}
        {testScope === 'complete' && subject && (
          <div className="mb-4 bg-blue-50 dark:bg-gray-700 p-3 rounded-md">
            <p className="font-medium text-blue-800 dark:text-gray-200">
              You will be tested on all chapters of {subject}
              {currentChapters.length > 0 ? ` (${currentChapters.length} chapters)` : ''}
            </p>
          </div>
        )}

        {/* Difficulty */}
        <div className="mb-4">
          <label className="block font-semibold mb-2 dark:text-gray-200">Difficulty Level</label>
          <div className="flex space-x-4">
            {['Easy', 'Medium', 'Hard'].map((level) => (
              <label key={level} className="flex items-center space-x-1">
                <input
                  type="radio"
                  name="difficulty"
                  value={level}
                  checked={difficulty === level}
                  onChange={() => setDifficulty(level)}
                />
                <span className="dark:text-gray-200">{level}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Test Type */}
        <div className="mb-4">
          <label className="block font-semibold mb-2 dark:text-gray-200">Test Format</label>
          <select
            value={testType}
            onChange={(e) => setTestType(e.target.value)}
            className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="Mock Test">Mock Test</option>
            <option value="Practice Test">Practice Test</option>
            <option value="Timed Quiz">Timed Quiz</option>
          </select>
        </div>

        {/* Duration */}
        <div className="mb-4">
          <label className="block font-semibold mb-2 dark:text-gray-200">Test Duration (minutes)</label>
          <input
            type="number"
            value={testDuration}
            onChange={(e) => {
              // Check if the input is empty
              if (e.target.value === '') {
                setTestDuration(''); // Allow empty value
              } else {
                const value = parseInt(e.target.value);
                setTestDuration(value);
              }
              setErrors([]);
            }}
            className={`w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white ${(testDuration < 15 || testDuration > 180) && errors.length > 0 ? 'border-red-500' : ''}`}
            min="15"
            max="180"
          />
          {testDuration < 15 && testDuration !== '' && (
            <p className="text-red-500 text-sm mt-1">Test duration must be at least 15 minutes</p>
          )}
          {testDuration > 180 && (
            <p className="text-red-500 text-sm mt-1">Test duration must not exceed 180 minutes</p>
          )}
        </div>

        {/* Error Messages Display */}
        {errors.length > 0 && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
            <p className="font-medium text-red-700 mb-1">Please correct the following:</p>
            <ul className="list-disc pl-5 text-red-600">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        <button
          onClick={handleSubmit}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Start Test
        </button>
      </div>
    </div>
  );
};

export default MockTestSelection;