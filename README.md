# AlarmWatcher

AlarmWatcher is a versatile, self-hosted and intuitive alarm management system designed to serve as the central hub for handling alarms across various applications and systems. Whether you're managing alarms for smart homes, industrial equipment, or other interconnected devices, AlarmWatcher simplifies alarm handling and acknowledgment.

<a target="_blank" href="https://github.com/johnny-de/alarmwatcher"><img src="https://img.shields.io/github/stars/johnny-de/alarmwatcher?style=flat" /></a> 
<a target="_blank" href="https://hub.docker.com/r/johnny-de/alarmwatcher"><img src="https://img.shields.io/docker/pulls/johnny-de/alarmwatcher" /></a> 
<a target="_blank" href="https://hub.docker.com/r/johnny-de/alarmwatcher"><img src="https://img.shields.io/docker/v/johnny-de/alarmwatcher/latest?label=docker%20image%20ver" /></a>
<a target="_blank" href="https://hub.docker.com/r/johnny-de/alarmwatcher"><img src="https://img.shields.io/github/v/release/johnny-de/alarmwatcher" /></a> 
<a target="_blank" href="https://github.com/johnny-de/alarmwatcher"><img src="https://img.shields.io/github/last-commit/johnny-de/alarmwatcher" /></a>
</a>

## Key Features

- **Centralized Alarm Management:** Aggregate and manage alarms from multiple systems in one place.
- **Scalability:** Adaptable for both small-scale smart home environments and large industrial operations.
- **Customizable Alarm Handling:** Define alarm priorities, require acknowledgment, and configure auto-deletion.
- **Built-In Expiration Mechanism:** Automatically remove alarms after a set duration to avoid clutter.
- **Simple, Yet Powerful REST-API:** Easily integrate with any system through a flexible and straightforward http-REST-API.
- **Web-based Frontend:** View and manage alarms through an intuitive web interface, allowing for custom filters to quickly identify active alarms.

## Alarm Handling

AlarmWatcher is built around an efficient alarm handling mechanism where every alarm is identified by a unique ID. Once an alarm is raised, it remains active in the system until one of two conditions is met:

1. The alarm is **cleared** manually or automatically.
2. The defined **duration** for that specific alarm expires.

Each alarm must belong to one of the predefined **alarm classes**, which determine its priority and how it is displayed in the system:

1. **Alarm (Highest Priority - Red):** Critical issues requiring immediate attention.
2. **Warning (Medium Priority - Orange):** Important events that need monitoring but are not critical.
3. **Event (Lowest Priority - Gray):** Informational messages or routine events that require no immediate action.

Alarms are handled entirely by the server, ensuring reliable and consistent behavior across all connected systems. Users can view and manage alarms via a web-based frontend, which supports advanced filtering to make it easy to find and respond to specific alarms.

## Acknowledgment Mechanism

AlarmWatcher also includes an acknowledgment mechanism to ensure critical alarms are not overlooked. When an alarm is raised, it can be marked as requiring acknowledgment. This ensures that even if the alarm is cleared or its defined duration expires, the alarm will remain visible in the system until a user acknowledges it.

Acknowledgment ensures that alarms marked as important are not automatically removed, encouraging users to take manual action and confirm that the alarm has been reviewed. Only once an alarm is acknowledged by the user will it be removed from the active list or auto-deleted.

This feature is especially useful for high-priority alarms, ensuring that critical incidents receive the necessary attention and are not missed by automation or system rules.

## Getting Started

To learn how to install, configure, and run AlarmWatcher, please visit the detailed guide in our [Wiki](https://github.com/johnny-de/alarmwatcher/wiki).

## Milestones

The development of AlarmWatcher is organized into clear milestones to ensure smooth progress and feature delivery. Below is an outline of the planned milestones for version 1.0.0 and beyond.

### Version 1.0.0

The first major release (v1.0.0) will focus on delivering a fully functioning backend and a user-friendly frontend, along with essential features for alarm management.
- **Backend:**
  - Complete and thoroughly test the backend for alarm management, handling alarm states, acknowledgments, and filtering.
  - Ensure stability and reliability for all server-side operations.
- **Frontend:**
  - Implement a fully functional, web-based frontend for monitoring and managing alarms.
  - Integrate notification support, allowing browsers to push notifications into the underlying OS notification systems (e.g., Windows, macOS, Linux).
- **Docker Image:**
  - Create and publish a Docker image on DockerHub to simplify deployment and installation.
- **Wiki Documentation:**
  - Prepare and publish a detailed Wiki to guide users on how to install, configure, and use AlarmWatcher. This will ensure that users can easily set up the system and take advantage of all its features.

### Version 2.0.0

The second major release (v2.0.0) will enhance AlarmWatcher with additional features and interfaces.
- **HTTPS Support:**
  - Add support for secure connections using HTTPS, providing encryption for alarm monitoring and management.
- **Email Interface:**
  - Introduce an interface for receiving alarms via email (SMTP), enabling users to receive critical alerts directly in their inbox.

### Future Milestones

Beyond the core milestones for AlarmWatcher, additional features and extensions are planned to broaden the system's reach and usability.
- **Open-Source Android App:**
  - Develop and release an open-source Android app that allows users to view alarms and receive push notifications on their mobile devices. This will provide greater flexibility for remote alarm monitoring.
- **Public Demo:**
  - Set up a public, free-to-use demo instance of AlarmWatcher, allowing users to test its features with the following limitation: alarms will be saved for a maximum of 100 days.


## Bug Reports / Feature Requests

If you want to report a bug or request a new feature, feel free to open a [new issue](https://github.com/johnny-de/alarmwatcher/issues).
