import { db } from '../Auth/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';

/**
 * IMPORTANT: This service requires Firestore indexes to be created
 * 
 * Required Index:
 * Collection: testResults
 * Fields: uid (Ascending), timestamp (Descending)
 * 
 * Create this index in Firebase Console:
 * Firestore Database → Indexes → Create Index
 * 
 * Security Rules Required:
 * rules_version = '2';
 * service cloud.firestore {
 *   match /databases/{database}/documents {
 *     match /users/{userId} {
 *       allow read, write: if request.auth != null && request.auth.uid == userId;
 *     }
 *     match /testResults/{document=**} {
 *       allow read: if request.auth != null && request.auth.uid == resource.data.uid;
 *       allow write: if request.auth != null && request.auth.uid == request.resource.data.uid;
 *       allow create: if request.auth != null && request.auth.uid == request.resource.data.uid;
 *     }
 *   }
 * }
 */

/**
 * Create or update user profile in Firestore
 * @param {string} uid - User ID
 * @param {object} userData - User data
 */
export const createOrUpdateUserProfile = async (uid, userData) => {
  try {
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      // Create new user profile
      await setDoc(userRef, {
        uid,
        email: userData.email,
        displayName: userData.displayName || null,
        photoURL: userData.photoURL || null,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        preferences: {
          favoriteSubject: null,
          preferredDifficulty: 'Medium',
          studyGoal: 'JEE Main',
          targetScore: 90
        },
        statistics: {
          totalTests: 0,
          totalTimeSpent: 0,
          averageScore: 0,
          strongSubjects: [],
          weakChapters: [],
          currentStreak: 0,
          longestStreak: 0,
          lastTestDate: null
        }
      });
    } else {
      // Update last login
      await updateDoc(userRef, {
        lastLoginAt: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error creating/updating user profile:', error);
    throw error;
  }
};

/**
 * Get user profile from Firestore
 * @param {string} uid - User ID
 * @returns {object} User profile data
 */
export const getUserProfile = async (uid) => {
  try {
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      return userDoc.data();
    }
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

/**
 * Save test result to Firestore
 * @param {string} uid - User ID
 * @param {object} testData - Test result data
 */
export const saveTestResult = async (uid, testData) => {
  try {
    const testId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const testRef = doc(db, 'testResults', testId);
    
    await setDoc(testRef, {
      testId,
      uid,
      timestamp: serverTimestamp(),
      ...testData
    });

    // Update user statistics
    await updateUserStatistics(uid, testData);
    
    return testId;
  } catch (error) {
    console.error('Error saving test result:', error);
    throw error;
  }
};

/**
 * Update user statistics after test completion
 * @param {string} uid - User ID
 * @param {object} testData - Test result data
 */
const updateUserStatistics = async (uid, testData) => {
  try {
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) return;

    const currentStats = userDoc.data().statistics || {};
    const totalTests = (currentStats.totalTests || 0) + 1;
    const totalTimeSpent = (currentStats.totalTimeSpent || 0) + testData.results.timeTaken;
    const previousAverage = currentStats.averageScore || 0;
    const newAverage = ((previousAverage * (totalTests - 1)) + testData.results.score) / totalTests;

    await updateDoc(userRef, {
      'statistics.totalTests': totalTests,
      'statistics.totalTimeSpent': totalTimeSpent,
      'statistics.averageScore': Math.round(newAverage * 100) / 100,
      'statistics.lastTestDate': serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating user statistics:', error);
  }
};

/**
 * Get user's test history
 * @param {string} uid - User ID
 * @param {number} limitCount - Number of tests to fetch
 * @returns {array} Array of test results
 */
export const getUserTestHistory = async (uid, limitCount = 10) => {
  try {
    const testsRef = collection(db, 'testResults');
    const q = query(
      testsRef,
      where('uid', '==', uid),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const tests = [];
    
    querySnapshot.forEach((doc) => {
      tests.push(doc.data());
    });
    
    return tests;
  } catch (error) {
    console.error('Error fetching test history:', error);
    throw error;
  }
};

/**
 * Get all test results for a user (for comprehensive analytics)
 * @param {string} uid - User ID
 * @returns {array} Array of all test results
 */
export const getAllUserTests = async (uid) => {
  try {
    const testsRef = collection(db, 'testResults');
    const q = query(
      testsRef,
      where('uid', '==', uid),
      orderBy('timestamp', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const tests = [];
    
    querySnapshot.forEach((doc) => {
      tests.push(doc.data());
    });
    
    return tests;
  } catch (error) {
    console.error('Error fetching all tests:', error);
    throw error;
  }
};

/**
 * Update user preferences
 * @param {string} uid - User ID
 * @param {object} preferences - Updated preferences
 */
export const updateUserPreferences = async (uid, preferences) => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      preferences: preferences
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    throw error;
  }
};
