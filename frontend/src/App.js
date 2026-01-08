import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ConsumerView from './pages/ConsumerView';
import ConsumerSignup from './pages/ConsumerSignup';
import CreatorLogin from './pages/CreatorLogin';
import Home from './pages/Home';
import PrivateRoute from './components/PrivateRoute';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<ConsumerView />} />
            <Route path="/consumer-signup" element={<ConsumerSignup />} />
            <Route path="/creator-login" element={<CreatorLogin />} />
            <Route
              path="/home"
              element={
                <PrivateRoute>
                  <Home />
                </PrivateRoute>
              }
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
