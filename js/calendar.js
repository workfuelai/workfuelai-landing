class CalendarUI {
    constructor() {
        this.selectedDate = null;
        this.selectedSlot = null;
        this.availableSlots = [];
        this.init();
    }

    init() {
        this.createCalendarModal();
        this.setupEventListeners();
    }

    createCalendarModal() {
        const modal = document.createElement('div');
        modal.id = 'calendarModal';
        modal.className = 'calendar-modal';
        modal.innerHTML = `
            <div class="calendar-modal-content">
                <span class="close-calendar">&times;</span>
                <h2>Agenda tu Demo</h2>
                <div class="calendar-container">
                    <div class="date-picker">
                        <input type="date" id="datePicker" min="${this.getTodayString()}" />
                    </div>
                    <div class="time-slots" id="timeSlots">
                        <p>Selecciona una fecha para ver los horarios disponibles</p>
                    </div>
                </div>
                <div class="booking-form" style="display: none;">
                    <h3>Confirma tu cita</h3>
                    <form id="bookingForm">
                        <div class="form-group">
                            <input type="text" id="name" required placeholder="Tu nombre" />
                        </div>
                        <div class="form-group">
                            <input type="email" id="email" required placeholder="Tu email" />
                        </div>
                        <div class="form-group">
                            <textarea id="notes" placeholder="Notas adicionales (opcional)"></textarea>
                        </div>
                        <button type="submit" class="submit-booking">Confirmar Demo</button>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    setupEventListeners() {
        // Botón para abrir el calendario
        document.querySelectorAll('[data-calendar-open]').forEach(button => {
            button.addEventListener('click', () => this.openCalendar());
        });

        // Cerrar modal
        const closeBtn = document.querySelector('.close-calendar');
        closeBtn.addEventListener('click', () => this.closeCalendar());

        // Selector de fecha
        const datePicker = document.getElementById('datePicker');
        datePicker.addEventListener('change', (e) => this.handleDateChange(e.target.value));

        // Formulario de reserva
        const bookingForm = document.getElementById('bookingForm');
        bookingForm.addEventListener('submit', (e) => this.handleBookingSubmit(e));
    }

    async handleDateChange(date) {
        try {
            const response = await fetch(`/api/available-slots?date=${date}`);
            const data = await response.json();
            this.availableSlots = data.availableSlots;
            this.renderTimeSlots();
        } catch (error) {
            console.error('Error al obtener horarios:', error);
        }
    }

    renderTimeSlots() {
        const container = document.getElementById('timeSlots');
        if (!this.availableSlots.length) {
            container.innerHTML = '<p>No hay horarios disponibles para esta fecha</p>';
            return;
        }

        container.innerHTML = this.availableSlots
            .map(slot => {
                const startTime = new Date(slot.start);
                return `
                    <button class="time-slot" data-start="${slot.start}" data-end="${slot.end}">
                        ${this.formatTime(startTime)}
                    </button>
                `;
            })
            .join('');

        // Agregar event listeners a los slots
        container.querySelectorAll('.time-slot').forEach(button => {
            button.addEventListener('click', (e) => this.handleSlotSelect(e));
        });
    }

    handleSlotSelect(e) {
        const button = e.target;
        this.selectedSlot = {
            start: button.dataset.start,
            end: button.dataset.end
        };
        
        // Mostrar formulario de reserva
        document.querySelector('.booking-form').style.display = 'block';
        
        // Actualizar UI
        document.querySelectorAll('.time-slot').forEach(slot => {
            slot.classList.remove('selected');
        });
        button.classList.add('selected');
    }

    async handleBookingSubmit(e) {
        e.preventDefault();
        const formData = {
            startTime: this.selectedSlot.start,
            endTime: this.selectedSlot.end,
            attendeeEmail: document.getElementById('email').value,
            name: document.getElementById('name').value,
            notes: document.getElementById('notes').value
        };

        try {
            const response = await fetch('/api/schedule-meeting', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            if (data.success) {
                alert('¡Demo agendada con éxito! Recibirás un email con los detalles de la reunión.');
                this.closeCalendar();
            }
        } catch (error) {
            console.error('Error al agendar cita:', error);
            alert('Hubo un error al agendar la cita. Por favor intenta de nuevo.');
        }
    }

    openCalendar() {
        document.getElementById('calendarModal').style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    closeCalendar() {
        document.getElementById('calendarModal').style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    getTodayString() {
        const today = new Date();
        return today.toISOString().split('T')[0];
    }

    formatTime(date) {
        return date.toLocaleTimeString('es-CO', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    }
}

// Inicializar el calendario
document.addEventListener('DOMContentLoaded', () => {
    new CalendarUI();
});

// Configuración de Google Calendar
const config = {
    clientId: '685401652531-8fl9ff2v45th7l3mjh52ichsn62rg5ut.apps.googleusercontent.com',
    scope: 'https://www.googleapis.com/auth/calendar',
    discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest']
};

// Inicializar el cliente de Google
function initClient() {
    gapi.client.init({
        clientId: config.clientId,
        discoveryDocs: config.discoveryDocs,
        scope: config.scope
    }).then(function() {
        // Escuchar eventos de cambio de estado de autenticación
        gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
        // Manejar el estado inicial de inicio de sesión
        updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
    }).catch(function(error) {
        console.error('Error initializing Google Calendar:', error);
    });
}

// Actualizar la interfaz según el estado de inicio de sesión
function updateSigninStatus(isSignedIn) {
    if (isSignedIn) {
        listUpcomingEvents();
    }
}

// Listar eventos próximos
function listUpcomingEvents() {
    gapi.client.calendar.events.list({
        'calendarId': 'primary',
        'timeMin': (new Date()).toISOString(),
        'showDeleted': false,
        'singleEvents': true,
        'maxResults': 10,
        'orderBy': 'startTime'
    }).then(function(response) {
        const events = response.result.items;
        if (events.length > 0) {
            // Mostrar eventos
            events.forEach(event => {
                console.log(event.summary + ' (' + event.start.dateTime + ')');
            });
        }
    });
}

// Crear un nuevo evento
function createCalendarEvent(eventDetails) {
    const event = {
        'summary': eventDetails.summary,
        'description': eventDetails.description,
        'start': {
            'dateTime': eventDetails.startTime,
            'timeZone': 'America/Panama'
        },
        'end': {
            'dateTime': eventDetails.endTime,
            'timeZone': 'America/Panama'
        }
    };

    return gapi.client.calendar.events.insert({
        'calendarId': 'primary',
        'resource': event
    });
}

// Manejar el envío del formulario
document.addEventListener('DOMContentLoaded', function() {
    const calendarButtons = document.querySelectorAll('[data-calendar-open]');
    
    calendarButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Aquí implementaremos la apertura del modal del calendario
            showCalendarModal();
        });
    });
});

// Mostrar el modal del calendario
function showCalendarModal() {
    // Implementaremos esta función cuando creemos el HTML del modal
    console.log('Mostrar modal del calendario');
} 