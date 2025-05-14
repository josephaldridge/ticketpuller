import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Chip,
  Stack,
  Alert,
  Snackbar,
  Link,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import * as XLSX from 'xlsx';
import { testConnection, fetchTickets } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

const TicketViewer = ({ setTickets, setSearchParams, searchParams, resetAll }) => {
  const [organizations, setOrganizations] = useState(searchParams.organizations || []);
  const [newOrg, setNewOrg] = useState('');
  const [startDate, setStartDate] = useState(searchParams.startDate || null);
  const [endDate, setEndDate] = useState(searchParams.endDate || new Date());
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const navigate = useNavigate();

  useEffect(() => {
    testBackendConnection();
  }, []);

  const testBackendConnection = async () => {
    try {
      const response = await testConnection();
      setConnectionStatus('connected');
      showSnackbar('Backend connection successful!', 'success');
    } catch (error) {
      setConnectionStatus('disconnected');
      showSnackbar('Backend connection failed. Please check if the server is running.', 'error');
    }
  };

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleAddOrganization = () => {
    if (newOrg && !organizations.includes(newOrg)) {
      setOrganizations([...organizations, newOrg]);
      setNewOrg('');
    }
  };

  const handleRemoveOrganization = (orgToRemove) => {
    setOrganizations(organizations.filter(org => org !== orgToRemove));
  };

  const handleExport = async () => {
    if (!organizations.length || !startDate || !endDate) {
      showSnackbar('Please fill in all fields', 'warning');
      return;
    }

    setLoading(true);
    try {
      const tickets = await fetchTickets(organizations, startDate, endDate);
      
      if (tickets.length === 0) {
        showSnackbar('No tickets found for the selected criteria', 'info');
        setLoading(false);
        return;
      }

      // Format data for export
      const exportData = tickets.map(ticket => ({
        'Office ID': ticket.organization_id,
        'Ticket ID': ticket.id,
        'Department': ticket.group_name || '',
        'Ticket Subject': ticket.subject,
        'Ticket Status': ticket.status,
        'Date Created': ticket.created_at,
        'Ticket Link': `https://libertytax.zendesk.com/agent/tickets/${ticket.id}`
      }));

      // Create worksheet with new column order
      const ws = XLSX.utils.json_to_sheet(exportData, { header: [
        'Office ID',
        'Ticket ID',
        'Department',
        'Ticket Subject',
        'Ticket Status',
        'Date Created',
        'Ticket Link'
      ] });

      // Make Ticket ID a clickable link (now column B) as a true hyperlink, and prefix with '🔗'
      tickets.forEach((ticket, idx) => {
        const row = idx + 2; // 1-based, row 1 is header
        ws[`B${row}`] = {
          t: 's',
          v: `🔗 ${ticket.id}`,
          l: { Target: `https://libertytax.zendesk.com/agent/tickets/${ticket.id}` }
        };
      });

      // Remove Ticket Link column from visible sheet
      ws['!cols'] = [
        { wch: 15 }, // Office ID
        { wch: 20 }, // Ticket ID
        { wch: 25 }, // Department
        { wch: 40 }, // Ticket Subject
        { wch: 15 }, // Ticket Status
        { wch: 20 }, // Date Created
        { hidden: true } // Ticket Link (hidden)
      ];

      // Add table-like borders to all cells (keep this for future, but note styling is limited in open-source xlsx)
      const range = XLSX.utils.decode_range(ws['!ref']);
      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cell_address = XLSX.utils.encode_cell({ r: R, c: C });
          if (!ws[cell_address]) continue;
          ws[cell_address].s = ws[cell_address].s || {};
          ws[cell_address].s.border = {
            top: { style: 'thin', color: { rgb: 'CCCCCC' } },
            bottom: { style: 'thin', color: { rgb: 'CCCCCC' } },
            left: { style: 'thin', color: { rgb: 'CCCCCC' } },
            right: { style: 'thin', color: { rgb: 'CCCCCC' } },
          };
        }
      }

      // Create workbook and append sheet
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Tickets');

      // Save file
      XLSX.writeFile(wb, 'zendesk_tickets.xlsx');
      showSnackbar('Tickets exported successfully!', 'success');
    } catch (error) {
      console.error('Error exporting tickets:', error);
      showSnackbar('Error exporting tickets. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleViewTickets = async () => {
    if (!organizations.length || !startDate || !endDate) {
      showSnackbar('Please fill in all fields', 'warning');
      return;
    }
    setLoading(true);
    try {
      const tickets = await fetchTickets(organizations, startDate, endDate);
      setTickets(tickets);
      setSearchParams({ organizations, startDate, endDate });
      navigate('/view-tickets');
    } catch (error) {
      showSnackbar('Error fetching tickets. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Reset all fields and state
  const handleStartOver = () => {
    setOrganizations([]);
    setNewOrg('');
    setStartDate(null);
    setEndDate(new Date());
    resetAll();
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Typography variant="h4" component="h1">
            Zendesk Ticket Viewer
          </Typography>
          <Button variant="outlined" color="error" onClick={handleStartOver} sx={{ ml: 2 }}>
            Start Over
          </Button>
          <Button
            variant="outlined"
            onClick={testBackendConnection}
            color={connectionStatus === 'connected' ? 'success' : 'error'}
          >
            {connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}
          </Button>
        </Stack>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Office ID
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
            <TextField
              label=""
              placeholder="Please enter Office ID"
              value={newOrg}
              onChange={(e) => setNewOrg(e.target.value)}
              size="small"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddOrganization();
                }
              }}
            />
            <Button
              variant="contained"
              onClick={handleAddOrganization}
              disabled={!newOrg}
            >
              Add
            </Button>
          </Stack>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {organizations.map((org) => (
              <Chip
                key={org}
                label={org}
                onDelete={() => handleRemoveOrganization(org)}
                sx={{ m: 0.5 }}
              />
            ))}
          </Stack>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Date Range
          </Typography>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Stack direction="row" spacing={2}>
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={setStartDate}
                renderInput={(params) => <TextField {...params} />}
              />
              <DatePicker
                label="End Date"
                value={endDate}
                onChange={setEndDate}
                renderInput={(params) => <TextField {...params} />}
              />
            </Stack>
          </LocalizationProvider>
        </Box>

        <Button
          variant="contained"
          color="primary"
          onClick={handleExport}
          disabled={loading || !organizations.length || !startDate || !endDate}
          fullWidth
        >
          {loading ? 'Exporting...' : 'Export to Excel'}
        </Button>
        <Button
          variant="outlined"
          color="secondary"
          onClick={handleViewTickets}
          disabled={loading || !organizations.length || !startDate || !endDate}
          fullWidth
          sx={{ mt: 2 }}
        >
          {loading ? 'Loading...' : 'View Tickets'}
        </Button>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default TicketViewer; 