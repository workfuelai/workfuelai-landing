const NOTION_API_KEY = 'secret_418306673616ZtDexPCyDSsIsXmfA1kY9ISKVQYIQBr7AZ';
const NOTION_DATABASE_ID = '1da9bd4d546180578ed5d794e3c0934e';

async function submitToNotion(formData) {
    try {
        const response = await fetch('https://api.notion.com/v1/pages', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${NOTION_API_KEY}`,
                'Content-Type': 'application/json',
                'Notion-Version': '2022-06-28'
            },
            body: JSON.stringify({
                parent: { database_id: NOTION_DATABASE_ID },
                properties: {
                    Name: {
                        title: [
                            {
                                text: {
                                    content: formData.name
                                }
                            }
                        ]
                    },
                    Email: {
                        email: formData.email
                    },
                    Phone: {
                        phone_number: formData.phone || ''
                    },
                    Industry: {
                        select: {
                            name: formData.industry
                        }
                    },
                    Message: {
                        rich_text: [
                            {
                                text: {
                                    content: formData.message || ''
                                }
                            }
                        ]
                    },
                    Status: {
                        select: {
                            name: "Nuevo"
                        }
                    }
                }
            })
        });

        if (!response.ok) {
            throw new Error('Error submitting to Notion');
        }

        return true;
    } catch (error) {
        console.error('Error:', error);
        return false;
    }
} 