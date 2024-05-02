const { Socket } = require('net');

async function verifyEmail(email) {
    const domain = email.split('@')[1];

    try {
        // Resolve MX records for the domain
        const mxRecordsResponse = await fetch(`https://dns.google/resolve?name=${domain}&type=MX`);
        const mxRecordsData = await mxRecordsResponse.json();
        const mxRecords = mxRecordsData.Answer;
        const mxHostname = mxRecords[0].data;

        // Connect to the mail server using port 587
        const socket = new Socket();
        socket.connect(587, mxHostname, async () => {
            console.log(`Connected to ${mxHostname} on port 587`);

            // Read initial response from the server
            const initialResponse = (await readResponse(socket)).trim();
            console.log(initialResponse);

            // Send EHLO command to identify the client
            await sendCommand(socket, `EHLO example.com`);
            
            // Send STARTTLS command to initiate secure connection (optional but recommended)
            await sendCommand(socket, `STARTTLS`);

            // Upgrade the socket to TLS if STARTTLS is supported
            socket = tls.connect({
                socket: socket,
                rejectUnauthorized: false // Insecure; for testing purposes only
            });

            // Send MAIL FROM command
            await sendCommand(socket, `MAIL FROM: <me@example.com>`);

            // Send RCPT TO command with the email address to verify
            await sendCommand(socket, `RCPT TO: <${email}>`);

            // Read response after RCPT TO command
            const response = (await readResponse(socket)).trim();
            console.log(response);

            if (response.includes('250')) {
                console.log(`Email ${email} exists`);
            } else {
                console.log(`Email ${email} does not exist`);
            }

            // Close the socket connection
            socket.end();
        });

        // Helper function to send SMTP command
        async function sendCommand(socket, command) {
            return new Promise((resolve, reject) => {
                socket.write(`${command}\r\n`, 'utf8', () => {
                    resolve();
                });
            });
        }

        // Helper function to read response from socket
        async function readResponse(socket) {
            return new Promise((resolve, reject) => {
                let responseData = '';
                socket.on('data', (data) => {
                    responseData += data.toString();
                    if (responseData.endsWith('\r\n')) {
                        resolve(responseData);
                    }
                });
            });
        }
    } catch (err) {
        console.error('Error:', err);
    }
}

// Example usage
const emailToVerify = 'aaron@example.com';
verifyEmail(emailToVerify);
