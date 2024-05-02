async function verifyEmail(email) {
    const domain = email.split('@')[1];

    try {
        const mxRecordsResponse = await fetch(`https://dns.google/resolve?name=${domain}&type=MX`);
        const mxRecordsData = await mxRecordsResponse.json();
        const mxRecords = mxRecordsData.Answer;
        const mxHostname = mxRecords[0].data;

        const response = await fetch(`https://${mxHostname}:587`, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain',
            },
            body: `EHLO example.com\r\nMAIL FROM: <me@example.com>\r\nRCPT TO: <${email}>\r\n`,
        });

        const responseData = await response.text();
        console.log(responseData);

        if (responseData.includes('250')) {
            console.log(`Email ${email} exists`);
        } else {
            console.log(`Email ${email} does not exist`);
        }
    } catch (err) {
        //console.error('Error:', err);
    }
}

// Example usage
const emailToVerify = 'aaron@example.com';
verifyEmail(emailToVerify);
