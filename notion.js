const WEBHOOK_URL = 'https://primary-production-5324.up.railway.app/webhook-test/428a62dd-e39b-423b-999a-ee1fb2b0de35';

async function submitToNotion(formData) {
    try {
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nombre: formData.name,
                email: formData.email,
                telefono: formData.phone || '',
                industria: formData.industry,
                mensaje: formData.message || '',
                fecha: new Date().toISOString()
            })
        });

        if (!response.ok) {
            throw new Error('Error al enviar el formulario');
        }

        return true;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
} 