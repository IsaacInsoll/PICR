# Picr

### Self-hosted online image sharing tool for photographers to share photos with clients.

 👩🏻‍💻 [GitHub](https://github.com/isaacinsoll/picr) | 🐳 [Docker Hub](https://hub.docker.com/repository/docker/isaacinsoll/picr/general)

![](docs/images/picr-header.png)

## Introduction

PICR is your "personal cloud" for photographers/videographers sharing your photos, videos and other files with your clients.

Features and benefits include:
- Cheaper storage: no need to pay for google drive / dropbox
- Better client experience: UI is tailored for clients receiving photo/video from you, rather than a generic shared folder
- Logging of visits: know when your clients have viewed the data
- (optional) Ability for clients to rate / approve / comment on images
- Theming and branding
- Much more coming soon!

## ▶️ How to install
PICR is typically installed on a NAS device using `docker compose`. 

The basic setup is a `picr` container (web server) and a postgres `db` container.

See [Installation Instructions](docs/install.md) for a sample `docker-compose.yml` and further instructions.

## 🧑‍💻 Development

We'd love any help or feedback! 
See [Development Docs](docs/development/index.md) to get started

### 🙏 Special Thanks
Thanks to: 
- Monique for being the worlds greatest wife and putting up with all the time I spent on this 💖
- Mason D for providing a bunch of senior software engineering advice 🧔🏻‍♂️
