// Configuración de Google Calendar
const config = {
    clientId: '685401652531-8fl9ff2v45th7l3mjh52ichsn62rg5ut.apps.googleusercontent.com',
    scope: 'https://www.googleapis.com/auth/calendar.events',
    discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest']
};

// Variables globales
let selectedDate = null;
let selectedSlot = null;

// Inicializar el cliente de Google
function initClient() {
    console.log('Iniciando cliente de Google Calendar...');
    
    // Verificar que gapi esté disponible
    if (!window.gapi) {
        const error = 'Error: API de Google no está disponible';
        console.error(error);
        showError(error);
        return;
    }

    gapi.client.init({
        clientId: config.clientId,
        scope: config.scope,
        discoveryDocs: config.discoveryDocs
    }).then(() => {
        console.log('Cliente de Google Calendar inicializado correctamente');
        setupEventListeners();
    }).catch((error) => {
        console.error('Error al inicializar Google Calendar:', error);
        showError('Error al inicializar el calendario: ' + (error.details || error.message || 'Error desconocido'));
    });
}

// Función para mostrar errores en el modal
function showError(message) {
    const timeSlotsContainer = document.getElementById('timeSlots');
    if (timeSlotsContainer) {
        timeSlotsContainer.innerHTML = `<p style="color: red;">${message}</p>`;
    }
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
    }

    // Formulario de cita
    const appointmentForm = document.getElementById('appointmentForm');
    if (appointmentForm) {
        appointmentForm.addEventListener('submit', handleAppointmentSubmit);
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
    loadAvailableSlots();
}

// Cerrar el modal del calendario
function closeCalendarModal() {
    const modal = document.getElementById('calendarModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Cargar slots disponibles
function loadAvailableSlots() {
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
    if (!container) return;

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
        notes: form.querySelector('textarea').value
    };

    try {
        const event = {
            'summary': `Demo Workfuel AI con ${formData.name}`,
            'description': formData.notes,
            'start': {
                'dateTime': selectedSlot.start,
                'timeZone': 'America/Panama'
            },
            'end': {
                'dateTime': selectedSlot.end,
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
    console.log('DOM cargado, cargando APIs de Google...');
    gapi.load('client:auth2', initClient);
}); 