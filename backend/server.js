require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const { format, utcToZonedTime } = require('date-fns-tz');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is working!' });
});

// Get tickets endpoint
app.post('/api/tickets', async (req, res) => {
  try {
    const { organizations, startDate, endDate } = req.body;

    const zendeskEmail = process.env.ZENDESK_EMAIL;
    const zendeskToken = process.env.ZENDESK_API_TOKEN;
    const zendeskSubdomain = process.env.ZENDESK_SUBDOMAIN;
    if (!zendeskEmail || !zendeskToken || !zendeskSubdomain) {
      return res.status(500).json({ error: 'Zendesk credentials not set in .env' });
    }

    const auth = Buffer.from(`${zendeskEmail}/token:${zendeskToken}`).toString('base64');
    let allTickets = [];
    const groupCache = {};
    async function getGroupName(groupId) {
      if (!groupId) return '';
      if (groupCache[groupId]) return groupCache[groupId];
      try {
        const response = await axios.get(`https://${zendeskSubdomain}.zendesk.com/api/v2/groups/${groupId}.json`, {
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/json',
          },
        });
        const name = response.data.group?.name || '';
        groupCache[groupId] = name;
        return name;
      } catch (err) {
        return '';
      }
    }

    // For each Office ID, search for tickets where custom field 360051507174 matches
    for (const officeId of organizations) {
      let url = `https://${zendeskSubdomain}.zendesk.com/api/v2/search.json?query=type:ticket fieldvalue:${officeId}`;
      let hasMore = true;
      let nextPage = url;
      while (hasMore && nextPage) {
        const response = await axios.get(nextPage, {
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/json',
          },
        });
        const tickets = response.data.results || [];
        // Only include tickets where the custom field 360051507174 matches exactly
        const filteredByField = tickets.filter(ticket => {
          if (!ticket.custom_fields) return false;
          return ticket.custom_fields.some(
            field => field.id === 360051507174 && String(field.value) === String(officeId)
          );
        });
        allTickets = allTickets.concat(filteredByField);
        nextPage = response.data.next_page;
        hasMore = !!nextPage;
      }
    }

    // Filter by date range
    const filteredTickets = allTickets.filter(ticket => {
      const created = new Date(ticket.created_at);
      return (
        created >= new Date(startDate) &&
        created <= new Date(endDate)
      );
    });

    // Map to expected format, including group_name
    const mappedTickets = await Promise.all(filteredTickets.map(async ticket => ({
      id: ticket.id,
      subject: ticket.subject,
      description: ticket.description,
      organization_id: ticket.custom_fields.find(f => f.id === 360051507174)?.value || '',
      created_at: format(utcToZonedTime(ticket.created_at, 'America/New_York'), 'yyyy-MM-dd HH:mm:ss'),
      status: ticket.status,
      priority: ticket.priority || '',
      group_name: await getGroupName(ticket.group_id),
    })));

    res.json(mappedTickets);
  } catch (error) {
    const errorDetails = {
      time: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      responseData: error.response?.data,
      requestData: error.config ? {
        url: error.config.url,
        method: error.config.method,
        headers: error.config.headers,
        data: error.config.data
      } : undefined,
    };
    fs.appendFileSync('error.log', JSON.stringify(errorDetails, null, 2) + '\n');
    console.error('Error fetching tickets:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch tickets from Zendesk' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 