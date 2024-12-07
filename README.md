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

## Features

- **Centralized alarm management:** Aggregate and manage alarms from multiple systems in one place.
- **Customizable alarm handling:** Define alarm priorities, require acknowledgment, and configure auto-deletion.
- **Simple, yet powerful API:** Easily integrate with any system through a flexible and straightforward http(s)-API.
- **Web-based frontend:** View and manage alarms through an intuitive http(s) web interface.
- **Notifications:** Receive instant notifications about new alarms on every device.
- **PWA Support:** Add AlarmWatcher as an app on your mobile device.

### Alarm handling

AlarmWatcher is built around an mechanism where every alarm is identified by a unique ID. Once an alarm is raised, it remains active in the system until one of two conditions is met:

1. The alarm is **cleared**.
2. The defined **duration** for that specific alarm expires.

Each alarm must belong to one of the predefined alarm classes, which determine its priority and how it is displayed in the system:

1. **Alarm (highest priority - red):** Critical issues requiring immediate attention.
2. **Warning (medium priority - orange):** Important issues that are not yet critical, but may soon become critical if not addressed.
3. **Event (lowest priority - gray):** Informational messages or routine events that require no action.

Alarms are handled entirely by the server. Users can view and manage alarms via a web-based frontend, which supports filtering to make it easy to find and respond to specific alarms.

### Acknowledgment mechanism

AlarmWatcher also includes an acknowledgment mechanism to ensure critical alarms are not overlooked. When an alarm is raised, it can be marked as requiring acknowledgment. This ensures that even if the alarm is cleared or its defined duration expires, the alarm will remain visible in the system until a user acknowledges it.
This feature is especially useful for high-priority alarms, ensuring that critical incidents receive the necessary attention and are not missed by automation or system rules.

### Alarm class transition mechanism

AlarmWatcher also offers an alarm class transition mechanism that allows alarms to change their class after a defined period.
When an alarm is triggered, it starts in its initial alarm class. If a delay time is set, the alarm will transition to a new class after the specified time.
This mechanism can be used to ensure that unresolved issues receive more attention over time and helps filter out short-lived alarms, like a device briefly going offline. 

### Notifications

With Notifications, AlarmWatcher ensures you never miss critical updates by sending alerts directly to your device. Notifications are powered by a service worker, enabling seamless delivery even when AlarmWatcher is not actively open in your browser.

> [!NOTE]  
> For notifications to function, both AlarmWatcher and your device must have internet access.

### PWA support

AlarmWatcher is fully compatible as a Progressive Web App (PWA), which means the web interface works like a native app on supported devices. For mobile users, you can easily add AlarmWatcher to your home screen, and it will function just like an app — no need to download it from an app store.

## Public demo

You can explore a public demo of AlarmWatcher hosted on Glitch by clicking the link below. This demo showcases regularly updated example alarms, and you are welcome to push your own alarms as well!

> [!NOTE]  
> The demo has a shared limit of approximately 3000 requests per hour for all users combined (including page loads and API usage).
Also note that settings and features are disabled in the demo.

[Click here to try the AlarmWatcher (v.1.1.0) demo.](https://aboard-sandy-ring.glitch.me/)

## Getting started

To learn how to install, configure, and run AlarmWatcher, please visit the detailed guide in the [Wiki](https://github.com/johnny-de/alarmwatcher/wiki).

## Future features

Outlined below are the planned features for upcoming versions.

- **Advanced filtering:** Improve the filtering capabilities of the frontend, enabling more advanced search options and filtering based on alarm history.
- **Email interface:** Introduce an interface for receiving alarms via email (SMTP). Idea is to provide predefined addresses (e.g. uptime-kuma@alarmwatcher) and also allowed users to create custom email-interfaces to raise or clear alarms based on specific keywords in incoming emails.
- **Alarm archiving:** Introduce an alarm archiving feature, allowing alarms to be stored beyond their active state, creating a history of all alarms.
- **Database optimization:** Optimize the database structure to handle larger datasets efficiently.

### Additional milestones

Beyond the core milestones for AlarmWatcher, additional features and extensions are planned to broaden the system's reach and usability.
- **Node-RED integration:** Create AlarmWatcher nodes for Node-RED.
- **Home Assistant integration:** Develop an integration with Home Assistant.
- **Uptime Kuma integration:** Implement an integration with Uptime Kuma.

## Bug reports / feature requests

If you want to report a bug or request a new feature, feel free to open a [new issue](https://github.com/johnny-de/alarmwatcher/issues).
