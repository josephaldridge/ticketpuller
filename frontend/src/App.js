import React, { useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import TicketViewer from './components/TicketViewer';
import ViewTicketsPage from './components/ViewTicketsPage';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

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

  // Function to reset all data
  const resetAll = () => {
    setTickets([]);
    setSearchParams({ organizations: [], startDate: null, endDate: null });
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
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
