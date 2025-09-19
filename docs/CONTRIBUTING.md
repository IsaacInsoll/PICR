# PICR Contribution Guidelines

PICR is currently a one-man side project to help me distribute photos to my clients in a better way than google drive (nicer experience _and_ cheaper)

I welcome any contributions you would like to make, including but not limited to:

- Documentation: write nicer user-friendly instructions, for PICR users, their customers, or developers
- Testing: improve current vitest backend testing or build front end testing
- Backend: node server
- Frontend: react/vite
- App: expo / react native
- CI / CD, any dev improvements like adding storybook, or anything else you can think of. 

I have a private trello board currently tracking everything that needs to be done, I'm happy to invite you if you want. 

## Getting started
The [Development Docs](docs/development/index.md) should have everything you need to get started. If you need any help just get in touch. 

## Can I send a Pull Request?

If you have found a feature you wanted to add, or a bug to be fixed just send me a PR and I'll review it as soon as I can.

#### Commits / MR titles
Please use [gitmoji](https://gitmoji.dev) and subsystem name where possible eg:
- 🐛 [backend] fix crash if folder renamed
- ⬆️ [app] upgrade expo 53 => 54

#### Code formatting
Please ensure you are using prettier. It's included in dependencies already :)

## Test / Development server

For backend/frontend development you should definitely just use the included docker compose to have a fully operational development environment. 

If you are doing work on the app or docs and would find it easier to have access to a private test server then please get in touch and I can give you the details. 