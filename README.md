# Webhook Server

The Webhook Server is a server application that allows you to receive and handle webhook events. It provides an endpoint for receiving POST requests and logs the received events to a file. Additionally, it includes a user-friendly landing page for managing and viewing the webhook events.

## Features

- Receive webhook events via the `/webhook` endpoint.
- Log received events to the `webhook.log` file.
- Real-time event updates using Socket.IO.
- View and manage webhook events through the web interface.
- Integration with Cloudflare for custom domain support.

## Installation

1. Clone the repository:

```shell
git clone https://github.com/Mephisto-Grumpy/webhook-server.git
```

2. Install the dependencies:

```shell
cd webhook-server
npm install
```

3. Start the server:

```shell
npm start
```

4. Open the landing page in your browser:

```shell
open http://localhost:3000
```

## Configuration

The following configuration options are available:

- Port: The server port is set to `3000` by default. You can change it by modifying the `server.listen` line in `index.js`.
- Log File: The webhook events are logged to the `webhook.log` file by default. You can change the log file path by modifying the `logFilePath` variable in `index.js`.
- Cloudflare Integration: To use Cloudflare for custom domain support, make sure to update the Cloudflare API key, zone ID, and subdomain name in the `configureCloudflareDNS` function in `index.js`.

## Usage

### Receiving Webhook Events

To receive webhook events, send a POST request to the `/webhook` endpoint with the event payload. The server will log the event and broadcast it to connected clients using Socket.IO.

```shell
curl -X POST -H "Content-Type: application/json" -d '{"event": "Test", "data": "Hello World!"}' http://localhost:3000/webhook
```

### Viewing Webhook Events

You can view the webhook events by accessing the `/events` endpoint in your browser. It will display a user-friendly interface with a list of events and their details.

### Real-Time Event Updates

The server uses Socket.IO for real-time event updates. When a new event is received, it will be automatically displayed in the web interface without requiring a page refresh.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
