import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Stack,
  TextField,
} from '@mui/material';
import * as XLSX from 'xlsx';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fetchTickets } from '../services/api';

const columns = [
  { id: 'organization_id', label: 'Office ID', minWidth: 100 },
  { id: 'ticket_id', label: 'Ticket ID', minWidth: 100 },
  { id: 'department', label: 'Department', minWidth: 120 },
  { id: 'subject', label: 'Ticket Subject', minWidth: 200 },
  { id: 'status', label: 'Ticket Status', minWidth: 100 },
  { id: 'created_at', label: 'Date Created', minWidth: 160 },
];

function formatTicketForTable(ticket) {
  return {
    organization_id: ticket.organization_id,
    ticket_id: ticket.id,
    department: ticket.group_name || '',
    subject: ticket.subject,
    status: ticket.status,
    created_at: ticket.created_at,
    link: `https://libertytax.zendesk.com/agent/tickets/${ticket.id}`,
  };
}

const ViewTicketsPage = ({ tickets, searchParams, resetAll }) => {
  const navigate = useNavigate();
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(50);
  const [offices, setOffices] = React.useState(searchParams.organizations || []);
  const [newOffice, setNewOffice] = React.useState('');
  const [startDate, setStartDate] = React.useState(searchParams.startDate || null);
  const [endDate, setEndDate] = React.useState(searchParams.endDate || new Date());
  const [loading, setLoading] = React.useState(false);
  const [tableTickets, setTableTickets] = React.useState(tickets);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  const handleAddOffice = () => {
    if (newOffice && !offices.includes(newOffice)) {
      setOffices([...offices, newOffice]);
      setNewOffice('');
    }
  };

  const handleRemoveOffice = (office) => {
    setOffices(offices.filter(o => o !== office));
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const refreshed = await fetchTickets(offices, startDate, endDate);
      setTableTickets(refreshed);
      setPage(0);
    } catch (error) {
      alert('Error refreshing tickets.');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const exportData = tableTickets.map(ticket => ({
      'Office ID': ticket.organization_id,
      'Ticket ID': ticket.id,
      'Department': ticket.group_name || '',
      'Ticket Subject': ticket.subject,
      'Ticket Status': ticket.status,
      'Date Created': ticket.created_at,
      'Ticket Link': `https://libertytax.zendesk.com/agent/tickets/${ticket.id}`
    }));
    const ws = XLSX.utils.json_to_sheet(exportData, { header: [
      'Office ID',
      'Ticket ID',
      'Department',
      'Ticket Subject',
      'Ticket Status',
      'Date Created',
      'Ticket Link'
    ] });
    tableTickets.forEach((ticket, idx) => {
      const row = idx + 2;
      ws[`B${row}`] = {
        t: 's',
        v: `🔗 ${ticket.id}`,
        l: { Target: `https://libertytax.zendesk.com/agent/tickets/${ticket.id}` }
      };
    });
    ws['!cols'] = [
      { wch: 15 }, // Office ID
      { wch: 20 }, // Ticket ID
      { wch: 25 }, // Department
      { wch: 40 }, // Ticket Subject
      { wch: 15 }, // Ticket Status
      { wch: 20 }, // Date Created
      { hidden: true } // Ticket Link (hidden)
    ];
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
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Tickets');
    XLSX.writeFile(wb, 'zendesk_tickets.xlsx');
  };

  const handleStartOver = () => {
    resetAll();
    navigate('/');
  };

  const rows = tableTickets.map(formatTicketForTable);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Typography variant="h4" component="h1">
            Ticket Results
          </Typography>
          <Button variant="outlined" color="error" onClick={handleStartOver} sx={{ ml: 2 }}>
            Start Over
          </Button>
          <Button variant="outlined" color="primary" onClick={() => navigate('/')}>Back</Button>
        </Stack>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>Office IDs</Typography>
          <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
            <TextField
              label="Office ID"
              value={newOffice}
              onChange={e => setNewOffice(e.target.value)}
              size="small"
              onKeyDown={e => { if (e.key === 'Enter') handleAddOffice(); }}
            />
            <Button variant="contained" onClick={handleAddOffice} disabled={!newOffice}>Add</Button>
          </Stack>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {offices.map(office => (
              <Chip key={office} label={office} onDelete={() => handleRemoveOffice(office)} sx={{ m: 0.5 }} />
            ))}
          </Stack>
        </Box>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>Date Range</Typography>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Stack direction="row" spacing={2}>
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={setStartDate}
                renderInput={params => <TextField {...params} />}
              />
              <DatePicker
                label="End Date"
                value={endDate}
                onChange={setEndDate}
                renderInput={params => <TextField {...params} />}
              />
            </Stack>
          </LocalizationProvider>
        </Box>
        <Box sx={{ mb: 2 }}>
          <Button variant="contained" color="secondary" onClick={handleRefresh} disabled={loading || offices.length === 0 || !startDate || !endDate}>
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </Button>
        </Box>
        <Box sx={{ mb: 2 }}>
          <Button variant="contained" color="primary" onClick={handleExport} sx={{ mr: 2 }}>
            Export to Excel
          </Button>
        </Box>
        <TableContainer sx={{ borderRadius: 2, border: '1px solid #e0e0e0' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <TableCell key={column.id} style={{ minWidth: column.minWidth, fontWeight: 'bold', background: '#f4fafd' }}>
                    {column.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row, idx) => (
                <TableRow hover tabIndex={-1} key={row.ticket_id}>
                  <TableCell>{row.organization_id}</TableCell>
                  <TableCell>
                    <a href={row.link} target="_blank" rel="noopener noreferrer" style={{ color: '#1976d2', textDecoration: 'underline' }}>
                      🔗 {row.ticket_id}
                    </a>
                  </TableCell>
                  <TableCell>{row.department}</TableCell>
                  <TableCell>{row.subject}</TableCell>
                  <TableCell>
                    <Chip label={row.status} color={row.status === 'open' ? 'success' : row.status === 'pending' ? 'warning' : 'default'} size="small" />
                  </TableCell>
                  <TableCell>{row.created_at}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[50, 100, 500]}
          component="div"
          count={rows.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Container>
  );
};

export default ViewTicketsPage; 