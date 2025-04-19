const NOTION_API_KEY = 'secret_418306673616ZtDexPCyDSsIsXmfA1kY9ISKVQYIQBr7AZ';
const NOTION_DATABASE_ID = '1da9bd4d546180578ed5d794e3c0934e';

async function submitToNotion(formData) {
    try {
        const response = await fetch('https://api.notion.com/v1/pages', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${NOTION_API_KEY}`,
                'Content-Type': 'application/json',
                'Notion-Version': '2022-06-28',
                'Access-Control-Allow-Origin': '*'
            },
            mode: 'cors',
            body: JSON.stringify({
                parent: { database_id: NOTION_DATABASE_ID },
                properties: {
                    'Nombre': {
                        title: [
                            {
                                text: {
                                    content: formData.name
                                }
                            }
                        ]
                    },
                    'Email': {
                        email: formData.email
                    },
                    'Teléfono': {
                        rich_text: [
                            {
                                text: {
                                    content: formData.phone || ''
                                }
                            }
                        ]
                    },
                    'Industria': {
                        select: {
                            name: formData.industry
                        }
                    },
                    'Mensaje': {
                        rich_text: [
                            {
                                text: {
                                    content: formData.message || ''
                                }
                            }
                        ]
                    },
                    'Estado': {
                        select: {
                            name: "Nuevo"
                        }
                    }
                }
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            console.error('Notion API Error:', data);
            throw new Error(`Error submitting to Notion: ${data.message || 'Unknown error'}`);
        }

        console.log('Success:', data);
        return true;
    } catch (error) {
        console.error('Detailed Error:', error);
        throw error;
    }
} 