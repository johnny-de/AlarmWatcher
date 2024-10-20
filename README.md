<div align="center">
    <a href="https://github.com/johnny-de/alarmwatcher">
        <img src="./public/logo.svg" width="350" alt="AlarmWatcher" />
    </a>
</div>

<br>

AlarmWatcher is a versatile, self-hosted and intuitive to use alarm management system. It is designed to serve as the central hub for handling alarms across various applications and systems. Whether you're managing alarms for smart home, industrial equipment, or other interconnected devices, AlarmWatcher simplifies alarm handling.

<a target="_blank" href="https://github.com/johnny-de/alarmwatcher"><img src="https://img.shields.io/github/stars/johnny-de/alarmwatcher?style=flat" /></a> 
<a target="_blank" href="https://github.com/johnny-de/alarmwatcher"><img src="https://img.shields.io/github/v/release/johnny-de/alarmwatcher" /></a> 
<a target="_blank" href="https://github.com/johnny-de/alarmwatcher"><img src="https://img.shields.io/github/last-commit/johnny-de/alarmwatcher" /></a>
<a target="_blank" href="https://hub.docker.com/r/johnnyde/alarmwatcher"><img src="https://img.shields.io/docker/pulls/johnnyde/alarmwatcher" /></a> 
<a target="_blank" href="https://hub.docker.com/r/johnnyde/alarmwatcher"><img src="https://img.shields.io/docker/v/johnnyde/alarmwatcher" /></a>

<div align="center">
    <a href="https://github.com/johnny-de/alarmwatcher/wiki/Screenshots">
        <img src="https://raw.githubusercontent.com/johnny-de/data/refs/heads/main/alarmwatcher/desktop_light.PNG" alt="Screenshot" width="600"/>
    </a>
    <p>
        <a href="https://github.com/johnny-de/alarmwatcher/wiki/Screenshots" target="_blank" style="text-decoration:none;">Click here to view more screenshots.</a>
    </p>
</div>

## Key features

- **Centralized alarm management:** Aggregate and manage alarms from multiple systems in one place.
- **Customizable alarm handling:** Define alarm priorities, require acknowledgment, and configure auto-deletion.
- **Built-in expiration mechanism:** Automatically remove alarms after a set duration to avoid clutter.
- **Simple, yet powerful API:** Easily integrate with any system through a flexible and straightforward http-API.
- **Web-based frontend:** View and manage alarms through an intuitive web interface, allowing for custom filters.

### Alarm handling

AlarmWatcher is built around an mechanism where every alarm is identified by a unique ID. Once an alarm is raised, it remains active in the system until one of two conditions is met:

1. The alarm is **cleared**.
2. The defined **duration** for that specific alarm expires.

Each alarm must belong to one of the predefined alarm classes, which determine its priority and how it is displayed in the system:

1. **Alarm (highest priority - red):** Critical issues requiring immediate attention.
2. **Warning (medium priority - orange):** Important issues that are not yet critical, but may soon become critical if not addressed.
3. **Event (lowest priority - gray):** Informational messages or routine events that require no action.

Alarms are handled entirely by the server. Users can view and manage alarms via a web-based frontend, which supports advanced filtering to make it easy to find and respond to specific alarms.

### Acknowledgment mechanism

AlarmWatcher also includes an acknowledgment mechanism to ensure critical alarms are not overlooked. When an alarm is raised, it can be marked as requiring acknowledgment. This ensures that even if the alarm is cleared or its defined duration expires, the alarm will remain visible in the system until a user acknowledges it.
This feature is especially useful for high-priority alarms, ensuring that critical incidents receive the necessary attention and are not missed by automation or system rules.

## Public demo

You can explore a public demo of AlarmWatcher hosted on Glitch by clicking the link below. This demo showcases regularly updated example alarms, and you are welcome to push your own alarms as well! 

Please keep in mind that the demo may take a little while to load, especially after periods of inactivity. This happens because, on the free plan, the app goes to sleep after five minutes of inactivity, resulting in a loading screen when you visit and the app wakes up.

> [!NOTE]  
> Total access for all users combined (including loading the page and using the API to manage alarms) is limited to around 3000 requests per hour.

[Click here to try the AlarmWatcher (v.1.0.1) Demo.](https://storm-lapis-microraptor.glitch.me/)

## Getting started

To learn how to install, configure, and run AlarmWatcher, please visit the detailed guide in the [Wiki](https://github.com/johnny-de/alarmwatcher/wiki).

## Published versions

This section outlines the major published versions of AlarmWatcher, detailing their key features and enhancements.

### Version 1.0.0

The first major release (v1.0.0) focused on delivering a fully functioning backend and a user-friendly frontend, along with essential features for alarm management.
- **Backend:** Completed and thoroughly tested backend for alarm management, handling alarm states, acknowledgments, and filtering. Ensured stability and reliability for all server-side operations.
- **Frontend:** Fully functional, web-based frontend for monitoring and managing alarms. Basic filtering capabilities, allowing users to filter alarms based on alarm classes. Included support for dark mode, enabling users to switch between a light and dark theme. Notification support for pushing browser notifications to the underlying OS.
- **Docker image:** Docker image on DockerHub to simplify deployment and installation.
- **Wiki documentation:** Wiki to guide users on how to install, configure, and use AlarmWatcher.

## Future milestones

Outlined below are the planned milestones for upcoming versions.

### Version 1.1.0

The second major release (v1.1.0) will enhance AlarmWatcher with additional features and interfaces.
- **HTTPS support:** Add support for secure connections using HTTPS.
- **Email interface:** Introduce an interface for receiving alarms via email (SMTP). Idea is to provide predefined addresses (e.g. uptime-kuma@alarmwatcher) and also allowed users to create custom email-interfaces to raise or clear alarms based on specific keywords in incoming emails.

### Version 1.2.0

The third major release (v1.2.0) will focus on building a comprehensive alarm history system, improving database performance, and optimizing filtering.
- **Alarm archiving:** Introduce an alarm archiving feature, allowing alarms to be stored beyond their active state, creating a history of all alarms.
- **Database optimization:** Optimize the database structure to handle larger datasets efficiently.
- **Advanced filtering:** Improve the filtering capabilities of the frontend, enabling more advanced search options and filtering based on alarm history.

### Future milestones

Beyond the core milestones for AlarmWatcher, additional features and extensions are planned to broaden the system's reach and usability.
- **Open-source android app:** Develop and release an open-source Android app that allows users to view alarms and receive push notifications on their mobile devices.
- **Node-RED integration:** Create AlarmWatcher nodes for Node-RED.
- **Home Assistant integration:** Develop an integration with Home Assistant.
- **Uptime Kuma integration:** Implement an integration with Uptime Kuma.

## Bug reports / feature requests

If you want to report a bug or request a new feature, feel free to open a [new issue](https://github.com/johnny-de/alarmwatcher/issues).
