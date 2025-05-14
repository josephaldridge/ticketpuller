import React, { useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import TicketViewer from './components/TicketViewer';
import ViewTicketsPage from './components/ViewTicketsPage';
import Login from './components/Login';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from './firebase';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#003366', // Deep blue
      contrastText: '#fff',
    },
    secondary: {
      main: '#B22234', // Strong red
      contrastText: '#fff',
    },
    background: {
      default: '#fff', // White background
      paper: '#fff',
    },
    success: {
      main: '#3CB371', // MediumSeaGreen
    },
    error: {
      main: '#B22234', // Use the same red for errors
    },
    warning: {
      main: '#FFD700', // Gold
    },
    info: {
      main: '#4682B4', // Steel Blue
    },
  },
  typography: {
    fontFamily: 'Segoe UI, Roboto, Arial, sans-serif',
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
});

function App() {
  // State to share tickets and search params between pages
  const [tickets, setTickets] = useState([]);
  const [searchParams, setSearchParams] = useState({ organizations: [], startDate: null, endDate: null });
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('firebaseToken'));

  // Function to reset all data
  const resetAll = () => {
    setTickets([]);
    setSearchParams({ organizations: [], startDate: null, endDate: null });
  };

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem('firebaseToken');
    setIsLoggedIn(false);
    window.location.reload();
  };

  if (!isLoggedIn) {
    return <Login onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div style={{ position: 'fixed', top: 20, right: 30, zIndex: 1000 }}>
        <button onClick={handleLogout} style={{ padding: '8px 16px', background: '#B22234', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
          Logout
        </button>
      </div>
      <Router>
        <Routes>
          <Route path="/" element={<TicketViewer setTickets={setTickets} setSearchParams={setSearchParams} searchParams={searchParams} resetAll={resetAll} />} />
          <Route path="/view-tickets" element={<ViewTicketsPage tickets={tickets} searchParams={searchParams} resetAll={resetAll} />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
