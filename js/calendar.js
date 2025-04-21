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

// Variables globales
let selectedDate = null;
let selectedSlot = null;

// Inicializar el cliente de Google
function initClient() {
    console.log('Iniciando cliente de Google Calendar...');
    
    gapi.client.init({
        clientId: config.clientId,
        discoveryDocs: config.discoveryDocs,
        scope: config.scope
    }).then(function() {
        console.log('Cliente de Google Calendar inicializado correctamente');
        // Configurar los listeners de eventos después de inicializar
        setupEventListeners();
        
        // Verificar si el usuario está autenticado
        if (!gapi.auth2.getAuthInstance().isSignedIn.get()) {
            console.log('Usuario no autenticado, solicitando autorización...');
            gapi.auth2.getAuthInstance().signIn();
        }
    }).catch(function(error) {
        console.error('Error al inicializar Google Calendar:', error);
        // Mostrar el error en el modal
        const timeSlotsContainer = document.getElementById('timeSlots');
        timeSlotsContainer.innerHTML = `<p style="color: red;">Error al cargar el calendario: ${error.message}</p>`;
    });
}

// Configurar event listeners
function setupEventListeners() {
    console.log('Configurando event listeners...');
    
    // Botones para abrir el calendario
    document.querySelectorAll('[data-calendar-open]').forEach(button => {
        button.addEventListener('click', openCalendarModal);
    });

    // Botón para cerrar el calendario
    const closeButton = document.querySelector('.calendar-close');
    if (closeButton) {
        closeButton.addEventListener('click', closeCalendarModal);
    } else {
        console.error('No se encontró el botón de cerrar');
    }

    // Formulario de cita
    const appointmentForm = document.getElementById('appointmentForm');
    if (appointmentForm) {
        appointmentForm.addEventListener('submit', handleAppointmentSubmit);
    } else {
        console.error('No se encontró el formulario de cita');
    }
}

// Abrir el modal del calendario
function openCalendarModal() {
    console.log('Abriendo modal del calendario');
    const modal = document.getElementById('calendarModal');
    if (!modal) {
        console.error('No se encontró el modal del calendario');
        return;
    }
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Verificar autenticación antes de cargar slots
    if (gapi.auth2.getAuthInstance().isSignedIn.get()) {
        loadAvailableSlots();
    } else {
        console.log('Usuario no autenticado, solicitando inicio de sesión...');
        gapi.auth2.getAuthInstance().signIn().then(() => {
            loadAvailableSlots();
        }).catch(error => {
            console.error('Error al autenticar:', error);
            const timeSlotsContainer = document.getElementById('timeSlots');
            timeSlotsContainer.innerHTML = '<p style="color: red;">Error al autenticar con Google Calendar</p>';
        });
    }
}

// Cerrar el modal del calendario
function closeCalendarModal() {
    const modal = document.getElementById('calendarModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Cargar slots disponibles
async function loadAvailableSlots() {
    const today = new Date();
    const slots = [];
    
    // Generar slots para los próximos 5 días laborables
    for (let i = 0; i < 5; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        
        // Solo días de semana
        if (date.getDay() !== 0 && date.getDay() !== 6) {
            // Horarios de 9 AM a 5 PM
            for (let hour = 9; hour < 17; hour++) {
                const slot = new Date(date);
                slot.setHours(hour, 0, 0, 0);
                slots.push({
                    start: slot.toISOString(),
                    end: new Date(slot.setHours(hour + 1)).toISOString()
                });
            }
        }
    }

    renderTimeSlots(slots);
}

// Renderizar slots de tiempo disponibles
function renderTimeSlots(slots) {
    const container = document.getElementById('timeSlots');
    container.innerHTML = slots.map(slot => {
        const startTime = new Date(slot.start);
        return `
            <button class="time-slot" data-start="${slot.start}" data-end="${slot.end}">
                ${formatTime(startTime)}
            </button>
        `;
    }).join('');

    // Agregar event listeners a los slots
    container.querySelectorAll('.time-slot').forEach(button => {
        button.addEventListener('click', handleSlotSelect);
    });
}

// Manejar la selección de un slot
function handleSlotSelect(event) {
    // Remover selección previa
    document.querySelectorAll('.time-slot').forEach(slot => {
        slot.classList.remove('selected');
    });

    // Marcar el nuevo slot como seleccionado
    event.target.classList.add('selected');
    selectedSlot = {
        start: event.target.dataset.start,
        end: event.target.dataset.end
    };
}

// Manejar el envío del formulario
async function handleAppointmentSubmit(event) {
    event.preventDefault();

    if (!selectedSlot) {
        alert('Por favor selecciona un horario disponible');
        return;
    }

    const form = event.target;
    const formData = {
        name: form.querySelector('input[type="text"]').value,
        email: form.querySelector('input[type="email"]').value,
        notes: form.querySelector('textarea').value,
        startTime: selectedSlot.start,
        endTime: selectedSlot.end
    };

    try {
        const event = {
            'summary': `Demo Workfuel AI con ${formData.name}`,
            'description': formData.notes,
            'start': {
                'dateTime': formData.startTime,
                'timeZone': 'America/Panama'
            },
            'end': {
                'dateTime': formData.endTime,
                'timeZone': 'America/Panama'
            },
            'attendees': [
                {'email': formData.email}
            ]
        };

        await gapi.client.calendar.events.insert({
            'calendarId': 'primary',
            'resource': event,
            'sendUpdates': 'all'
        });

        alert('¡Demo agendada con éxito! Recibirás un email con los detalles de la reunión.');
        closeCalendarModal();
    } catch (error) {
        console.error('Error al agendar la cita:', error);
        alert('Hubo un error al agendar la cita. Por favor intenta de nuevo.');
    }
}

// Función auxiliar para formatear la hora
function formatTime(date) {
    return date.toLocaleTimeString('es-CO', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM cargado, iniciando configuración de Google Calendar...');
    // Cargar la API de Google Calendar
    gapi.load('client:auth2', function() {
        console.log('APIs de Google cargadas, iniciando cliente...');
        initClient();
    });
}); 