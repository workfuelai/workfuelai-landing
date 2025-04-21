const express = require('express');
const { google } = require('googleapis');
const config = require('./config');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// Configurar el cliente OAuth2
const oauth2Client = new google.auth.OAuth2(
    config.clientId,
    config.clientSecret,
    config.redirectUri
);

// Configurar el calendario
const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

// Endpoint para obtener horarios disponibles
app.get('/api/available-slots', async (req, res) => {
    try {
        const { date } = req.query;
        const startTime = new Date(date);
        const endTime = new Date(startTime);
        endTime.setDate(startTime.getDate() + 1);

        const response = await calendar.freebusy.query({
            resource: {
                timeMin: startTime.toISOString(),
                timeMax: endTime.toISOString(),
                items: [{ id: config.calendarId }]
            }
        });

        // Procesar los horarios ocupados y devolver los disponibles
        const busySlots = response.data.calendars[config.calendarId].busy;
        const availableSlots = getAvailableSlots(startTime, endTime, busySlots);

        res.json({ availableSlots });
    } catch (error) {
        console.error('Error al obtener horarios:', error);
        res.status(500).json({ error: 'Error al obtener horarios disponibles' });
    }
});

// Endpoint para crear una cita
app.post('/api/schedule-meeting', async (req, res) => {
    try {
        const { startTime, endTime, attendeeEmail, summary } = req.body;

        const event = {
            summary: summary || 'Demo Workfuel AI',
            start: {
                dateTime: startTime,
                timeZone: 'America/Bogota',
            },
            end: {
                dateTime: endTime,
                timeZone: 'America/Bogota',
            },
            attendees: [{ email: attendeeEmail }],
            conferenceData: {
                createRequest: {
                    requestId: Math.random().toString(36).substring(7),
                    conferenceSolutionKey: { type: 'hangoutsMeet' }
                }
            }
        };

        const response = await calendar.events.insert({
            calendarId: config.calendarId,
            resource: event,
            conferenceDataVersion: 1
        });

        res.json({ 
            success: true, 
            meetingLink: response.data.hangoutLink,
            eventId: response.data.id 
        });
    } catch (error) {
        console.error('Error al agendar cita:', error);
        res.status(500).json({ error: 'Error al agendar la cita' });
    }
});

// Función auxiliar para obtener horarios disponibles
function getAvailableSlots(startTime, endTime, busySlots) {
    const availableSlots = [];
    const workingHours = {
        start: 9, // 9 AM
        end: 17   // 5 PM
    };
    
    let currentTime = new Date(startTime);
    currentTime.setHours(workingHours.start, 0, 0, 0);

    while (currentTime < endTime) {
        if (currentTime.getHours() >= workingHours.start && 
            currentTime.getHours() < workingHours.end) {
            
            const slotEnd = new Date(currentTime);
            slotEnd.setMinutes(currentTime.getMinutes() + 30);

            const isSlotBusy = busySlots.some(busy => {
                const busyStart = new Date(busy.start);
                const busyEnd = new Date(busy.end);
                return currentTime < busyEnd && slotEnd > busyStart;
            });

            if (!isSlotBusy) {
                availableSlots.push({
                    start: currentTime.toISOString(),
                    end: slotEnd.toISOString()
                });
            }
        }
        
        currentTime.setMinutes(currentTime.getMinutes() + 30);
    }

    return availableSlots;
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
}); 