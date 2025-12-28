
# Enabling Rename / Move (Write Access)

> You can run PICR in read-only mode and enable this later, once it's needed.

By default PICR only has **read** access to your media folder. This is the safest option.

If you want to **rename or move folders** from inside PICR, you must enable write access in two places:


1. **Environment variable**
    - Add `CAN_WRITE=true` to the `environment:` section for the `picr` service.

2. **Docker volume mount**
    - Change the media mount from read-only (`:ro`) to read-write (`:rw`), or just remove `:ro`.

Example:

```yaml
services:
  picr:
    volumes:
      - /path/to/your/media:/home/node/app/media:rw
    environment:
      - CAN_WRITE=true
```

## Why this is risky

Write access means PICR can change your files and folders. If your admin password is leaked, or the server is hacked, an
attacker could rename, move, or delete your media.  
That’s why we keep write access **off by default**.

If you enable it, make sure you:

- Use a strong admin password.
- Keep your server and Docker images up to date.
- Use a reverse proxy, preferably something with fail2ban or other types of security.
- Keep backups of your media and database.

You should obviously be doing this anyway, but it's extra important if it's possible to modify files in the media folder.

## Why would I do this?

PICR is designed to allow you to manage your files _outside_ of PICR (EG: on a network drive).

Unfortunately when you rename a folder that is usually detected as a "folder deleted" and then a "new folder" shortly
after. PICR tries to work out that it's just a rename but that doesn't always work so sometimes the renamed folder will
appear as a new folder. This means it will lose all the users/ratings/comments etc associated with it. Moving/renaming
from within PICR ensures that all the data is still linked.